import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminProductEditor from './AdminProductEditor.jsx'
import Notice from './components/Notice.jsx'
import { createProductIdFromTitle, isValidGoogleDriveUrl, isValidHttpsImageUrl, isValidProductCoverFile, isValidProductId } from './lib/catalog.js'
import { friendlyMessage } from './lib/messages.js'
import { supabase } from './lib/supabase.js'

const blankDraft = (type) => ({
  id: '',
  idManuallyEdited: false,
  isNew: true,
  type,
  title: '',
  category: '',
  creator: '',
  description: '',
  coverPath: '',
  coverFile: null,
  price: '',
  pages: '',
  published: false,
  lessons: type === 'course' ? [{ id: crypto.randomUUID(), title: '', thumbnailUrl: '', driveUrl: '' }] : [],
  storagePath: '',
  file: null,
})

const productFromRow = (product) => ({
  ...product,
  isNew: false,
  idManuallyEdited: true,
  file: null,
  coverFile: null,
  lessons: product.type === 'course'
    ? (product.lessons.length
      ? product.lessons
      : [{ id: crypto.randomUUID(), title: '', thumbnailUrl: '', driveUrl: '' }])
    : [],
})

const parseStudioRoute = (pathname = window.location.pathname) => {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'studio' || segments[1] !== 'products') return { mode: 'list' }
  if (segments[2] === 'new' && ['course', 'ebook'].includes(segments[3])) {
    return { mode: 'new', type: segments[3] }
  }
  if (['course', 'ebook'].includes(segments[2]) && segments[4] === 'edit') {
    return { mode: 'edit', type: segments[2], id: decodeURIComponent(segments[3] ?? '') }
  }
  return { mode: 'list' }
}

const studioPath = (route) => {
  if (route.mode === 'new') return `/studio/products/new/${route.type}`
  if (route.mode === 'edit') return `/studio/products/${route.type}/${encodeURIComponent(route.id)}/edit`
  return '/studio'
}

const publicCoverUrl = (path) => path && supabase
  ? supabase.storage.from('product-covers').getPublicUrl(path).data.publicUrl
  : ''

function AdminPage({ email, onBack, onSignOut, onCatalogChanged }) {
  const [products, setProducts] = useState([])
  const [route, setRoute] = useState(() => parseStudioRoute())
  const [draft, setDraft] = useState(() => {
    const initialRoute = parseStudioRoute()
    return initialRoute.mode === 'new' ? blankDraft(initialRoute.type) : null
  })
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [productsReady, setProductsReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [coverPreview, setCoverPreview] = useState('')

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchesType = filter === 'all' || product.type === filter
      const matchesSearch = !query
        || `${product.title} ${product.category} ${product.creator}`.toLowerCase().includes(query)
      return matchesType && matchesSearch
    })
  }, [filter, products, search])
  const publishedCount = products.filter((product) => product.published).length
  const configuredCount = products.filter((product) => product.type === 'ebook'
    ? Boolean(product.storagePath)
    : product.lessons.some((lesson) => lesson.title.trim() && lesson.driveUrl.trim())).length

  const clearError = () => {
    setError('')
    setDraft((current) => current ? { ...current, validationError: '' } : current)
  }
  const updateDraft = (updates) => {
    setDraft((current) => current
      ? { ...current, ...updates, validationError: updates.validationError ?? '' }
      : current)
  }

  const navigateStudio = (nextRoute, replace = false) => {
    const path = studioPath(nextRoute)
    if (`${window.location.pathname}${window.location.search}` !== path) {
      window.history[replace ? 'replaceState' : 'pushState']({ infiniviumStudio: true }, '', path)
    }
    setRoute(nextRoute)
  }

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase is not configured. Admin management requires a connected backend.')
      const results = await Promise.all([
        supabase.from('courses').select('id,title,category,instructor,description,cover_path,price_inr,published').order('title'),
        supabase.from('ebooks').select('id,title,category,author,description,cover_path,price_inr,pages,file_format,published').order('title'),
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
          driveUrl: item.drive_url ?? '',
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
          description: item.description ?? '',
          coverPath: item.cover_path ?? '',
          price: item.price_inr,
          published: item.published,
          lessons: lessonsByCourse.get(item.id)?.length
            ? lessonsByCourse.get(item.id)
            : links.has(item.id)
              ? [{ id: crypto.randomUUID(), title: `${item.title} — Full course`, thumbnailUrl: '', driveUrl: links.get(item.id) ?? '' }]
              : [],
          storagePath: '',
        })),
        ...ebookResult.data.map((item) => ({
          id: item.id,
          type: 'ebook',
          title: item.title,
          category: item.category,
          creator: item.author,
          description: item.description ?? '',
          coverPath: item.cover_path ?? '',
          price: item.price_inr,
          pages: item.pages,
          fileFormat: item.file_format,
          published: item.published,
          lessons: [],
          driveUrl: '',
          storagePath: assets.get(item.id) ?? '',
        })),
      ])
      setCatalogError('')
      return true
    } catch (requestError) {
      setCatalogError(friendlyMessage(requestError, 'admin'))
      return false
    } finally {
      setLoading(false)
      setProductsReady(true)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const onPopState = () => {
      const nextRoute = parseStudioRoute()
      setRoute(nextRoute)
      setDraft(nextRoute.mode === 'new' ? blankDraft(nextRoute.type) : null)
      setStep(0)
      setError('')
      setMessage('')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const coverFile = draft?.coverFile
  const coverPath = draft?.coverPath
  useEffect(() => {
    if (coverFile) {
      const previewUrl = URL.createObjectURL(coverFile)
      setCoverPreview(previewUrl)
      return () => URL.revokeObjectURL(previewUrl)
    }
    setCoverPreview(supabase ? publicCoverUrl(coverPath) : '')
    return undefined
  }, [coverFile, coverPath])

  useEffect(() => {
    if (route.mode !== 'edit' || draft || !productsReady) return
    const product = products.find((item) => item.type === route.type && item.id === route.id)
    if (!product) {
      setError('That product could not be found. Return to the product list and try again.')
      navigateStudio({ mode: 'list' }, true)
      return
    }
    setDraft(productFromRow(product))
  }, [draft, products, productsReady, route])

  const backToProducts = () => {
    navigateStudio({ mode: 'list' }, true)
    setDraft(null)
    setStep(0)
    setError('')
  }

  const startNew = (type) => {
    clearError()
    setMessage('')
    setDraft(blankDraft(type))
    setStep(0)
    navigateStudio({ mode: 'new', type })
  }

  const editProduct = (product) => {
    clearError()
    setMessage('')
    setDraft(productFromRow(product))
    setStep(0)
    navigateStudio({ mode: 'edit', type: product.type, id: product.id })
  }

  const moveLesson = (index, direction) => {
    if (!draft) return
    const destination = index + direction
    if (destination < 0 || destination >= draft.lessons.length) return
    const lessons = [...draft.lessons]
    ;[lessons[index], lessons[destination]] = [lessons[destination], lessons[index]]
    updateDraft({ lessons })
  }

  const addLesson = () => {
    if (!draft) return
    updateDraft({
      lessons: [...draft.lessons, { id: crypto.randomUUID(), title: '', thumbnailUrl: '', driveUrl: '' }],
    })
  }

  const removeLesson = (lessonId) => {
    if (!draft) return
    updateDraft({ lessons: draft.lessons.filter((lesson) => lesson.id !== lessonId) })
  }

  const removeProduct = async (product) => {
    if (!supabase || busy) return
    const confirmed = window.confirm(
      `Remove "${product.title}" from the storefront? Existing purchasers will keep access.`,
    )
    if (!confirmed) return

    setBusy(true)
    clearError()
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
      setError(friendlyMessage(requestError, 'admin'))
    } finally {
      setBusy(false)
    }
  }

  const saveProduct = async (publishOverride) => {
    if (!draft || busy) return
    if (!supabase) {
      setError('Supabase is not configured. Connect the backend before saving products.')
      return
    }

    const id = draft.id.trim() || createProductIdFromTitle(draft.title)
    const price = Number(draft.price)
    const pages = Number(draft.pages)
    const shouldPublish = publishOverride ?? Boolean(draft.published)
    if (!isValidProductId(id)) {
      setError('Use a product ID with lowercase letters, numbers, and single hyphens only.')
      return
    }
    if (!Number.isSafeInteger(price) || price < 0) {
      setError('Enter a whole-number price in INR.')
      return
    }
    if (!draft.title.trim() || !draft.category.trim() || !draft.creator.trim()) {
      setError('Complete the title, category, and author or instructor fields.')
      return
    }
    if (draft.type === 'ebook' && (!Number.isSafeInteger(pages) || pages < 1)) {
      setError('Enter a valid e-book page count.')
      return
    }
    if (shouldPublish && !draft.description.trim()) {
      setError('Add a short product description before publishing.')
      return
    }
    if (shouldPublish && !draft.coverFile && !draft.coverPath) {
      setError('Add a cover image before publishing.')
      return
    }
    if (draft.coverFile && !isValidProductCoverFile(draft.coverFile)) {
      setError('Choose a JPEG, PNG, or WebP cover image no larger than 5 MB.')
      return
    }
    if (draft.file && (draft.file.type !== 'application/pdf' || draft.file.size > 100 * 1024 * 1024)) {
      setError('Choose a PDF file smaller than 100 MB.')
      return
    }

    const lessons = draft.type === 'course'
      ? draft.lessons.filter((lesson) => lesson.title.trim() || lesson.thumbnailUrl.trim() || lesson.driveUrl.trim())
      : []
    if (shouldPublish && draft.type === 'course' && !lessons.length) {
      setError('Add at least one chapter before publishing this course.')
      return
    }
    if (shouldPublish && lessons.some((lesson) => !lesson.title.trim() || !isValidGoogleDriveUrl(lesson.driveUrl.trim()))) {
      setError('Each course chapter needs a title and a secure Google Drive or Google Docs link.')
      return
    }
    if (lessons.some((lesson) => lesson.thumbnailUrl.trim() && !isValidHttpsImageUrl(lesson.thumbnailUrl.trim()))) {
      setError('Chapter thumbnails must use secure HTTPS image URLs.')
      return
    }
    if (shouldPublish && draft.type === 'ebook' && !draft.file && !draft.storagePath) {
      setError('Upload the e-book PDF before publishing this product.')
      return
    }
    const duplicate = products.some((product) => product.id === id
      && (draft.isNew || product.type !== draft.type))
    if (duplicate) {
      setError('That product ID is already in use. Choose a unique ID.')
      return
    }

    const existing = products.find((product) => product.id === id && product.type === draft.type)
    const wasExisting = !draft.isNew
    const oldCoverPath = existing?.coverPath ?? ''
    let uploadedCoverPath = ''
    let coverIsReferenced = false
    let saveWarning = ''
    setBusy(true)
    setError('')
    setMessage('')

    try {
      let coverPath = draft.coverPath || null
      if (draft.coverFile) {
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[draft.coverFile.type]
        coverPath = `${id}/${crypto.randomUUID()}.${extension}`
        const coverUpload = await supabase.storage
          .from('product-covers')
          .upload(coverPath, draft.coverFile, { contentType: draft.coverFile.type })
        if (coverUpload.error) throw coverUpload.error
        uploadedCoverPath = coverPath
      }

      const common = {
        id,
        title: draft.title.trim(),
        category: draft.category.trim(),
        description: draft.description.trim(),
        cover_path: coverPath,
        price_inr: price,
        published: Boolean(existing?.published && shouldPublish),
      }
      const productResult = draft.type === 'ebook'
        ? await supabase.from('ebooks').upsert({ ...common, author: draft.creator.trim(), pages, file_format: 'PDF' })
        : await supabase.from('courses').upsert({ ...common, instructor: draft.creator.trim() })
      if (productResult.error) throw productResult.error
      coverIsReferenced = true

      if (draft.type === 'course') {
        const lessonRows = lessons.map((lesson, index) => ({
          id: lesson.id,
          course_id: id,
          title: lesson.title.trim(),
          thumbnail_url: lesson.thumbnailUrl.trim() || null,
          drive_url: lesson.driveUrl.trim() || null,
          position: index + 1,
        }))
        if (lessonRows.length) {
          const lessonResult = await supabase.from('course_lessons').upsert(lessonRows, { onConflict: 'id' })
          if (lessonResult.error) {
            setMessage('Course details were saved, but its chapters were not updated.')
            throw lessonResult.error
          }
          const lessonIds = lessonRows.map((lesson) => lesson.id)
          const deleteResult = await supabase.from('course_lessons').delete().eq('course_id', id).not('id', 'in', `(${lessonIds.join(',')})`)
          if (deleteResult.error) {
            setMessage('Course chapters were saved, but removed chapters could not be cleaned up.')
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

      if (shouldPublish && !existing?.published) {
        const table = draft.type === 'ebook' ? 'ebooks' : 'courses'
        const { error: publishError } = await supabase.from(table).update({ published: true }).eq('id', id)
        if (publishError) throw publishError
      }

      if (oldCoverPath && oldCoverPath !== coverPath) {
        const { error: removeCoverError } = await supabase.storage.from('product-covers').remove([oldCoverPath])
        if (removeCoverError) saveWarning = 'Product saved, but the previous cover could not be removed from storage.'
      }

      const adminReloaded = await loadProducts()
      if (!adminReloaded) throw new Error('Product was saved, but the administrator catalog could not be refreshed.')
      await onCatalogChanged()
      backToProducts()
      setMessage(saveWarning || (shouldPublish
        ? wasExisting ? 'Product updated and published.' : 'Product published.'
        : wasExisting ? 'Product changes saved.' : 'Product saved as a draft.'))
    } catch (requestError) {
      if (uploadedCoverPath && !coverIsReferenced) {
        const { error: cleanupError } = await supabase.storage.from('product-covers').remove([uploadedCoverPath])
        if (cleanupError) setMessage('The product was not saved, and the uploaded cover could not be removed. Try again or contact support.')
      }
      setError(friendlyMessage(requestError, 'admin'))
    } finally {
      setBusy(false)
    }
  }

  const changeCover = (file) => {
    clearError()
    if (file && !isValidProductCoverFile(file)) {
      setError('Choose a JPEG, PNG, or WebP cover image no larger than 5 MB.')
      return
    }
    updateDraft({ coverFile: file })
  }

  if (route.mode !== 'list' && draft) {
    return (
      <AdminProductEditor
        draft={draft}
        step={step}
        busy={busy}
        error={error}
        coverPreview={coverPreview}
        onChange={updateDraft}
        onCoverChange={changeCover}
        onStepChange={setStep}
        onSave={() => saveProduct()}
        onPublish={() => saveProduct(true)}
        onBack={backToProducts}
        onClearError={clearError}
        onMoveLesson={moveLesson}
        onRemoveLesson={removeLesson}
        onAddLesson={addLesson}
      />
    )
  }

  if (route.mode === 'edit' && !draft) {
    return <main className="studio-page"><p role="status">Loading product details…</p></main>
  }

  return (
    <main className="studio-page">
      <header className="studio-header">
        <div className="studio-brand-lockup">
          <span className="studio-brand-name">infinivium<span>.</span></span>
          <span className="studio-brand-divider" aria-hidden="true" />
          <span className="studio-brand-context">Product studio</span>
        </div>
        <div className="studio-header-actions">
          <span className="studio-account-email">{email}</span>
          <button type="button" className="studio-button studio-button-secondary" onClick={onSignOut}>Sign out</button>
          <button type="button" className="studio-button studio-button-secondary" onClick={onBack}>Back to storefront</button>
        </div>
      </header>

      <div className="studio-page-heading">
        <div>
          <h1>Products</h1>
          <p>Prepare e-books and courses for your storefront.</p>
        </div>
        <div className="studio-create-actions">
          <button type="button" className="studio-button studio-button-secondary" onClick={() => startNew('ebook')} disabled={loading || Boolean(catalogError)}>Add e-book</button>
          <button type="button" className="studio-button studio-button-primary" onClick={() => startNew('course')} disabled={loading || Boolean(catalogError)}>Add course</button>
        </div>
      </div>

      <section className="studio-summary" aria-label="Catalog summary">
        <span><strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}</span>
        <span><strong>{publishedCount}</strong> published</span>
        <span><strong>{configuredCount}</strong> with delivery details</span>
      </section>

      {(error || catalogError || message) && (
        <div className="studio-notices">
          {error && <Notice variant="error" title="We couldn’t complete that" onDismiss={() => setError('')}>{error}</Notice>}
          {catalogError && (
            <Notice
              variant="error"
              title="We couldn’t load your catalog"
              action={(
                <button type="button" className="studio-button studio-button-secondary" onClick={loadProducts} disabled={loading}>
                  {loading ? 'Loading catalog…' : 'Try again'}
                </button>
              )}
            >
              {catalogError}
            </Notice>
          )}
          {message && <Notice variant="success" title="All set" onDismiss={() => setMessage('')}>{message}</Notice>}
        </div>
      )}

      <section className="studio-catalog" aria-labelledby="studio-catalog-heading">
        <div className="studio-catalog-header">
          <h2 id="studio-catalog-heading">Your catalog</h2>
          <label className="studio-search">
            <span className="visually-hidden">Search products</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author, or category" />
          </label>
        </div>
        <div className="studio-catalog-controls">
          <div className="studio-filters" aria-label="Filter products">
            {[
              ['all', 'All products'],
              ['ebook', 'E-books'],
              ['course', 'Courses'],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`studio-filter${filter === value ? ' is-active' : ''}`}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="studio-result-count">{visibleProducts.length} shown</span>
        </div>

        {loading
          ? <p className="studio-empty" role="status">Loading your catalog…</p>
          : visibleProducts.length ? (
            <div className="studio-product-list">
              {visibleProducts.map((product) => (
                <article className="studio-product-row" key={`${product.type}-${product.id}`}>
                  {product.coverPath
                    ? <img className="studio-product-cover" src={publicCoverUrl(product.coverPath)} alt="" />
                    : <div className={`studio-product-type studio-product-type-${product.type}`}>{product.type === 'ebook' ? 'PDF' : 'COURSE'}</div>}
                  <div className="studio-product-info">
                    <strong>{product.title}</strong>
                    <span>{product.type === 'ebook' ? 'E-book' : 'Course'} · {product.category} · {product.creator}</span>
                    <small>₹{product.price} INR{product.type === 'ebook' ? ` · ${product.pages} pages` : ` · ${product.lessons.length} chapters`}</small>
                  </div>
                  <span className={`studio-status${product.published ? ' is-published' : ''}`}>{product.published ? 'Published' : 'Draft'}</span>
                  <div className="studio-row-actions">
                    <button type="button" className="studio-button studio-button-secondary" onClick={() => editProduct(product)}>
                      {product.published ? 'Edit' : 'Review & publish'}
                    </button>
                    {product.published && (
                      <button type="button" className="studio-button studio-button-danger" onClick={() => removeProduct(product)} disabled={busy}>
                        Remove from store
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : catalogError ? (
            <div className="studio-empty-state">
              <h3>Your catalog is unavailable</h3>
              <p>Check your connection, then use Try again above to reload the catalog.</p>
            </div>
          ) : (
            <div className="studio-empty-state">
              <h3>{products.length ? 'No matching products' : 'Your catalog is ready for its first product'}</h3>
              <p>{products.length ? 'Try another search or filter.' : 'Add an e-book or course to begin setting up your storefront.'}</p>
              {!products.length && <div className="studio-create-actions">
                <button type="button" className="studio-button studio-button-secondary" onClick={() => startNew('ebook')}>Add e-book</button>
                <button type="button" className="studio-button studio-button-primary" onClick={() => startNew('course')}>Add course</button>
              </div>}
            </div>
          )}
      </section>
    </main>
  )
}

export default AdminPage
