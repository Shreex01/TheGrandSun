import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import AdminPage from './AdminPage.jsx'
import AuthPage from './AuthPage.jsx'
import { supabase } from './lib/supabase.js'
import { mapCatalogRows } from './lib/catalog.js'

const courses = [
  {
    id: 'creative-branding',
    title: 'The Art of Creative Branding',
    category: 'Design',
    instructor: 'Elena Moretti',
    rating: '4.9',
    reviews: 1248,
    students: '8.2k',
    price: 799,
    hours: '6.5 hours',
    lessons: 32,
    level: 'All levels',
    image: 'photo-1558655146-d09347e92766',
    imageAlt: 'Colorful magazine covers and visual design',
    tag: 'Bestseller',
  },
  {
    id: 'modern-photography',
    title: 'Photography: Finding Your Light',
    category: 'Photography',
    instructor: 'James Whitfield',
    rating: '4.8',
    reviews: 986,
    students: '6.1k',
    price: 699,
    hours: '4 hours',
    lessons: 24,
    level: 'Beginner',
    image: 'photo-1516035069371-29a1b244cc32',
    imageAlt: 'A camera ready to capture a photograph',
    tag: 'Trending',
  },
  {
    id: 'everyday-cooking',
    title: 'A Little More Joy in the Kitchen',
    category: 'Lifestyle',
    instructor: 'Sofia Laurent',
    rating: '4.9',
    reviews: 2104,
    students: '12k',
    price: 599,
    hours: '3.5 hours',
    lessons: 18,
    level: 'All levels',
    image: 'photo-1556911220-e15b29be8c8f',
    imageAlt: 'A bright, welcoming home kitchen',
    tag: 'Loved by learners',
  },
  {
    id: 'digital-illustration',
    title: 'Digital Illustration, From Sketch to Story',
    category: 'Design',
    instructor: 'Maya Chen',
    rating: '4.7',
    reviews: 732,
    students: '4.3k',
    price: 999,
    hours: '8 hours',
    lessons: 41,
    level: 'Intermediate',
    image: 'photo-1513364776144-60967b0f800f',
    imageAlt: 'A painter at work in a colorful art studio',
    tag: 'New',
  },
  {
    id: 'mindful-mornings',
    title: 'Mindful Mornings: Make Space for You',
    category: 'Wellness',
    instructor: 'Amara Okafor',
    rating: '4.9',
    reviews: 1680,
    students: '9.5k',
    price: 499,
    hours: '2 hours',
    lessons: 16,
    level: 'All levels',
    image: 'photo-1506126613408-eca07ce68773',
    imageAlt: 'A peaceful mindful meditation practice',
    tag: 'Learner favorite',
  },
  {
    id: 'floral-watercolor',
    title: 'Watercolor Florals for Every Season',
    category: 'Art',
    instructor: 'Clara Bennett',
    rating: '4.8',
    reviews: 854,
    students: '5.7k',
    price: 749,
    hours: '5 hours',
    lessons: 28,
    level: 'Beginner',
    image: 'photo-1513364776144-60967b0f800f',
    imageAlt: 'An artist painting with a watercolor palette',
    tag: 'Staff pick',
  },
]

const ebooks = [
  {
    id: 'creative-branding-field-guide',
    type: 'ebook',
    title: 'The Creative Branding Field Guide',
    category: 'Design',
    instructor: 'Elena Moretti',
    rating: '4.9',
    reviews: 312,
    students: '2.4k',
    price: 299,
    pages: 148,
    fileFormat: 'PDF',
    level: 'All levels',
    image: 'photo-1544947950-fa07a98d237f',
    imageAlt: 'A thoughtfully designed book on a desk',
    tag: 'Bestseller',
  },
  {
    id: 'everyday-photography-notes',
    type: 'ebook',
    title: 'Everyday Photography: A Field Notebook',
    category: 'Photography',
    instructor: 'James Whitfield',
    rating: '4.8',
    reviews: 186,
    students: '1.2k',
    price: 249,
    pages: 96,
    fileFormat: 'PDF',
    level: 'Beginner',
    image: 'photo-1512820790803-83ca734da794',
    imageAlt: 'A photography book open for reading',
    tag: 'Reader favorite',
  },
  {
    id: 'mindful-mornings-journal',
    type: 'ebook',
    title: 'A Gentler Morning: Guided Journal',
    category: 'Wellness',
    instructor: 'Amara Okafor',
    rating: '4.9',
    reviews: 428,
    students: '3.1k',
    price: 199,
    pages: 72,
    fileFormat: 'PDF',
    level: 'All levels',
    image: 'photo-1512820790803-83ca734da794',
    imageAlt: 'A journal and pen for a quiet morning',
    tag: 'New',
  },
]

const demoProducts = [
  ...ebooks,
  ...courses.map((course) => ({ ...course, type: 'course' })),
]
const categories = ['All products', 'E-books', 'Courses', 'Design', 'Photography', 'Lifestyle', 'Wellness', 'Art']
const imageUrl = (id, width = 720) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
const readStored = (key, fallback) => {
  const saved = localStorage.getItem(key)
  return saved === null ? fallback : JSON.parse(saved)
}

function readRoute() {
  const segments = window.location.pathname.split('/').filter(Boolean)
  if (segments[0] === 'signup') return { page: 'auth', authMode: 'signup' }
  if (segments[0] === 'login') return { page: 'auth', authMode: 'login' }
  if (segments[0] === 'cart') return { page: 'cart' }
  if (segments[0] === 'studio' || segments[0] === 'admin') return { page: 'admin' }
  if (segments[0] === 'checkout') return { page: 'checkout' }
  if (segments[0] === 'payment-return') {
    const params = new URLSearchParams(window.location.search)
    return {
      page: 'payment-return',
      paymentOrderId: params.get('razorpay_payment_link_reference_id') ?? params.get('order_id') ?? '',
    }
  }
  if (segments[0] === 'products' && segments[1]) {
    return { page: 'course', selectedCourseId: decodeURIComponent(segments[1]) }
  }
  if (segments[0] === 'library' && segments[1]) {
    return { page: 'learn', selectedCourseId: decodeURIComponent(segments[1]) }
  }
  if (segments[0] === 'library') return { page: 'library' }
  return { page: 'home' }
}

function routePath(page, authMode, productId, paymentOrderId) {
  if (page === 'auth') return authMode === 'signup' ? '/signup' : '/login'
  if (page === 'course') return `/products/${encodeURIComponent(productId)}`
  if (page === 'learn') return `/library/${encodeURIComponent(productId)}`
  if (page === 'payment-return') return paymentOrderId ? `/payment-return?order_id=${encodeURIComponent(paymentOrderId)}` : '/payment-return'
  const routes = {
    home: '/',
    cart: '/cart',
    checkout: '/checkout',
    library: '/library',
    admin: '/studio',
  }
  return routes[page] ?? '/'
}

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    cart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h2l2.5 12h12l2-8H5" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16h16M8 7h8" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    heart: <path d="M20.8 8.7c0 4.2-8.8 10-8.8 10S3.2 12.9 3.2 8.7A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.8 2.2Z" />,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    moon: <><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /></>,
    play: <path d="m9 6 10 6-10 6z" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function ProductCard({ course, purchased, onOpen, onAdd }) {
  const isEbook = course.type === 'ebook'
  return (
    <article className="course-card">
      <button className="course-image-button" onClick={() => onOpen(course)} aria-label={`View ${course.title}`}>
        <img className="course-image" src={imageUrl(course.image)} alt={course.imageAlt} />
        <span className="course-tag">{isEbook ? 'E-book' : 'Course'} · {course.tag}</span>
      </button>
      <div className="course-card-body">
        <p className="course-category">{course.category}</p>
        <button className="course-title-button" onClick={() => onOpen(course)}>{course.title}</button>
        <p className="course-instructor">{isEbook ? 'by' : 'with'} {course.instructor}</p>
        <div className="course-rating"><Icon name="star" size={15} /><strong>{course.rating}</strong><span>({course.reviews.toLocaleString()})</span></div>
        <div className="course-card-bottom">
          <strong className="course-price">{formatPrice(course.price)}</strong>
          <button
            className={`add-course-button${purchased ? ' is-owned' : ''}`}
            onClick={() => purchased ? onOpen(course) : onAdd(course)}
            aria-label={purchased ? `${isEbook ? 'Download' : 'Open'} ${course.title}` : `Add ${course.title} to cart`}
          >
            {purchased ? <><Icon name={isEbook ? 'book' : 'arrow'} size={15} /> {isEbook ? 'Get book' : 'Open'}</> : <Icon name="plus" size={18} />}
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductSection({ title, eyebrow, description, items, owned, onOpen, onAdd, onExplore }) {
  return (
    <section className="course-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="section-description">{description}</p>
        </div>
        <button className="text-link" onClick={onExplore}>Explore all <Icon name="arrow" size={17} /></button>
      </div>
      <div className="course-grid">
        {items.map((course) => <ProductCard key={course.id} course={course} purchased={owned.includes(course.id)} onOpen={onOpen} onAdd={onAdd} />)}
      </div>
    </section>
  )
}

function App() {
  const [page, setPage] = useState(() => readRoute().page)
  const [selectedCourseId, setSelectedCourseId] = useState(() => readRoute().selectedCourseId ?? courses[0].id)
  const [cart, setCart] = useState(() => readStored('infinivium-cart', readStored('grand-sun-cart', [])))
  const [selectedCart, setSelectedCart] = useState(() => readStored('infinivium-selected-cart', readStored('grand-sun-selected-cart', [])))
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [adminCheckUserId, setAdminCheckUserId] = useState(null)
  const [adminRole, setAdminRole] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState(demoProducts)
  const [catalogError, setCatalogError] = useState('')
  const [authMode, setAuthMode] = useState(() => readRoute().authMode ?? 'login')
  const [authReturnPage, setAuthReturnPage] = useState('home')
  const [owned, setOwned] = useState([])
  const [ownedEbookIds, setOwnedEbookIds] = useState([])
  const [adminPreviewProductIds, setAdminPreviewProductIds] = useState([])
  const [enrollmentUserId, setEnrollmentUserId] = useState(null)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [enrollmentsError, setEnrollmentsError] = useState('')
  const [ebookPurchasesLoading, setEbookPurchasesLoading] = useState(false)
  const [ebookPurchasesError, setEbookPurchasesError] = useState('')
  const [accountError, setAccountError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All products')
  const [slide, setSlide] = useState(0)
  const [toast, setToast] = useState('')
  const [deliveryError, setDeliveryError] = useState('')
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [ebookUrl, setEbookUrl] = useState('')
  const [readerPage, setReaderPage] = useState(1)
  const [readerTheme, setReaderTheme] = useState('light')
  const [courseLessons, setCourseLessons] = useState([])
  const [courseLessonsLoading, setCourseLessonsLoading] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState(() => readRoute().paymentOrderId ?? '')
  const [paymentOrderStatus, setPaymentOrderStatus] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(null)
  const [useRealCheckout, setUseRealCheckout] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const catalogRequestId = useRef(0)
  const paymentAttemptActive = useRef(false)
  const paymentModalResult = useRef('')

  const products = catalogProducts
  const storefrontProducts = products.filter((product) => product.published !== false)
  const featured = storefrontProducts.filter((product) => product.type === 'course').slice(0, 3)
  const featuredCourse = featured[slide] ?? featured[0] ?? courses[0]
  const adminAccess = Boolean(session && adminCheckUserId === session.user.id && adminRole)
  const adminChecking = Boolean(session && adminCheckUserId !== session.user.id)
  const selectedCourse = products.find((course) => course.id === selectedCourseId) ?? courses[0]
  const enrolledCourseIds = enrollmentUserId === session?.user.id ? owned : []
  const purchasedEbookIds = enrollmentUserId === session?.user.id ? ownedEbookIds : []
  const ownedProductIds = [...enrolledCourseIds, ...purchasedEbookIds]
  const accessibleProductIds = [...ownedProductIds, ...(adminAccess ? adminPreviewProductIds : [])]
  const currentEnrollmentsLoading = Boolean(session && (enrollmentsLoading || ebookPurchasesLoading || enrollmentUserId !== session.user.id))
  const currentEnrollmentsError = enrollmentUserId === session?.user.id ? [enrollmentsError, ebookPurchasesError].filter(Boolean).join(' ') : ''
  const cartCourses = cart.map((id) => storefrontProducts.find((course) => course.id === id)).filter(Boolean)
  const checkoutCourses = cartCourses.filter((course) => selectedCart.includes(course.id) && course.published !== false)
  const subtotal = checkoutCourses.reduce((total, course) => total + course.price, 0)
  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()
    return storefrontProducts.filter((course) => {
      const matchesCategory = category === 'All products'
        || (category === 'E-books' && course.type === 'ebook')
        || (category === 'Courses' && course.type === 'course')
        || course.category === category
      const matchesQuery = !query || `${course.title} ${course.category} ${course.instructor}`.toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [category, storefrontProducts, search])

  const refreshCatalog = useCallback(async () => {
    const requestId = ++catalogRequestId.current
    if (!supabase) {
      return
    }

    const [courseResult, ebookResult] = await Promise.all([
      supabase.from('courses').select('id,title,category,instructor,price_inr,published').order('title'),
      supabase.from('ebooks').select('id,title,category,author,price_inr,pages,file_format,published').order('title'),
    ])
    if (requestId !== catalogRequestId.current) return
    if (courseResult.error || ebookResult.error) {
      const error = courseResult.error ?? ebookResult.error
      setCatalogError(error.message)
      throw error
    }
    setCatalogError('')
    setCatalogProducts(mapCatalogRows(courseResult.data, ebookResult.data, demoProducts))
  }, [])

  useEffect(() => { localStorage.setItem('infinivium-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('infinivium-selected-cart', JSON.stringify(selectedCart)) }, [selectedCart])
  useEffect(() => {
    const path = routePath(page, authMode, selectedCourseId, paymentOrderId)
    if (`${window.location.pathname}${window.location.search}` !== path) window.history.pushState({ infinivium: true }, '', path)
  }, [page, authMode, selectedCourseId, paymentOrderId])
  useEffect(() => {
    const onPopState = () => {
      const route = readRoute()
      setPage(route.page)
      if (route.authMode) setAuthMode(route.authMode)
      if (route.selectedCourseId) setSelectedCourseId(route.selectedCourseId)
      if (route.paymentOrderId !== undefined) setPaymentOrderId(route.paymentOrderId)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    refreshCatalog().catch(() => {})
  }, [refreshCatalog, session])
  useEffect(() => {
    if (!supabase) return undefined
    const channel = supabase
      .channel('infinivium-live-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        refreshCatalog().catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ebooks' }, () => {
        refreshCatalog().catch(() => {})
      })
      .subscribe()
    const refreshInterval = window.setInterval(() => {
      refreshCatalog().catch(() => {})
    }, 30000)
    return () => {
      window.clearInterval(refreshInterval)
      supabase.removeChannel(channel)
    }
  }, [refreshCatalog])
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return undefined
    }

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAccountError(error.message)
      setSession(data.session)
      setAuthReady(true)
    }).catch((error) => {
      if (!active) return
      setAccountError(error instanceof Error ? error.message : 'Unable to restore your student session.')
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update')
        setPage('auth')
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])
  useEffect(() => {
    if (!session || !supabase) return undefined

    let active = true
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!active) return
      setAdminRole(!error && data === true)
      setAdminCheckUserId(session.user.id)
      if (error) setAccountError(`Unable to verify administrator access: ${error.message}`)
    }).catch((error) => {
      if (!active) return
      setAdminRole(false)
      setAdminCheckUserId(session.user.id)
      setAccountError(error instanceof Error ? `Unable to verify administrator access: ${error.message}` : 'Unable to verify administrator access.')
    })

    return () => { active = false }
  }, [session])
  useEffect(() => {
    if (!session || !supabase) {
      setOwned([])
      setOwnedEbookIds([])
      setEnrollmentUserId(null)
      setEnrollmentsLoading(false)
      setEnrollmentsError('')
      setEbookPurchasesLoading(false)
      setEbookPurchasesError('')
      return undefined
    }

    let active = true
    setEnrollmentsLoading(true)
    setEbookPurchasesLoading(true)
    setEnrollmentsError('')
    setEbookPurchasesError('')
    Promise.all([
      supabase.from('enrollments').select('course_id').eq('user_id', session.user.id),
      supabase.from('ebook_purchases').select('ebook_id').eq('user_id', session.user.id),
    ]).then(([enrollmentResult, ebookResult]) => {
        if (!active) return
        if (enrollmentResult.error) {
          setOwned([])
          setEnrollmentsError(enrollmentResult.error.message)
        } else {
          setOwned(enrollmentResult.data.map((enrollment) => enrollment.course_id))
        }
        if (ebookResult.error) {
          setOwnedEbookIds([])
          setEbookPurchasesError(ebookResult.error.message)
        } else {
          setOwnedEbookIds(ebookResult.data.map((purchase) => purchase.ebook_id))
        }
        setEnrollmentUserId(session.user.id)
        setEnrollmentsLoading(false)
        setEbookPurchasesLoading(false)
      })
      .catch((error) => {
        if (!active) return
        setOwned([])
        setOwnedEbookIds([])
        setEnrollmentUserId(session.user.id)
        setEnrollmentsError(error instanceof Error ? error.message : 'Unable to load your enrollments.')
        setEnrollmentsLoading(false)
        setEbookPurchasesError(error instanceof Error ? error.message : 'Unable to load your e-book purchases.')
        setEbookPurchasesLoading(false)
      })

    return () => { active = false }
  }, [session, paymentOrderStatus])
  useEffect(() => {
    if (page !== 'learn' || selectedCourse.type !== 'course'
      || (!owned.includes(selectedCourseId) && !(adminAccess && adminPreviewProductIds.includes(selectedCourseId)))
      || !supabase) {
      return undefined
    }

    const controller = new AbortController()
    setCourseLessonsLoading(true)
    setCourseLessons([])
    setDeliveryError('')
    supabase
      .from('course_lessons')
      .select('id,title,thumbnail_url,drive_url,position')
      .eq('course_id', selectedCourseId)
      .order('position')
      .abortSignal(controller.signal)
      .then(({ data, error }) => {
        if (controller.signal.aborted) return
        if (error) throw error
        if (data.length) {
          setCourseLessons(data)
        } else {
          return supabase
            .from('course_access_links')
            .select('drive_url')
            .eq('course_id', selectedCourseId)
            .maybeSingle()
            .abortSignal(controller.signal)
            .then(({ data: legacyData, error: legacyError }) => {
              if (controller.signal.aborted) return
              if (legacyError) throw legacyError
              if (legacyData?.drive_url) {
                setCourseLessons([{
                  id: `legacy-${selectedCourseId}`,
                  title: `${selectedCourse.title} — Full course`,
                  thumbnail_url: '',
                  drive_url: legacyData.drive_url,
                  position: 1,
                }])
              }
            })
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setDeliveryError(error instanceof Error ? error.message : 'Unable to load course materials.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setCourseLessonsLoading(false)
      })

    return () => controller.abort()
  }, [page, selectedCourseId, owned, selectedCourse.type, selectedCourse.title, adminAccess, adminPreviewProductIds])
  useEffect(() => {
    if (page !== 'learn' || selectedCourse.type !== 'ebook'
      || (!ownedEbookIds.includes(selectedCourseId) && !(adminAccess && adminPreviewProductIds.includes(selectedCourseId)))
      || !supabase) {
      setEbookUrl('')
      return undefined
    }

    let active = true
    let objectUrl = ''
    setDownloadBusy(true)
    setDeliveryError('')
    setEbookUrl('')
    const savedPage = Number(readStored(`infinivium-page-${selectedCourseId}`, 1))
    setReaderPage(Number.isSafeInteger(savedPage) && savedPage >= 1 ? Math.min(savedPage, selectedCourse.pages) : 1)

    const loadReaderFile = async () => {
      try {
        const { data: asset, error: assetError } = await supabase
          .from('ebook_assets')
          .select('storage_path')
          .eq('ebook_id', selectedCourseId)
          .maybeSingle()
        if (assetError) throw assetError
        if (!asset?.storage_path) throw new Error('This e-book file is not available yet. Please contact support.')

        const { data: file, error: fileError } = await supabase.storage
          .from('ebooks')
          .download(asset.storage_path)
        if (fileError) throw fileError
        if (!active) return
        objectUrl = URL.createObjectURL(file)
        setEbookUrl(objectUrl)
      } catch (error) {
        if (active) setDeliveryError(error instanceof Error ? error.message : 'Unable to open this e-book.')
      } finally {
        if (active) setDownloadBusy(false)
      }
    }
    loadReaderFile()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [page, selectedCourseId, selectedCourse.type, selectedCourse.pages, ownedEbookIds, adminAccess, adminPreviewProductIds])
  useEffect(() => {
    if (page === 'learn' && selectedCourse.type === 'ebook') {
      localStorage.setItem(`infinivium-page-${selectedCourseId}`, String(readerPage))
    }
  }, [page, selectedCourse.type, selectedCourseId, readerPage])
  useEffect(() => {
    if (!authReady || session || !['library', 'learn', 'checkout', 'payment-return'].includes(page)) return
    setAuthReturnPage(page === 'learn' ? 'library' : page)
    setAuthMode('login')
    setPage('auth')
  }, [authReady, session, page])
  useEffect(() => {
    if (!authReady || page !== 'checkout') return
    if (!session) {
      setAuthReturnPage('checkout')
      setAuthMode('login')
      setPage('auth')
    }
  }, [authReady, page, session])
  useEffect(() => {
    if (page !== 'payment-return' || !session || !paymentOrderId || !supabase) return undefined

    let active = true
    let timer
    let attempts = 0
    setPaymentOrderStatus('checking')
    setPaymentError('')
    const checkOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', paymentOrderId)
        .maybeSingle()
      if (!active) return
      if (error) {
        setPaymentError(error.message)
        return
      }
      if (!data) {
        setPaymentOrderStatus('not-found')
        return
      }
      setPaymentOrderStatus(data.status)
      if (data.status !== 'pending' || attempts >= 20) return
      attempts += 1
      timer = window.setTimeout(checkOrder, 3000)
    }
    checkOrder().catch((error) => {
      if (active) setPaymentError(error instanceof Error ? error.message : 'Unable to check payment status.')
    })

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [page, session, paymentOrderId])
  useEffect(() => {
    if (page === 'admin' && !session) {
      setPage('auth')
      setAuthMode('login')
      setAuthReturnPage('admin')
    } else if (page === 'admin' && !adminChecking && adminCheckUserId === session?.user.id && !adminAccess) {
      setPage('home')
      setAccountError('Administrator access is required to open the product studio.')
    }
  }, [page, adminAccess, adminChecking, adminCheckUserId, session])
  useEffect(() => {
    if (featured.length < 2) return undefined
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % featured.length), 6500)
    return () => window.clearInterval(timer)
  }, [featured.length])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const navigate = (nextPage, course) => {
    if ((nextPage === 'library' || nextPage === 'learn' || nextPage === 'checkout' || nextPage === 'admin') && !session) {
      setAuthReturnPage(nextPage === 'learn' ? 'library' : nextPage)
      setAuthMode('login')
      setPage('auth')
      setMobileMenuOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (nextPage === 'admin' && !adminAccess) {
      setAccountError('Administrator access is required to open the product studio.')
      return
    }
    if (nextPage === 'checkout') setUseRealCheckout(false)
    if (nextPage === 'learn' && !accessibleProductIds.includes(course?.id ?? selectedCourseId)) {
      setPage('course')
      setMobileMenuOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (nextPage === 'learn') setDeliveryError('')
    if (course) setSelectedCourseId(course.id)
    setPage(nextPage)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openCourse = (course) => navigate(accessibleProductIds.includes(course.id) ? 'learn' : 'course', course)
  const addToCart = (course) => {
    if (ownedProductIds.includes(course.id) || cart.includes(course.id)) {
      setToast(ownedProductIds.includes(course.id) ? 'This item is already in your library.' : 'This item is already in your cart.')
      return
    }
    setCart((items) => [...items, course.id])
    setSelectedCart((items) => [...items, course.id])
    setToast('Added to your cart.')
  }
  const toggleCartItem = (courseId) => {
    setSelectedCart((items) => items.includes(courseId) ? items.filter((id) => id !== courseId) : [...items, courseId])
  }
  const finishAuthentication = (nextSession) => {
    if (nextSession) setSession(nextSession)
    setAccountError('')
    setPage(authReturnPage)
    setAuthReturnPage('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const signOut = async () => {
    if (!supabase) return
    setAccountError('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setAccountError(error.message)
        return
      }
      setAdminPreviewProductIds([])
      setPage('home')
      setToast('You’ve signed out.')
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
    }
  }

  const verifyCheckoutPayment = async (response, orderRecordId) => {
    setPaymentModalOpen(false)
    setPaymentBusy(true)
    setPaymentError('')
    try {
      if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
        throw new Error('Razorpay returned incomplete payment details.')
      }
      setPendingPayment({ response, orderRecordId })
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        },
      })
      if (error) {
        let responseError
        try {
          responseError = await error.context?.clone?.().json()
        } catch {
          responseError = null
        }
        throw new Error(responseError?.error || error.message)
      }
      if (data?.verified !== true || data.order_record_id !== orderRecordId) {
        throw new Error(data?.error || 'Razorpay could not verify this payment.')
      }
      setPendingPayment(null)
      setPaymentOrderId(data.order_record_id)
      setPaymentOrderStatus('paid')
      setPage('payment-return')
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to verify this payment. Please try again.')
    } finally {
      setPaymentBusy(false)
      paymentAttemptActive.current = false
    }
  }

  const startCheckout = async () => {
    if (paymentAttemptActive.current) return
    paymentAttemptActive.current = true
    paymentModalResult.current = ''
    setPaymentBusy(true)
    setPaymentError('')

    try {
      if (!supabase || !session) throw new Error('Sign in to start checkout.')
      if (pendingPayment) {
        await verifyCheckoutPayment(pendingPayment.response, pendingPayment.orderRecordId)
        return
      }
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay is not configured for this storefront.')
      if (typeof window.Razorpay !== 'function') throw new Error('Razorpay Checkout could not be loaded. Check your connection and try again.')
      const productIds = checkoutCourses.map((product) => product.id)
      if (!productIds.length) throw new Error('Choose an available item in your cart before checkout.')

      const { data: order, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { product_ids: productIds },
      })
      if (orderError) {
        let responseError
        try {
          responseError = await orderError.context?.clone?.().json()
        } catch {
          responseError = null
        }
        throw new Error(responseError?.error || orderError.message)
      }
      if (typeof order?.order_id !== 'string' || typeof order?.order_record_id !== 'string'
        || !Number.isSafeInteger(order?.amount) || order.amount < 100 || order.currency !== 'INR') {
        throw new Error('The server returned an invalid Razorpay order.')
      }

      const checkout = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Infinivium',
        description: `${productIds.length} ${productIds.length === 1 ? 'item' : 'items'}`,
        order_id: order.order_id,
        prefill: { email: session.user.email },
        handler: async (response) => {
          paymentModalResult.current = 'success'
          await verifyCheckoutPayment(response, order.order_record_id)
        },
        modal: {
          ondismiss: () => {
            setPaymentModalOpen(false)
            setPaymentBusy(false)
            if (!paymentModalResult.current) {
              setPaymentError('Payment was cancelled. You can try again whenever you are ready.')
            }
            paymentAttemptActive.current = false
          },
        },
        theme: { color: '#253b32' },
      })
      checkout.on('payment.failed', (event) => {
        paymentModalResult.current = 'failed'
        setPaymentModalOpen(false)
        setPaymentBusy(false)
        setPaymentError(event.error?.description || 'Razorpay could not complete this payment. Please try again.')
        paymentAttemptActive.current = false
      })
      checkout.open()
      setPaymentBusy(false)
      setPaymentModalOpen(true)
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to start Razorpay checkout. Please try again.')
      setPaymentBusy(false)
      paymentAttemptActive.current = false
    }
  }

  const navigateToSubscribe = () => {
    if (page !== 'home') setPage('home')
    window.setTimeout(() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  const renderHome = () => (
    <>
      <section className="hero-section" aria-label="Featured learning resources">
        <div className="hero-photo" style={{ backgroundImage: `url("${imageUrl(featuredCourse.image, 1800)}")` }} />
        <div className="hero-scrim" />
        <div className="hero-content">
          <span className="hero-kicker"><span className="kicker-sun"><Icon name="sun" size={14} /></span> BOOKS TO KEEP. COURSES TO OPEN.</span>
          <h1>Make room<br /><em>to grow.</em></h1>
          <p>Thoughtful e-books to download and expert-led courses with convenient access to our private Google Drive library.</p>
          <div className="hero-actions">
            <button className="button button-gold" onClick={() => { setCategory('All products'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }}>Explore the collection <Icon name="arrow" size={17} /></button>
            <button className="hero-play-link" onClick={() => openCourse(featuredCourse)}><span className="play-ring"><Icon name="play" size={14} /></span> View featured course</button>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="hero-proof"><span>Books and courses for curious minds</span></div>
          <div className="hero-dots" aria-label="Choose featured course">
            {featured.map((course, index) => <button key={course.id} onClick={() => setSlide(index)} className={index === slide ? 'active' : ''} aria-label={`Show featured course ${index + 1}`} />)}
          </div>
          <span className="hero-slide-count">0{slide + 1} <span>/</span> 0{featured.length}</span>
        </div>
      </section>

      <section className="category-strip" aria-label="Browse categories">
        <span className="category-label">Browse categories</span>
        {categories.map((item) => <button key={item} className={`category-chip${category === item ? ' selected' : ''}`} onClick={() => { setCategory(item); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }}>{item}</button>)}
      </section>

      <div id="discover" className="catalog">
        {catalogError && <p className="auth-feedback auth-error" role="alert">We couldn’t load the live catalog: {catalogError}</p>}
        {search || category !== 'All products' ? (
          <section className="course-section search-results">
            <div className="section-heading">
              <div><p className="eyebrow">THE INFINIVIUM COLLECTION</p><h2>{search ? `Results for “${search}”` : category}</h2><p className="section-description">{filteredCourses.length} books and courses to explore.</p></div>
              <button className="text-link" onClick={() => { setSearch(''); setCategory('All products') }}>Clear filters <Icon name="close" size={16} /></button>
            </div>
            {filteredCourses.length ? <div className="course-grid">{filteredCourses.map((course) => <ProductCard key={course.id} course={course} purchased={ownedProductIds.includes(course.id)} onOpen={openCourse} onAdd={addToCart} />)}</div> : <div className="empty-search"><span className="empty-icon"><Icon name="search" size={23} /></span><h3>Nothing found just yet</h3><p>Try a different search or browse the complete collection.</p><button className="button button-dark" onClick={() => { setSearch(''); setCategory('All products') }}>See everything</button></div>}
          </section>
        ) : (
          <>
            <ProductSection eyebrow="READ & KEEP" title="E-books for your next chapter" description="Downloadable guides and journals, ready to keep close." items={storefrontProducts.filter((product) => product.type === 'ebook').slice(0, 3)} owned={ownedProductIds} onOpen={openCourse} onAdd={addToCart} onExplore={() => { setCategory('E-books'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }} />
            <ProductSection eyebrow="WATCH & MAKE" title="Courses to follow your curiosity" description="Buy once, then open your course video links from your library." items={storefrontProducts.filter((product) => product.type === 'course').slice(0, 3)} owned={ownedProductIds} onOpen={openCourse} onAdd={addToCart} onExplore={() => { setCategory('Courses'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }} />
          </>
        )}
      </div>

      <section className="newsletter" id="newsletter">
        <div className="newsletter-sun"><Icon name="sun" size={27} /></div>
        <div><p className="eyebrow">THE INFINIVIUM NEWSLETTER</p><h2>New reads and learning ideas.</h2><p>Get occasional updates about new e-books, courses, and learning resources.</p></div>
        <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); setToast('You’re on the list. Look out for a little inspiration!'); event.currentTarget.reset() }}>
          <label className="visually-hidden" htmlFor="newsletter-email">Your email address</label>
          <input id="newsletter-email" type="email" placeholder="Your email address" required />
          <button type="submit" aria-label="Subscribe"><Icon name="arrow" size={19} /></button>
        </form>
      </section>
    </>
  )

  const renderCart = () => (
    <main className="inner-page">
      <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><span>Your cart</span></div>
      <div className="page-title-block"><p className="eyebrow">A GOOD CHOICE, EITHER WAY</p><h1>Your cart<span className="cart-title-count"> ({cartCourses.length})</span></h1><p>Keep the ones you’re considering. Choose what feels right when you’re ready.</p></div>
      {!cartCourses.length ? (
        <div className="empty-cart"><span className="empty-icon"><Icon name="bag" size={24} /></span><h2>Your next favorite read or course is out there.</h2><p>Have a look around, and save a little inspiration for later.</p><button className="button button-dark" onClick={() => navigate('home')}>Explore the collection <Icon name="arrow" size={16} /></button></div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Items in your cart">
            {cartCourses.map((course) => <article className={`cart-item${selectedCart.includes(course.id) ? '' : ' not-selected'}`} key={course.id}>
              <label className="cart-checkbox"><input type="checkbox" checked={selectedCart.includes(course.id)} onChange={() => toggleCartItem(course.id)} aria-label={`Select ${course.title}`} /><span className="custom-checkbox"><Icon name="check" size={14} /></span></label>
              <button className="cart-item-image" onClick={() => openCourse(course)}><img src={imageUrl(course.image, 320)} alt={course.imageAlt} /></button>
              <div className="cart-item-info"><p className="course-category">{course.type === 'ebook' ? 'E-book' : 'Course'} <span>·</span> {course.category} · {course.instructor}</p><button className="cart-item-title" onClick={() => openCourse(course)}>{course.title}</button><p className="cart-item-meta"><Icon name="book" size={14} /> {course.type === 'ebook' ? `${course.pages} pages · ${course.fileFormat} download` : `${course.hours} · ${course.lessons} lessons`}</p><button className="remove-link" onClick={() => { setCart((items) => items.filter((id) => id !== course.id)); setSelectedCart((items) => items.filter((id) => id !== course.id)) }}>Remove</button></div>
              <strong className="cart-item-price">{formatPrice(course.price)}</strong>
            </article>)}
          </section>
          <aside className="order-summary"><p className="eyebrow">ORDER SUMMARY</p><h2>Order summary</h2><div className="summary-line"><span>Selected items</span><span>{checkoutCourses.length}</span></div><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(subtotal)}</strong></div><button className="button button-dark checkout-button" disabled={!checkoutCourses.length} onClick={() => navigate('checkout')}>Continue with Razorpay <Icon name="arrow" size={17} /></button><p className="summary-note">You’ll complete payment securely on Razorpay.</p><div className="secure-note">Secure Razorpay checkout</div></aside>
        </div>
      )}
    </main>
  )

  const renderCourseDetails = () => {
    const lessons = ['A warm welcome & what we’ll make', 'Finding the story in a brand', 'Gathering your visual inspiration', 'Putting your first idea on paper']
    const isEbook = selectedCourse.type === 'ebook'
    const alreadyOwned = ownedProductIds.includes(selectedCourse.id)
    return (
      <main className="inner-page">
        <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><button onClick={() => navigate('home')}>{selectedCourse.category}</button><Icon name="chevron" size={14} /><span>{isEbook ? 'E-book details' : 'Course details'}</span></div>
        <div className="detail-layout">
          <section className="detail-main">
            <p className="eyebrow">{isEbook ? 'E-BOOK' : 'COURSE'} <span>·</span> {selectedCourse.category.toUpperCase()} · {selectedCourse.level.toUpperCase()}</p>
            <h1>{selectedCourse.title}</h1>
            <p className="detail-intro">{isEbook
              ? 'A practical digital book to read on your own schedule. After a confirmed purchase, download the file directly from your library.'
              : 'A practical, expert-led course to follow at your own pace. After a confirmed purchase, open the private Google Drive course links from your library.'}</p>
            <div className="detail-instructor"><span className="instructor-avatar">{selectedCourse.instructor.split(' ').map((part) => part[0]).join('')}</span><span>{isEbook ? 'Author' : 'Instructor'}: <strong>{selectedCourse.instructor}</strong></span></div>
            <div className="detail-cover"><img src={imageUrl(selectedCourse.image, 1200)} alt={selectedCourse.imageAlt} />{!isEbook && <span className="cover-play"><Icon name="play" size={21} /></span>}</div>
            <div className="detail-stats"><span><Icon name="star" size={17} /><strong>{selectedCourse.rating}</strong> ({selectedCourse.reviews.toLocaleString()} reviews)</span>{isEbook ? <span><Icon name="book" size={17} /> {selectedCourse.pages} pages · {selectedCourse.fileFormat}</span> : <><span><Icon name="clock" size={17} /> {selectedCourse.hours}</span><span><Icon name="book" size={17} /> {selectedCourse.lessons} lessons</span></>}<span><Icon name="heart" size={17} /> {selectedCourse.students} {isEbook ? 'readers' : 'learners'}</span></div>
            <section className="about-class"><p className="eyebrow">{isEbook ? 'ABOUT THIS E-BOOK' : 'ABOUT THIS COURSE'}</p><h2>{isEbook ? 'A resource to return to' : 'Learn, then put it into practice'}</h2><p>{isEbook
              ? 'Keep the ideas and exercises close at hand. Your purchase includes access to a downloadable digital copy in your student library.'
              : 'Follow clear lessons and practical exercises designed to help you make progress. Course videos are hosted in a private Google Drive library and are opened through your student account.'}</p></section>
            {!isEbook && <section className="curriculum"><p className="eyebrow">COURSE CONTENT</p><h2>What’s inside</h2>{lessons.map((item, index) => <div className="lesson-preview" key={item}><span className="lesson-number">0{index + 1}</span><span>{item}</span><span className="lesson-duration">{index + 2}:30</span></div>)}</section>}
          </section>
          <aside className="detail-sidebar"><p className="eyebrow">{isEbook ? 'E-BOOK PRICE' : 'COURSE PRICE'}</p><div className="detail-price">{formatPrice(selectedCourse.price)}</div><p className="sidebar-note">{isEbook ? 'One-time purchase · PDF download' : 'One-time purchase · Drive link access'}</p><button className="button button-dark detail-cta" onClick={() => alreadyOwned ? navigate('learn', selectedCourse) : addToCart(selectedCourse)}>{alreadyOwned ? <><Icon name={isEbook ? 'book' : 'arrow'} size={16} /> {isEbook ? 'Open my e-book' : 'Open my course'}</> : <>Add to cart <Icon name="arrow" size={16} /></>}</button><p className="sidebar-includes">{isEbook ? 'Your e-book includes' : 'Your course includes'}</p><ul>{isEbook ? <><li><Icon name="check" size={16} /> {selectedCourse.pages} pages in PDF format</li><li><Icon name="check" size={16} /> Download from your library</li><li><Icon name="check" size={16} /> Read on your own device</li></> : <><li><Icon name="check" size={16} /> Course video links in Google Drive</li><li><Icon name="check" size={16} /> Access from your student library</li><li><Icon name="check" size={16} /> Learn on your own schedule</li></>}</ul></aside>
        </div>
      </main>
    )
  }

  const renderCheckout = () => (
    <main className="inner-page payment-page">
      <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><button onClick={() => navigate('cart')}>Your cart</button><Icon name="chevron" size={14} /><span>{adminAccess && !useRealCheckout ? 'Checkout preview' : 'Razorpay checkout'}</span></div>
      {adminAccess && !useRealCheckout ? (
        <section className="demo-checkout-card">
          <div className="demo-checkout-mark"><Icon name="bag" size={22} /></div>
          <p className="eyebrow">ADMIN TEST MODE · NO PAYMENT</p>
          <h1>Preview the purchase experience</h1>
          <p className="demo-checkout-copy">This is an admin preview wall, not Razorpay. It won’t charge you, create an order, or grant a real purchase. Continue to temporarily preview the files and course links as an administrator.</p>
          <div className="demo-checkout-items">
            {checkoutCourses.map((product) => <div key={product.id}><span>{product.title}<small>{product.type === 'ebook' ? 'E-book PDF' : 'Course lessons'}</small></span><strong>{formatPrice(product.price)}</strong></div>)}
            <div className="demo-checkout-total"><strong>Total (display only)</strong><strong>{formatPrice(subtotal)}</strong></div>
          </div>
          {!checkoutCourses.length && <p className="auth-feedback auth-error" role="alert">Your cart has no available selected items. Return to your cart to choose products.</p>}
          <div className="demo-checkout-actions">
            <button className="button button-dark" disabled={!checkoutCourses.length} onClick={() => {
              setAdminPreviewProductIds(checkoutCourses.map((product) => product.id))
              navigate('library')
            }}>Preview delivery (no payment)</button>
            <button className="button button-outline" onClick={() => { setUseRealCheckout(true); setPaymentError('') }}>Try real Razorpay checkout</button>
          </div>
          <p className="demo-checkout-disclaimer">Preview access is temporary and admin-only. No student access or payment record is created.</p>
        </section>
      ) : (
        <section className="payment-status-card">
          {paymentBusy && <div className="payment-spinner" aria-hidden="true" />}
          <p className="eyebrow">SECURE PAYMENT</p>
          <h1>{paymentBusy ? 'Preparing secure checkout…' : paymentModalOpen ? 'Complete payment in Razorpay' : 'Razorpay checkout'}</h1>
          <p>{paymentError || 'Your order total is verified securely before the Razorpay payment window opens.'}</p>
          {paymentError && <p className="checkout-configuration-note">If the problem continues, check the Vite Razorpay Key ID and confirm both payment functions are deployed with Razorpay credentials in Supabase Function secrets.</p>}
          <div className="payment-actions">
            <button className="button button-dark" disabled={paymentBusy || paymentModalOpen || !checkoutCourses.length} onClick={startCheckout}>
              {paymentBusy ? 'Preparing checkout…' : paymentModalOpen ? 'Razorpay is open…' : pendingPayment ? 'Retry payment verification' : paymentError ? 'Try again' : `Pay ${formatPrice(subtotal)} with Razorpay`}
            </button>
            {adminAccess && <button className="button button-outline" onClick={() => { setUseRealCheckout(false); setPaymentError('') }}>Use admin preview instead</button>}
            <button className="button button-outline" onClick={() => navigate('cart')}>Return to cart</button>
          </div>
        </section>
      )}
    </main>
  )

  const renderPaymentReturn = () => (
    <main className="inner-page success-page">
      <span className="success-sun"><Icon name="check" size={30} /></span>
      <p className="eyebrow">RAZORPAY PAYMENT</p>
      <h1>{paymentOrderStatus === 'paid' ? 'Payment confirmed.' : paymentOrderStatus === 'failed' ? 'Payment not completed.' : paymentOrderStatus === 'not-found' ? 'Order not found.' : 'Confirming your payment…'}</h1>
      <p className="success-copy">{paymentError
        ? `We couldn’t verify the order status: ${paymentError}`
        : paymentOrderStatus === 'paid'
          ? 'Your purchase is confirmed. Your downloads and course links are now available in your library.'
          : paymentOrderStatus === 'failed'
            ? 'No access was granted. You can return to your cart and try again.'
            : paymentOrderStatus === 'not-found'
              ? 'We could not find this order on your account. Contact support if you believe payment was taken.'
              : 'Razorpay has returned you to Infinivium. Access is enabled only after our server verifies your payment.'}</p>
      {paymentOrderStatus === 'pending' && <p className="delivery-status" role="status">Waiting for the secure payment confirmation…</p>}
      <div className="success-actions">
        <button className="button button-dark" onClick={() => navigate(paymentOrderStatus === 'paid' ? 'library' : 'cart')}>{paymentOrderStatus === 'paid' ? 'Open my library' : 'Return to cart'}</button>
      </div>
    </main>
  )

  const renderLearning = () => {
    const isEbook = selectedCourse.type === 'ebook'
    return (
      <main className="inner-page delivery-page">
        <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><button onClick={() => navigate('library')}>My library</button><Icon name="chevron" size={14} /><span>{selectedCourse.title}</span></div>
        <div className="learning-heading"><div><p className="eyebrow">{isEbook ? 'YOUR E-BOOK' : 'YOUR COURSE'}</p><h1>{selectedCourse.title}</h1><p>{isEbook ? 'Pick up where you left off in your personal reader.' : 'Your lessons, together in one place.'}</p></div><button className="text-link" onClick={() => navigate('library')}><Icon name="book" size={16} /> My library</button></div>
        {deliveryError && <p className="auth-feedback auth-error" role="alert">{deliveryError}</p>}
        {isEbook ? (
          <section className={`ebook-reader reader-${readerTheme}`} aria-label={`${selectedCourse.title} PDF reader`}>
            <div className="reader-toolbar">
              <div><p className="eyebrow">INFINIVIUM READER</p><strong>{selectedCourse.title}</strong></div>
              <div className="reader-actions">
                <button className="button button-outline reader-theme-button" onClick={() => setReaderTheme((theme) => theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${readerTheme === 'light' ? 'dark' : 'light'} mode`}>
                  <Icon name={readerTheme === 'light' ? 'moon' : 'sun'} size={16} /> {readerTheme === 'light' ? 'Dark mode' : 'Light mode'}
                </button>
                {ebookUrl && <a className="button button-outline reader-download" href={ebookUrl} download={`${selectedCourse.id}.pdf`}><Icon name="arrow" size={15} /> Download PDF</a>}
              </div>
            </div>
            <div className="reader-stage">
              {downloadBusy ? <p className="delivery-status" role="status">Preparing your book…</p>
                : ebookUrl ? <iframe key={`${ebookUrl}-${readerPage}`} src={`${ebookUrl}#page=${readerPage}&toolbar=0&navpanes=0`} title={`${selectedCourse.title}, page ${readerPage}`} />
                  : !deliveryError && <p className="delivery-status">Your e-book is not available right now.</p>}
            </div>
            <div className="reader-controls">
              <button className="reader-page-button" onClick={() => setReaderPage((pageNumber) => Math.max(1, pageNumber - 1))} disabled={readerPage <= 1} aria-label="Previous page"><Icon name="chevronLeft" size={18} /></button>
              <label className="reader-slider-wrap">
                <span>Page <strong>{readerPage}</strong> of {selectedCourse.pages}</span>
                <input type="range" min="1" max={selectedCourse.pages} value={readerPage} onChange={(event) => setReaderPage(Number(event.target.value))} aria-label="Navigate to page" />
              </label>
              <button className="reader-page-button" onClick={() => setReaderPage((pageNumber) => Math.min(selectedCourse.pages, pageNumber + 1))} disabled={readerPage >= selectedCourse.pages} aria-label="Next page"><Icon name="chevron" size={18} /></button>
            </div>
          </section>
        ) : (
          <section className="course-playlist">
            <div className="playlist-heading"><div><p className="eyebrow">YOUR COURSE</p><h2>Course playlist</h2><p>{courseLessons.length} {courseLessons.length === 1 ? 'lesson' : 'lessons'} · Open any lesson in Google Drive</p></div><span className="playlist-count">{courseLessons.length} lessons</span></div>
            {courseLessonsLoading ? <p className="delivery-status" role="status">Loading your lessons…</p>
              : courseLessons.length ? <div className="playlist-list">
                {courseLessons.map((lesson, index) => (
                  <a className="playlist-lesson" href={lesson.drive_url} key={lesson.id} target="_blank" rel="noopener noreferrer">
                    <span className="playlist-thumbnail"><img src={lesson.thumbnail_url || imageUrl(selectedCourse.image, 320)} alt="" /><span><Icon name="play" size={17} /></span></span>
                    <span className="playlist-lesson-copy"><span className="playlist-lesson-number">LESSON {String(index + 1).padStart(2, '0')}</span><strong>{lesson.title}</strong><span>Open recording in Google Drive</span></span>
                    <Icon name="arrow" size={18} />
                  </a>
                ))}
              </div> : <p className="delivery-status">Course lessons are not available yet. Please contact support.</p>}
            <p className="delivery-note">Google Drive permissions are managed by the course owner. Anyone with a shared Drive link may be able to pass it on.</p>
          </section>
        )}
      </main>
    )
  }

  const renderLibrary = () => {
    const myProducts = products.filter((product) => accessibleProductIds.includes(product.id))
    return (
      <main className="inner-page">
        <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><span>My library</span></div>
        <div className="page-title-block"><p className="eyebrow">YOUR OWN LITTLE LIBRARY</p><h1>My library</h1><p>Your e-books and course links, together in one place.</p></div>
        {adminAccess && adminPreviewProductIds.some((id) => !ownedProductIds.includes(id)) && <p className="admin-preview-notice" role="status">Admin preview only — these items haven’t been purchased. Access is temporary and isn’t recorded for students.</p>}
        {currentEnrollmentsLoading ? <p className="auth-feedback">Loading your library…</p>
          : currentEnrollmentsError ? <p className="auth-feedback auth-error" role="alert">We couldn’t load your enrollments: {currentEnrollmentsError}</p>
            : myProducts.length ? <div className="course-grid library-grid">{myProducts.map((product) => <ProductCard key={product.id} course={product} purchased onOpen={openCourse} onAdd={addToCart} />)}</div>
              : <div className="empty-cart"><span className="empty-icon"><Icon name="book" size={24} /></span><h2>A library with room to grow.</h2><p>Your purchased e-books and course links will appear here once a payment is confirmed.</p><button className="button button-dark" onClick={() => navigate('home')}>Explore the collection <Icon name="arrow" size={16} /></button></div>}
      </main>
    )
  }

  const pageContent = page === 'admin'
    ? adminAccess
      ? <AdminPage email={session?.user.email ?? ''} onBack={() => setPage('home')} onSignOut={signOut} onCatalogChanged={refreshCatalog} />
      : <main className="admin-page"><p role="status">Verifying administrator access…</p></main>
    : page === 'auth' ? <AuthPage initialMode={authMode} onModeChange={setAuthMode} onAuthenticated={finishAuthentication} /> : page === 'home' ? renderHome() : page === 'cart' ? renderCart() : page === 'checkout' ? renderCheckout() : page === 'payment-return' ? renderPaymentReturn() : page === 'course' ? renderCourseDetails() : page === 'learn' ? renderLearning() : renderLibrary()
  return (
    <div className={`site-shell${page === 'admin' ? ' admin-shell' : ''}`}>
      {page !== 'admin' && <>
      <div className="header-top-strip" />
      <header className="site-header">
        <button className="brand" onClick={() => navigate('home')} aria-label="Infinivium home"><span className="brand-mark" aria-hidden="true" /><span className="brand-name">infinivium</span></button>
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}><Icon name={mobileMenuOpen ? 'close' : 'menu'} size={22} /></button>
        <nav className={`main-nav${mobileMenuOpen ? ' nav-open' : ''}`} aria-label="Main navigation">
          <button className={page === 'home' ? 'nav-active' : ''} onClick={() => navigate('home')}>Explore</button>
          <button onClick={navigateToSubscribe}>Subscribe</button>
        </nav>
        <label className="search-field"><Icon name="search" size={18} /><input type="search" placeholder="Search for anything" value={search} onChange={(event) => { setSearch(event.target.value); setCategory('All products'); if (page !== 'home') setPage('home') }} aria-label="Search books and courses" /></label>
        <div className="header-actions">
          <button className="header-secondary-link" onClick={() => setToast('Infinivium Business is coming soon.')}>Infinivium Business</button>
          <button className="cart-button" onClick={() => navigate('cart')} aria-label={`Cart${cart.length ? `, ${cart.length} items` : ''}`}><Icon name="cart" size={20} />{cart.length > 0 && <i>{cart.length}</i>}</button>
          {session ? <button className="header-auth-button" onClick={signOut}>Log out</button> : <>
            <button className="header-auth-button" onClick={() => { setAuthMode('login'); setAuthReturnPage('home'); navigate('auth') }}>Log in</button>
            <button className="header-signup-button" onClick={() => { setAuthMode('signup'); setAuthReturnPage('home'); setPage('auth') }}>Sign up</button>
          </>}
          <button className="language-button" aria-label="Choose language" onClick={() => setToast('More languages are coming soon.')}><Icon name="globe" size={19} /></button>
        </div>
      </header>
      <div className="mobile-search"><Icon name="search" size={18} /><input type="search" placeholder="Find a book or course" value={search} onChange={(event) => { setSearch(event.target.value); setCategory('All products'); if (page !== 'home') setPage('home') }} aria-label="Search books and courses" /></div>
      </>}
      {pageContent}
      {accountError && <p className="account-error" role="alert">{accountError}</p>}
      {page !== 'admin' && <>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-block"><button className="brand footer-brand" onClick={() => navigate('home')}><span className="brand-mark" aria-hidden="true" /><span className="brand-name">infinivium</span></button><p>Find a new idea.<br />Make room to grow.</p></div>
          <div className="footer-column"><p className="footer-heading">A good place to start</p><button onClick={() => navigate('home')}>Explore the collection</button><button onClick={() => navigate('library')}>My library</button><button onClick={() => navigate('cart')}>Your cart</button></div>
          <div className="footer-column"><p className="footer-heading">A little hello</p><a href="mailto:hello@infinivium.com">Get in touch</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <span>↗</span></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook <span>↗</span></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube <span>↗</span></a></div>
          <div className="footer-note"><span className="footer-sun"><Icon name="sun" size={22} /></span><p>Here’s to a life<br />of always learning.</p></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Infinivium. Made for the curious.</span><span>Good things to learn, wherever you are <span className="footer-heart">♥</span></span></div>
      </footer>
      </>}
      {toast && <div className="toast-message" role="status"><span><Icon name="check" size={17} /></span>{toast}</div>}
    </div>
  )
}

export default App
