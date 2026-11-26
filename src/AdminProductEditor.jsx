import { useState } from 'react'
import { createProductIdFromTitle, isValidGoogleDriveUrl, isValidHttpsImageUrl, isValidProductCoverFile, isValidProductId } from './lib/catalog.js'
import Notice from './components/Notice.jsx'

const steps = ['Product details', 'Delivery & pricing', 'Review & publish']

function AdminProductEditor({
  draft,
  step,
  busy,
  error,
  coverPreview,
  onChange,
  onCoverChange,
  onStepChange,
  onSave,
  onPublish,
  onBack,
  onClearError,
  onMoveLesson,
  onRemoveLesson,
  onAddLesson,
}) {
  const [coverDragging, setCoverDragging] = useState(false)
  const isEbook = draft.type === 'ebook'
  const productLabel = isEbook ? 'e-book' : 'course'
  const lessonsReady = !isEbook
    && draft.lessons.length > 0
    && draft.lessons.every((lesson) => lesson.title.trim()
      && isValidGoogleDriveUrl(lesson.driveUrl.trim())
      && (!lesson.thumbnailUrl.trim() || isValidHttpsImageUrl(lesson.thumbnailUrl.trim())))
  const coverReady = Boolean(draft.coverPath) || isValidProductCoverFile(draft.coverFile)
  const ebookFileReady = Boolean(draft.storagePath)
    || Boolean(draft.file && draft.file.type === 'application/pdf' && draft.file.size <= 100 * 1024 * 1024)
  const deliveryReady = isEbook
    ? Boolean(ebookFileReady && Number.isSafeInteger(Number(draft.pages)) && Number(draft.pages) > 0)
    : lessonsReady
  const basicsReady = Boolean(isValidProductId(draft.id.trim())
    && draft.title.trim()
    && draft.creator.trim()
    && draft.category.trim()
    && draft.description.trim()
    && draft.price !== ''
    && Number.isSafeInteger(Number(draft.price))
    && Number(draft.price) >= 0)
  const publishReady = basicsReady && coverReady && deliveryReady

  const setField = (field, value) => {
    onClearError()
    onChange({ [field]: value })
  }

  const updateTitle = (value) => {
    onClearError()
    onChange({
      title: value,
      ...(draft.isNew && !draft.idManuallyEdited ? { id: createProductIdFromTitle(value) } : {}),
    })
  }

  const updateLesson = (lessonId, field, value) => {
    onClearError()
    onChange({
      lessons: draft.lessons.map((lesson) => lesson.id === lessonId
        ? { ...lesson, [field]: value }
        : lesson),
    })
  }

  const continueToNextStep = () => {
    if (step === 0) {
      if (!draft.title.trim() || !draft.creator.trim() || !draft.category.trim()) {
        onClearError()
        return onChange({ validationError: 'Add a title, category, and author or instructor to continue.' })
      }
      if (!draft.id.trim()) {
        onClearError()
        return onChange({ validationError: 'Add a title with Latin letters or enter a product ID to continue.' })
      }
    }

    if (step === 1) {
      const price = Number(draft.price)
      if (draft.price === '' || !Number.isSafeInteger(price) || price < 0) {
        onChange({ validationError: 'Enter a whole-number price in INR to continue.' })
        return
      }
      if (isEbook && (!Number.isSafeInteger(Number(draft.pages)) || Number(draft.pages) < 1)) {
        onChange({ validationError: 'Enter the e-book page count to continue.' })
        return
      }
    }

    onClearError()
    onStepChange(step + 1)
  }

  const showError = error || draft.validationError

  return (
    <main className="studio-page studio-editor-page">
      <header className="studio-header">
        <div className="studio-brand-lockup">
          <span className="studio-brand-name">infinivium<span>.</span></span>
          <span className="studio-brand-divider" aria-hidden="true" />
          <span className="studio-brand-context">Product studio</span>
        </div>
        <button type="button" className="studio-button studio-button-secondary" onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : draft.published ? 'Save changes' : 'Save draft'}
        </button>
      </header>

      <div className="studio-editor-intro">
        <button type="button" className="studio-back-link" onClick={onBack}>Products</button>
        <span className="studio-breadcrumb-divider">/</span>
        <span>{draft.isNew ? 'New product' : 'Edit product'}</span>
        <h1>{draft.isNew ? `Set up your ${productLabel}` : `Edit ${draft.title || productLabel}`}</h1>
        <p>Prepare the listing and delivery, then review everything before it goes live.</p>
      </div>

      <nav className="studio-stepper" aria-label="Product setup steps">
        {steps.map((label, index) => (
          <button
            type="button"
            className={`studio-step${step === index ? ' is-active' : ''}${step > index ? ' is-complete' : ''}`}
            key={label}
            aria-current={step === index ? 'step' : undefined}
            onClick={() => {
              if (index < step) {
                onClearError()
                onStepChange(index)
              }
            }}
            disabled={index > step || busy}
          >
            <span className="studio-step-number">{index + 1}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {showError && <Notice variant="error" title="Check this detail" onDismiss={() => {
        onClearError()
        if (draft.validationError) onChange({ validationError: '' })
      }}>{showError}</Notice>}

      <form className="studio-editor-form" onSubmit={(event) => {
        event.preventDefault()
        onPublish()
      }}>
        {step === 0 && (
          <section className="studio-form-panel" aria-labelledby="product-details-heading">
            <div className="studio-panel-heading">
              <h2 id="product-details-heading">Tell learners about your {productLabel}</h2>
              <p>These details appear on the storefront.</p>
            </div>
            <div className="studio-fields-grid">
              <div className="studio-field studio-field-wide">
                <span>Thumbnail <b>Required to publish</b></span>
                <label
                  className={`studio-cover-upload${coverPreview ? ' has-preview' : ''}${coverDragging ? ' is-dragging' : ''}`}
                  onDragOver={(event) => { event.preventDefault(); setCoverDragging(true) }}
                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCoverDragging(false) }}
                  onDrop={(event) => {
                    event.preventDefault()
                    setCoverDragging(false)
                    onCoverChange(event.dataTransfer.files?.[0] ?? null)
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => onCoverChange(event.target.files?.[0] ?? null)}
                  />
                  {coverPreview
                    ? <><img src={coverPreview} alt={`Cover for ${draft.title || productLabel}`} /><span>Drop an image here or choose another image</span></>
                    : <><strong>Upload thumbnail</strong><span>Drop an image here or choose from your device · JPEG, PNG, or WebP · up to 5 MB</span></>}
                </label>
                {draft.coverPath && !draft.coverFile && (
                  <button type="button" className="studio-text-button" onClick={() => setField('coverPath', '')}>Remove current thumbnail</button>
                )}
              </div>
              <label className="studio-field studio-field-wide">
                <span>{isEbook ? 'E-book title' : 'Course title'} <b>Required</b></span>
                <input
                  autoComplete="off"
                  maxLength="160"
                  value={draft.title}
                  onChange={(event) => updateTitle(event.target.value)}
                  placeholder={isEbook ? 'e.g. The Creative Practice Handbook' : 'e.g. Foundations of Creative Practice'}
                  required
                />
              </label>
              <label className="studio-field">
                <span>Product ID <b>Required</b></span>
                <input
                  autoComplete="off"
                  maxLength="120"
                  value={draft.id}
                  onChange={(event) => {
                    onClearError()
                    onChange({ idManuallyEdited: true, id: event.target.value })
                  }}
                  placeholder="generated-from-title"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  disabled={!draft.isNew}
                  required
                />
                <small>Lowercase letters, numbers, and single hyphens. This becomes part of the product link.</small>
              </label>
              <label className="studio-field">
                <span>{isEbook ? 'Author name' : 'Instructor name'} <b>Required</b></span>
                <input
                  autoComplete="name"
                  maxLength="120"
                  value={draft.creator}
                  onChange={(event) => setField('creator', event.target.value)}
                  placeholder="Name learners will see"
                  required
                />
              </label>
              <label className="studio-field">
                <span>Category <b>Required</b></span>
                <input
                  list="studio-product-categories"
                  maxLength="80"
                  value={draft.category}
                  onChange={(event) => setField('category', event.target.value)}
                  placeholder="Choose or enter a category"
                  required
                />
                <datalist id="studio-product-categories">
                  <option value="Design" />
                  <option value="Photography" />
                  <option value="Wellness" />
                  <option value="Writing" />
                  <option value="Art" />
                </datalist>
              </label>
              <label className="studio-field studio-field-wide">
                <span>Short description <b>Required to publish</b></span>
                <textarea
                  maxLength="600"
                  rows="4"
                  value={draft.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder="What will learners read or learn? Be specific about what this product includes."
                />
                <small>{draft.description.length} / 600 characters</small>
              </label>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="studio-form-panel" aria-labelledby="delivery-heading">
            <div className="studio-panel-heading">
              <h2 id="delivery-heading">Prepare {isEbook ? 'your file' : 'your course content'}</h2>
              <p>{isEbook
                ? 'Add the downloadable PDF and set the page count and price.'
                : 'Add chapters in the order learners should follow. Drive links stay private to enrolled learners.'}</p>
            </div>
            <div className="studio-fields-grid">
              {isEbook ? (
                <>
                  <label className="studio-field">
                    <span>Page count <b>Required</b></span>
                    <input type="number" min="1" step="1" value={draft.pages} onChange={(event) => setField('pages', event.target.value)} required />
                  </label>
                  <label className="studio-field">
                    <span>Price (INR) <b>Required</b></span>
                    <input type="number" min="0" step="1" value={draft.price} onChange={(event) => setField('price', event.target.value)} required />
                  </label>
                  <label className="studio-field studio-field-wide">
                    <span>E-book PDF <b>{draft.storagePath ? 'Current file saved' : 'Required to publish'}</b></span>
                    <input type="file" accept="application/pdf,.pdf" onChange={(event) => setField('file', event.target.files?.[0] ?? null)} />
                    <small>{draft.storagePath
                      ? `Current file: ${draft.storagePath}. Choose a new PDF to replace it.`
                      : 'PDF only, up to 100 MB. Files are stored privately for purchasers.'}</small>
                  </label>
                </>
              ) : (
                <>
                  <label className="studio-field studio-field-wide">
                    <span>Price (INR) <b>Required</b></span>
                    <input type="number" min="0" step="1" value={draft.price} onChange={(event) => setField('price', event.target.value)} required />
                  </label>
                  <div className="studio-field studio-field-wide">
                    <div className="studio-lessons-heading">
                      <div><h3>Course chapters</h3><p>Add a chapter title and its Google Drive or Docs recording link.</p></div>
                      <button type="button" className="studio-button studio-button-secondary" onClick={onAddLesson}>Add chapter</button>
                    </div>
                    <div className="studio-lessons-list">
                      {draft.lessons.map((lesson, index) => (
                        <fieldset className="studio-lesson" key={lesson.id}>
                          <legend>Chapter {index + 1}</legend>
                          <div className="studio-lesson-actions">
                            <button type="button" className="studio-button studio-button-small" onClick={() => onMoveLesson(index, -1)} disabled={index === 0 || busy}>Move up</button>
                            <button type="button" className="studio-button studio-button-small" onClick={() => onMoveLesson(index, 1)} disabled={index === draft.lessons.length - 1 || busy}>Move down</button>
                            <button type="button" className="studio-button studio-button-danger studio-button-small" onClick={() => onRemoveLesson(lesson.id)} disabled={busy}>Remove</button>
                          </div>
                          <label className="studio-field">
                            <span>Chapter title <b>Required to publish</b></span>
                            <input maxLength="160" value={lesson.title} onChange={(event) => updateLesson(lesson.id, 'title', event.target.value)} placeholder="e.g. Finding your visual direction" />
                          </label>
                          <label className="studio-field">
                            <span>Google Drive or Docs link <b>Required to publish</b></span>
                            <input type="url" value={lesson.driveUrl} onChange={(event) => updateLesson(lesson.id, 'driveUrl', event.target.value)} placeholder="https://drive.google.com/…" />
                            <small>Use a secure Drive or Google Docs link. Learners need access to the recording after enrollment.</small>
                          </label>
                          <label className="studio-field">
                            <span>Chapter thumbnail <b>Optional</b></span>
                            <input type="url" value={lesson.thumbnailUrl} onChange={(event) => updateLesson(lesson.id, 'thumbnailUrl', event.target.value)} placeholder="https://example.com/image.jpg" />
                            <small>Optional image URL; it must use HTTPS.</small>
                          </label>
                        </fieldset>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="studio-form-panel" aria-labelledby="review-heading">
            <div className="studio-panel-heading">
              <h2 id="review-heading">Review before you publish</h2>
              <p>Check how your product is set up. You can go back to change any detail.</p>
            </div>
            <div className="studio-review">
              <div className="studio-review-product">
                {coverPreview
                  ? <img src={coverPreview} alt="" />
                  : <div className="studio-cover-placeholder">Cover not added</div>}
                <div>
                  <span className="studio-review-type">{isEbook ? 'E-BOOK' : 'COURSE'} · {draft.category || 'No category'}</span>
                  <h3>{draft.title || 'Untitled product'}</h3>
                  <p>{isEbook ? 'By' : 'With'} {draft.creator || 'No author or instructor'}</p>
                  <p>{draft.description || 'Add a description so learners know what they will get.'}</p>
                </div>
              </div>
              <div className="studio-review-details">
                <h3>Listing details</h3>
                <div><span>Product ID</span><strong>{draft.id || 'Not set'}</strong></div>
                <div><span>Price</span><strong>{draft.price === '' ? 'Not set' : `₹${draft.price} INR`}</strong></div>
                {isEbook
                  ? <div><span>PDF</span><strong>{draft.file?.name || (draft.storagePath ? 'Uploaded' : 'Not added')}</strong></div>
                  : <div><span>Chapters</span><strong>{draft.lessons.filter((lesson) => lesson.title.trim() || lesson.driveUrl.trim()).length}</strong></div>}
                <div><span>Storefront state</span><strong>{draft.published ? 'Published' : 'Draft'}</strong></div>
              </div>
              <div className="studio-checklist">
                <h3>Publish checklist</h3>
                <ul>
                  <ChecklistItem complete={Boolean(isValidProductId(draft.id.trim()) && draft.title.trim() && draft.creator.trim() && draft.category.trim() && draft.description.trim())}>
                    Product ID, title, author, category, and description
                  </ChecklistItem>
                  <ChecklistItem complete={coverReady}>Product cover image</ChecklistItem>
                  <ChecklistItem complete={draft.price !== '' && Number.isSafeInteger(Number(draft.price)) && Number(draft.price) >= 0}>
                    Whole-number price in INR
                  </ChecklistItem>
                  {isEbook
                    ? <>
                        <ChecklistItem complete={Number.isSafeInteger(Number(draft.pages)) && Number(draft.pages) > 0}>Page count</ChecklistItem>
                        <ChecklistItem complete={ebookFileReady}>Private PDF file</ChecklistItem>
                      </>
                    : <ChecklistItem complete={lessonsReady}>At least one chapter with a valid Drive link</ChecklistItem>}
                </ul>
                {!publishReady && <p className="studio-checklist-hint">Complete the remaining items before publishing. You can save this as a draft and finish later.</p>}
              </div>
            </div>
          </section>
        )}

        <footer className="studio-editor-actions">
          <button type="button" className="studio-button studio-button-secondary" onClick={step === 0 ? onBack : () => onStepChange(step - 1)} disabled={busy}>
            {step === 0 ? 'Back to products' : 'Previous'}
          </button>
          <div className="studio-editor-actions-end">
            <button type="button" className="studio-button studio-button-secondary" onClick={onSave} disabled={busy}>
              {busy ? 'Saving…' : draft.published ? 'Save changes' : 'Save draft'}
            </button>
            {step < 2
              ? <button type="button" className="studio-button studio-button-primary" onClick={continueToNextStep} disabled={busy}>Continue</button>
              : <button type="submit" className="studio-button studio-button-primary" disabled={busy || !publishReady}>
                  {busy ? 'Saving…' : draft.published ? 'Save and publish updates' : `Publish ${productLabel}`}
                </button>}
          </div>
        </footer>
      </form>
    </main>
  )
}

function ChecklistItem({ complete, children }) {
  return (
    <li className={complete ? 'is-complete' : ''}>
      <span className="studio-checkmark" aria-hidden="true" />
      <span>{children}</span>
      <strong>{complete ? 'Ready' : 'Needed'}</strong>
    </li>
  )
}

export default AdminProductEditor
