import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { isValidGoogleDriveUrl, isValidProductId } from './lib/catalog.js'

const blankDraft = (type) => ({
  id: '',
  isNew: true,
  type,
  title: '',
  category: '',
  creator: '',
  price: '',
  pages: '',
  published: true,
  lessons: type === 'course' ? [{ id: crypto.randomUUID(), title: '', thumbnailUrl: '', driveUrl: '' }] : [],
  storagePath: '',
  file: null,
})

const isValidThumbnailUrl = (value) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function AdminPage({ email, onBack, onSignOut, onCatalogChanged }) {
  const [products, setProducts] = useState([])
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')

  const visibleProducts = useMemo(
    () => filter === 'all' ? products : products.filter((product) => product.type === filter),
    [filter, products],
  )
  const publishedCount = products.filter((product) => product.published).length
  const configuredCount = products.filter((product) => product.type === 'ebook' ? product.storagePath : product.lessons.length).length

  const loadProducts = useCallback(async () => {
    try {
      if (!supabase) throw new Error('Supabase is not configured. Admin management requires a connected backend.')
      const results = await Promise.all([
        supabase.from('courses').select('id,title,category,instructor,price_inr,published').order('title'),
        supabase.from('ebooks').select('id,title,category,author,price_inr,pages,file_format,published').order('title'),
        supabase.from('course_access_links').select('course_id,drive_url'),
        supabase.from('ebook_assets').select('ebook_id,storage_path'),
        supabase.from('course_lessons').select('id,course_id,title,thumbnail_url,drive_url,position').order('position'),
      ])
      const failed = results.find((result) => result.error)
      if (failed?.error) throw failed.error

      const [courseResult, ebookResult, linksResult, assetsResult, lessonsResult] = results
      const links = new Map(linksResult.data.map((item) => [item.course_id, item.drive_url]))
      const assets = new Map(assetsResult.data.map((item) => [item.ebook_id, item.storage_path]))
      const lessonsByCourse = new Map()
      lessonsResult.data.forEach((item) => {
        const lessons = lessonsByCourse.get(item.course_id) ?? []
        lessons.push({
          id: item.id,
          title: item.title,
          thumbnailUrl: item.thumbnail_url ?? '',
          driveUrl: item.drive_url,
        })
        lessonsByCourse.set(item.course_id, lessons)
      })
      setProducts([
        ...courseResult.data.map((item) => ({
          id: item.id,
          type: 'course',
          title: item.title,
          category: item.category,
          creator: item.instructor,
          price: item.price_inr,
          published: item.published,
          lessons: lessonsByCourse.get(item.id)?.length
            ? lessonsByCourse.get(item.id)
            : links.has(item.id)
              ? [{ id: crypto.randomUUID(), title: `${item.title} — Full course`, thumbnailUrl: '', driveUrl: links.get(item.id) }]
              : [],
          storagePath: '',
        })),
        ...ebookResult.data.map((item) => ({
          id: item.id,
          type: 'ebook',
          title: item.title,
          category: item.category,
          creator: item.author,
          price: item.price_inr,
          pages: item.pages,
          fileFormat: item.file_format,
          published: item.published,
          driveUrl: '',
          storagePath: assets.get(item.id) ?? '',
        })),
      ])
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the product catalog.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const editProduct = (product) => {
    setError('')
    setMessage('')
    setDraft({
      ...product,
      isNew: false,
      file: null,
      lessons: product.type === 'course'
        ? (product.lessons.length ? product.lessons : [{ id: crypto.randomUUID(), title: '', thumbnailUrl: '', driveUrl: '' }])
        : [],
    })
  }
  const startNew = (type) => {
    setMessage('')
    setError('')
    setDraft(blankDraft(type))
  }

  const removeProduct = async (product) => {
    if (!supabase || busy) return
    const confirmed = window.confirm(
      `Remove "${product.title}" from the storefront? Existing purchasers will keep access.`,
    )
    if (!confirmed) return

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const table = product.type === 'ebook' ? 'ebooks' : 'courses'
      const { error: updateError } = await supabase
        .from(table)
        .update({ published: false })
        .eq('id', product.id)
      if (updateError) throw updateError

      const adminReloaded = await loadProducts()
      if (!adminReloaded) throw new Error('Product was removed from the storefront, but the admin list could not be refreshed.')
      await onCatalogChanged()
      setMessage(`“${product.title}” is no longer listed. Existing purchasers keep access.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove this product.')
    } finally {
      setBusy(false)
    }
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    if (!supabase || !draft) return

    const id = draft.id.trim()
    const price = Number(draft.price)
    const pages = Number(draft.pages)
    if (!isValidProductId(id)) {
      setError('Use a product ID with lowercase letters, numbers, and single hyphens only.')
      return
    }
    if (!Number.isSafeInteger(price) || price < 0) {
      setError('Enter a whole-number price in INR.')
      return
    }
    if (draft.type === 'ebook' && (!Number.isSafeInteger(pages) || pages < 1)) {
      setError('Enter a valid e-book page count.')
      return
    }
    const lessons = draft.type === 'course'
      ? draft.lessons.filter((lesson) => lesson.title.trim() || lesson.thumbnailUrl.trim() || lesson.driveUrl.trim())
      : []
    if (draft.type === 'course' && draft.published && !lessons.length) {
      setError('Add at least one lesson before publishing this course.')
      return
    }
    if (lessons.some((lesson) => !lesson.title.trim() || !isValidGoogleDriveUrl(lesson.driveUrl.trim()))) {
      setError('Each course lesson needs a title and a secure Google Drive or Google Docs link.')
      return
    }
    if (lessons.some((lesson) => lesson.thumbnailUrl.trim() && !isValidThumbnailUrl(lesson.thumbnailUrl.trim()))) {
      setError('Lesson thumbnails must use secure HTTPS image URLs.')
      return
    }
    if (draft.published && draft.type === 'ebook' && !draft.file && !draft.storagePath) {
      setError('Upload the e-book PDF before publishing this product.')
      return
    }
    if (draft.file && (draft.file.type !== 'application/pdf' || draft.file.size > 100 * 1024 * 1024)) {
      setError('Choose a PDF file smaller than 100 MB.')
      return
    }
    if (!draft.title.trim() || !draft.category.trim() || !draft.creator.trim()) {
      setError('Complete the title, category, and author/instructor fields.')
      return
    }
    if (draft.isNew && products.some((product) => product.id === id)) {
      setError('That product ID already exists. Choose a unique product ID.')
      return
    }
    if (!draft.isNew && products.some((product) => product.id === id && product.type !== draft.type)) {
      setError('That product ID is already in use by another product type.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    const wasExisting = !draft.isNew
    try {
      const common = {
        id,
        title: draft.title.trim(),
        category: draft.category.trim(),
        price_inr: price,
        published: Boolean(draft.published),
      }
      const productResult = draft.type === 'ebook'
        ? await supabase.from('ebooks').upsert({ ...common, author: draft.creator.trim(), pages, file_format: 'PDF' })
        : await supabase.from('courses').upsert({ ...common, instructor: draft.creator.trim() })
      if (productResult.error) throw productResult.error

      if (draft.type === 'course') {
        const lessonRows = lessons.map((lesson, index) => ({
          id: lesson.id,
          course_id: id,
          title: lesson.title.trim(),
          thumbnail_url: lesson.thumbnailUrl.trim() || null,
          drive_url: lesson.driveUrl.trim(),
          position: index + 1,
        }))
        if (lessonRows.length) {
          const lessonResult = await supabase.from('course_lessons').upsert(lessonRows, { onConflict: 'id' })
          if (lessonResult.error) {
            setMessage('Course details were saved, but its lessons were not updated.')
            throw lessonResult.error
          }
          const lessonIds = lessonRows.map((lesson) => lesson.id)
          const deleteResult = await supabase.from('course_lessons').delete().eq('course_id', id).not('id', 'in', `(${lessonIds.join(',')})`)
          if (deleteResult.error) {
            setMessage('Course lessons were saved, but removed lessons could not be cleaned up.')
            throw deleteResult.error
          }
        } else {
          const deleteResult = await supabase.from('course_lessons').delete().eq('course_id', id)
          if (deleteResult.error) throw deleteResult.error
        }
        const legacyResult = await supabase.from('course_access_links').delete().eq('course_id', id)
        if (legacyResult.error) throw legacyResult.error
      }

      if (draft.type === 'ebook' && draft.file) {
        const safeName = draft.file.name.replace(/[^A-Za-z0-9._-]/g, '-')
        const storagePath = `${id}/${safeName}`
        const uploadResult = await supabase.storage
          .from('ebooks')
          .upload(storagePath, draft.file, { upsert: true, contentType: 'application/pdf' })
        if (uploadResult.error) {
          setMessage('Product details were saved, but the PDF upload failed.')
          throw uploadResult.error
        }
        const assetResult = await supabase.from('ebook_assets').upsert({
          ebook_id: id,
          storage_path: storagePath,
          updated_at: new Date().toISOString(),
        })
        if (assetResult.error) {
          setMessage('The PDF was uploaded, but its access record was not saved.')
          throw assetResult.error
        }
      }

      const catalogReloaded = await loadProducts()
      if (!catalogReloaded) throw new Error('Product was saved, but the administrator catalog could not be refreshed.')
      await onCatalogChanged()
      setDraft(null)
      setMessage(wasExisting ? 'Product updated.' : 'Product added to the catalog.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save this product.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">INFINIVIUM · ADMIN</p>
          <h1>Product studio</h1>
          <p>Manage your storefront, e-book files, and course delivery links.</p>
        </div>
        <div className="admin-top-actions">
          <span>{email}</span>
          <button className="button button-outline" onClick={onSignOut}>Sign out</button>
          <button className="button button-dark" onClick={onBack}>Back to storefront</button>
        </div>
      </header>

      <section className="admin-metrics" aria-label="Catalog summary">
        <article><span>Total products</span><strong>{products.length}</strong></article>
        <article><span>Published</span><strong>{publishedCount}</strong></article>
        <article><span>Delivery configured</span><strong>{configuredCount} / {products.length}</strong></article>
      </section>

      <section className="admin-workspace">
        <div className="admin-list-panel">
          <div className="admin-section-heading">
            <div><p className="eyebrow">YOUR CATALOG</p><h2>Products</h2></div>
            <div className="admin-create-actions">
              <button className="button button-outline" onClick={() => startNew('ebook')}>Add e-book</button>
              <button className="button button-dark" onClick={() => startNew('course')}>Add course</button>
            </div>
          </div>
          <div className="admin-filters" aria-label="Filter products">
            {['all', 'ebook', 'course'].map((value) => (
              <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
                {value === 'all' ? 'All products' : value === 'ebook' ? 'E-books' : 'Courses'}
              </button>
            ))}
          </div>
          {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
          {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
          {loading ? <p className="admin-empty">Loading catalog…</p>
            : visibleProducts.length ? (
              <div className="admin-product-list">
                {visibleProducts.map((product) => (
                  <article className="admin-product-row" key={`${product.type}-${product.id}`}>
                    <div className="admin-product-mark">{product.type === 'ebook' ? 'PDF' : 'DRIVE'}</div>
                    <div className="admin-product-details">
                      <strong>{product.title}</strong>
                      <span>{product.type === 'ebook' ? 'E-book' : 'Course'} · {product.category} · ₹{product.price}</span>
                    </div>
                    <span className={`admin-status${product.published ? ' published' : ''}`}>{product.published ? 'Published' : 'Draft'}</span>
                    <button className="button button-outline" onClick={() => editProduct(product)}>Edit</button>
                    <button className="admin-remove-button" disabled={busy} onClick={() => product.published ? removeProduct(product) : editProduct({ ...product, published: true })}>{product.published ? 'Remove' : 'Publish'}</button>
                  </article>
                ))}
              </div>
            ) : <p className="admin-empty">No products in this view yet. Add one to get started.</p>}
        </div>

        <aside className="admin-help-panel">
          <p className="eyebrow">DELIVERY CHECKLIST</p>
          <h2>Ready for customers?</h2>
          <ul>
            <li>Publish the product to show it in the storefront.</li>
            <li>E-books need a PDF uploaded to private Supabase Storage.</li>
            <li>Published courses need lesson titles and a Google Drive link for each recording.</li>
            <li>Purchases are not enabled until verified payment fulfillment is connected.</li>
          </ul>
          <p>Google Drive links can be forwarded by recipients. For stricter control, configure Drive access for named accounts.</p>
        </aside>
      </section>

      {draft && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) setDraft(null)
        }}>
          <section className="admin-editor" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
            <div className="admin-editor-heading">
              <div><p className="eyebrow">{draft.id ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</p><h2 id="admin-editor-title">{draft.id ? draft.title : `Add an ${draft.type === 'ebook' ? 'e-book' : 'course'}`}</h2></div>
              <button className="admin-close" onClick={() => setDraft(null)} disabled={busy} aria-label="Close editor">×</button>
            </div>
            <form className="admin-form" onSubmit={saveProduct}>
              <label>Product ID
                <input value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} placeholder="creative-branding-guide" required pattern="[a-z0-9]+(-[a-z0-9]+)*" disabled={!draft.isNew} />
                <small>Lowercase letters, numbers, and hyphens. Keep an existing ID unchanged.</small>
              </label>
              <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} maxLength="160" required /></label>
              <div className="admin-form-grid">
                <label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} maxLength="80" required /></label>
                <label>{draft.type === 'ebook' ? 'Author' : 'Instructor'}<input value={draft.creator} onChange={(event) => setDraft({ ...draft, creator: event.target.value })} maxLength="120" required /></label>
              </div>
              <div className="admin-form-grid">
                <label>Price (INR)<input type="number" min="0" step="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} required /></label>
                {draft.type === 'ebook' && <label>Pages<input type="number" min="1" step="1" value={draft.pages} onChange={(event) => setDraft({ ...draft, pages: event.target.value })} required /></label>}
              </div>
              {draft.type === 'course'
                ? <fieldset className="admin-lesson-editor">
                    <legend>Course lessons</legend>
                    <small>Add one row per recording. Students will see these in order in their course playlist.</small>
                    {draft.lessons.map((lesson, index) => (
                      <div className="admin-lesson-fields" key={lesson.id}>
                        <div className="admin-lesson-heading"><strong>Lesson {index + 1}</strong><button type="button" className="admin-remove-button" onClick={() => setDraft({ ...draft, lessons: draft.lessons.filter((item) => item.id !== lesson.id) })}>Remove</button></div>
                        <label>Lesson title<input value={lesson.title} onChange={(event) => setDraft({ ...draft, lessons: draft.lessons.map((item) => item.id === lesson.id ? { ...item, title: event.target.value } : item) })} maxLength="160" placeholder="e.g. Finding your visual direction" /></label>
                        <label>Thumbnail image URL <span>(optional)</span><input type="url" value={lesson.thumbnailUrl} onChange={(event) => setDraft({ ...draft, lessons: draft.lessons.map((item) => item.id === lesson.id ? { ...item, thumbnailUrl: event.target.value } : item) })} placeholder="https://…" /></label>
                        <label>Google Drive recording link<input type="url" value={lesson.driveUrl} onChange={(event) => setDraft({ ...draft, lessons: draft.lessons.map((item) => item.id === lesson.id ? { ...item, driveUrl: event.target.value } : item) })} placeholder="https://drive.google.com/…" /></label>
                      </div>
                    ))}
                    <button type="button" className="button button-outline" onClick={() => setDraft({ ...draft, lessons: [...draft.lessons, { id: crypto.randomUUID(), title: '', thumbnailUrl: '', driveUrl: '' }] })}>Add lesson</button>
                  </fieldset>
                : <label>E-book PDF
                    <input type="file" accept="application/pdf,.pdf" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] ?? null })} />
                    <small>{draft.storagePath ? `Current file: ${draft.storagePath}. Choose a PDF to replace it.` : 'PDF only, up to 100 MB. Stored in the private ebooks bucket.'}</small>
                  </label>}
              <label className="admin-publish-toggle"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Published in the storefront</label>
              <div className="admin-editor-actions">
                <button type="button" className="button button-outline" onClick={() => setDraft(null)} disabled={busy}>Cancel</button>
                <button type="submit" className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
              </div>
              {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default AdminPage
