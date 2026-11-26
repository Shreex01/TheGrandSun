import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon } from '@hugeicons/core-free-icons'
import './App.css'
import './polish.css'
import AdminPage from './AdminPage.jsx'
import AuthPage from './AuthPage.jsx'
import ProfilePage from './ProfilePage.jsx'
import Notice from './components/Notice.jsx'
import HoldButton from './components/HoldButton.jsx'
import PeekRating from './components/PeekRating.jsx'
import SlideCommit from './components/SlideCommit.jsx'
import { supabase } from './lib/supabase.js'
import { mapCatalogRows } from './lib/catalog.js'
import { selectFeaturedProducts } from './lib/featured.js'
import { friendlyMessage } from './lib/messages.js'

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
const productImageUrl = (product, width = 720) => product.coverPath && supabase
  ? supabase.storage.from('product-covers').getPublicUrl(product.coverPath).data.publicUrl
  : imageUrl(product.image, width)
const productRatingKey = (product) => `${product.type ?? 'course'}:${product.id}`
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
  if (segments[0] === 'profile') return { page: 'profile' }
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
    profile: '/profile',
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
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function ProductCard({ course, ratingSummary, purchased, onOpen, onAdd }) {
  const isEbook = course.type === 'ebook'
  const rating = ratingSummary ? Number(ratingSummary.average_rating).toFixed(1) : '—'
  return (
    <article className="course-card">
      <button className="course-image-button" onClick={() => onOpen(course)} aria-label={`View ${course.title}`}>
        <img className="course-image" src={productImageUrl(course)} alt={course.coverPath ? `${course.title} cover` : course.imageAlt} />
        <span className="course-tag">{isEbook ? 'E-book' : 'Course'} · {course.tag}</span>
        <span className="course-rating-badge" aria-label={ratingSummary ? `${rating} out of 5 stars, ${ratingSummary.rating_count} ratings` : 'No rating data available'}>
          <strong>{rating}</strong><HugeiconsIcon icon={StarIcon} size={14} fill="currentColor" strokeWidth={1.5} />
        </span>
      </button>
      <div className="course-card-body">
        <p className="course-category">{course.category}</p>
        <button className="course-title-button" onClick={() => onOpen(course)}>{course.title}</button>
        <p className="course-instructor">{isEbook ? 'by' : 'with'} {course.instructor}</p>
        <div className="course-card-bottom">
          <strong className="course-price">{formatPrice(course.price)}</strong>
          {purchased ? (
            <button
              className="add-course-button is-owned"
              onClick={() => onOpen(course)}
              aria-label={`${isEbook ? 'Download' : 'Open'} ${course.title}`}
            >
              <Icon name={isEbook ? 'book' : 'arrow'} size={15} /> {isEbook ? 'Get book' : 'Open'}
            </button>
          ) : (
            <HoldButton
              className="course-add-hold-button"
              ariaLabel={`Hold to add ${course.title} to cart`}
              doneLabel="Added"
              backgroundColor="#fff"
              fillColor="#7441c8"
              textColor="#7441c8"
              fillTextColor="#fff"
              size="sm"
              radius={8}
              onHold={() => onAdd(course)}
            >
              Add to cart
            </HoldButton>
          )}
        </div>
      </div>
    </article>
  )
}

function ProductSection({ title, eyebrow, description, items, owned, ratingSummaries, onOpen, onAdd }) {
  return (
    <section className="course-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="section-description">{description}</p>
        </div>
      </div>
      <div className="course-grid">
        {items.map((course) => <ProductCard key={course.id} course={course} ratingSummary={ratingSummaries[productRatingKey(course)]} purchased={owned.includes(course.id)} onOpen={onOpen} onAdd={onAdd} />)}
      </div>
    </section>
  )
}

function App() {
  const [page, setPage] = useState(() => readRoute().page)
  const [selectedCourseId, setSelectedCourseId] = useState(() => readRoute().selectedCourseId ?? courses[0].id)
  const [cart, setCart] = useState(() => readStored('infinivium-cart', readStored('grand-sun-cart', [])))
  const [selectedCart, setSelectedCart] = useState(() => readStored('infinivium-selected-cart', readStored('grand-sun-selected-cart', [])))
  const [directCheckoutProductId, setDirectCheckoutProductId] = useState(null)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [adminCheckUserId, setAdminCheckUserId] = useState(null)
  const [adminRole, setAdminRole] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState(demoProducts)
  const [catalogError, setCatalogError] = useState('')
  const [featuredNotice, setFeaturedNotice] = useState('')
  const [featuredProductIds, setFeaturedProductIds] = useState(() => selectFeaturedProducts(demoProducts, new Map()).map((product) => product.id))
  const [ratingSummaries, setRatingSummaries] = useState({})
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingSaving, setRatingSaving] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [ratingNotice, setRatingNotice] = useState('')
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
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0)
  const [accountError, setAccountError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All products')
  const [slide, setSlide] = useState(0)
  const [toast, setToast] = useState('')
  const [cartPulse, setCartPulse] = useState(0)
  const [signupSuccess, setSignupSuccess] = useState(null)
  const [logoutAlert, setLogoutAlert] = useState(false)
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
  const [heroPaused, setHeroPaused] = useState(false)
  const catalogRequestId = useRef(0)
  const paymentAttemptActive = useRef(false)
  const paymentModalResult = useRef('')
  const heroRef = useRef(null)
  const heroWheelLock = useRef(0)
  const ratingRequestId = useRef(0)

  const products = catalogProducts
  const storefrontProducts = products.filter((product) => product.published !== false)
  const featured = featuredProductIds
    .map((id) => storefrontProducts.find((product) => product.id === id))
    .filter(Boolean)
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
  const checkoutCourses = directCheckoutProductId
    ? storefrontProducts.filter((course) => course.id === directCheckoutProductId)
    : cartCourses.filter((course) => selectedCart.includes(course.id) && course.published !== false)
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

    const [courseResult, ebookResult, popularResult] = await Promise.all([
      supabase.from('courses').select('id,title,category,instructor,description,cover_path,price_inr,published').order('title'),
      supabase.from('ebooks').select('id,title,category,author,description,cover_path,price_inr,pages,file_format,published').order('title'),
      supabase.rpc('get_popular_products'),
    ])
    if (requestId !== catalogRequestId.current) return
    if (courseResult.error || ebookResult.error) {
      const error = courseResult.error ?? ebookResult.error
      setCatalogError(friendlyMessage(error, 'catalog'))
      throw error
    }
    setCatalogError('')
    const nextProducts = mapCatalogRows(courseResult.data, ebookResult.data, demoProducts)
    setCatalogProducts(nextProducts)
    if (popularResult.error) {
      setFeaturedNotice('Popular picks are temporarily unavailable, so we’re showing a random selection.')
      console.error('Popular products could not be loaded', popularResult.error)
      setFeaturedProductIds(selectFeaturedProducts(nextProducts, new Map()).map((product) => product.id))
    } else {
      setFeaturedNotice('')
      const purchaseCounts = new Map((popularResult.data ?? []).map(({ product_id, purchase_count }) => [product_id, Number(purchase_count)]))
      setFeaturedProductIds(selectFeaturedProducts(nextProducts, purchaseCounts).map((product) => product.id))
    }
    setSlide(0)
  }, [])
  const refreshRatingSummaries = useCallback(async () => {
    if (!supabase) {
      setRatingError('Ratings are unavailable right now.')
      return false
    }
    try {
      const { data, error } = await supabase.rpc('get_product_rating_summaries')
      if (error) {
        console.error('Product ratings could not be loaded', error)
        setRatingError('Ratings are unavailable right now. Please try again later.')
        return false
      }
      setRatingSummaries(Object.fromEntries((data ?? []).map((summary) => [
        `${summary.product_type}:${summary.product_id}`,
        summary,
      ])))
      setRatingError('')
      return true
    } catch (error) {
      console.error('Product ratings could not be loaded', error)
      setRatingError('Ratings are unavailable right now. Please try again later.')
      return false
    }
  }, [])

  useEffect(() => { localStorage.setItem('infinivium-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('infinivium-selected-cart', JSON.stringify(selectedCart)) }, [selectedCart])
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.85 })
    return () => lenis.destroy()
  }, [])
  useEffect(() => {
    const path = page === 'admin' && window.location.pathname.startsWith('/studio/products/')
      ? `${window.location.pathname}${window.location.search}`
      : routePath(page, authMode, selectedCourseId, paymentOrderId)
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
    if (page !== 'course') return undefined
    const requestId = ++ratingRequestId.current
    setRatingLoading(true)
    setRatingError('')
    setRatingNotice('')
    setRatingValue(0)
    const loadRating = async () => {
      const summariesLoaded = await refreshRatingSummaries()
      if (session && supabase) {
        const { data, error } = await supabase
          .from('product_ratings')
          .select('rating')
          .eq('product_id', selectedCourse.id)
          .eq('product_type', selectedCourse.type ?? 'course')
          .maybeSingle()
        if (error) {
          console.error('Your product rating could not be loaded', error)
          if (requestId === ratingRequestId.current) setRatingError('Your rating could not be loaded. Please try again later.')
        } else if (requestId === ratingRequestId.current) {
          const currentRating = Number(data?.rating ?? 0)
          setRatingValue(currentRating)
        }
      } else if (requestId === ratingRequestId.current) {
        setRatingValue(0)
      }
      if (requestId === ratingRequestId.current) {
        if (!summariesLoaded && !session) setRatingError('Ratings are unavailable right now. Please try again later.')
        setRatingLoading(false)
      }
    }
    loadRating().catch((error) => {
      console.error('Product rating details could not be loaded', error)
      if (requestId === ratingRequestId.current) {
        setRatingError('Ratings are unavailable right now. Please try again later.')
        setRatingLoading(false)
      }
    })
    return () => {
      if (requestId === ratingRequestId.current) ratingRequestId.current += 1
    }
  }, [page, selectedCourse.id, selectedCourse.type, session, refreshRatingSummaries])
  useEffect(() => {
    if (page !== 'home') return
    refreshRatingSummaries().catch((error) => {
      console.error('Product ratings could not be loaded', error)
      setRatingError('Ratings are unavailable right now. Please try again later.')
    })
  }, [page, refreshRatingSummaries])
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

    const authUrlParams = new URLSearchParams(
      `${window.location.search.slice(1)}&${window.location.hash.slice(1)}`,
    )
    const recoveryLinkExpired = authUrlParams.get('error_code') === 'otp_expired'
      || /email link is invalid or has expired/i.test(authUrlParams.get('error_description') ?? '')
    if (recoveryLinkExpired) {
      setPage('auth')
      setAuthMode('reset')
      setAccountError('That password reset link has expired or already been used. Enter your email below to request a fresh link.')
    }

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error && !recoveryLinkExpired) setAccountError(friendlyMessage(error, 'account'))
      setSession(data.session)
      setAuthReady(true)
    }).catch((error) => {
      if (!active) return
      setAccountError(friendlyMessage(error, 'account'))
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
      if (error) setAccountError(friendlyMessage(error, 'admin'))
    }).catch((error) => {
      if (!active) return
      setAdminRole(false)
      setAdminCheckUserId(session.user.id)
      setAccountError(friendlyMessage(error, 'admin'))
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
          setEnrollmentsError(friendlyMessage(enrollmentResult.error, 'library'))
        } else {
          setOwned(enrollmentResult.data.map((enrollment) => enrollment.course_id))
        }
        if (ebookResult.error) {
          setOwnedEbookIds([])
          setEbookPurchasesError(friendlyMessage(ebookResult.error, 'library'))
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
        setEnrollmentsError(friendlyMessage(error, 'library'))
        setEnrollmentsLoading(false)
        setEbookPurchasesError(friendlyMessage(error, 'library'))
        setEbookPurchasesLoading(false)
      })

    return () => { active = false }
  }, [session, paymentOrderStatus, libraryRefreshKey])
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
        setDeliveryError(friendlyMessage(error, 'lessons'))
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
        if (active) setDeliveryError(friendlyMessage(error, 'ebook'))
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
    if (!authReady || session || !['library', 'learn', 'checkout', 'payment-return', 'profile'].includes(page)) return
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
        setPaymentError(friendlyMessage(error, 'order'))
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
      if (active) setPaymentError(friendlyMessage(error, 'order'))
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
    if (featured.length < 2 || page !== 'home' || heroPaused) return undefined
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % featured.length), 8000)
    return () => window.clearInterval(timer)
  }, [featured.length, heroPaused, page])
  useEffect(() => {
    const hero = heroRef.current
    if (page !== 'home' || !hero || featured.length < 2) return undefined
    const handleWheel = (event) => {
      if (Math.abs(event.deltaY) < 20) return
      event.preventDefault()
      const now = Date.now()
      if (now - heroWheelLock.current < 450) return
      heroWheelLock.current = now
      setSlide((current) => (current + (event.deltaY > 0 ? 1 : -1) + featured.length) % featured.length)
    }
    hero.addEventListener('wheel', handleWheel, { passive: false })
    return () => hero.removeEventListener('wheel', handleWheel)
  }, [featured.length, page])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    if (!signupSuccess) return undefined
    if (signupSuccess.seconds <= 0) {
      setSignupSuccess(null)
      setPage('home')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return undefined
    }
    const timer = window.setTimeout(() => {
      setSignupSuccess((current) => current ? { ...current, seconds: current.seconds - 1 } : null)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [signupSuccess])

  const navigate = (nextPage, course) => {
    if ((nextPage === 'library' || nextPage === 'learn' || nextPage === 'checkout' || nextPage === 'admin' || nextPage === 'profile') && !session) {
      setAuthReturnPage(nextPage === 'learn' ? 'library' : nextPage)
      setAuthMode('login')
      setPage('auth')
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (nextPage === 'learn') setDeliveryError('')
    if (course) setSelectedCourseId(course.id)
    setPage(nextPage)
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
    setCartPulse((pulse) => pulse + 1)
    setToast('Added to your cart.')
  }
  const submitProductRating = async (rating) => {
    if (!session) {
      setRatingNotice('Sign in to save your rating.')
      return
    }
    if (!supabase || !rating) return
    setRatingSaving(true)
    setRatingError('')
    setRatingNotice('')
    try {
      const { error } = await supabase.from('product_ratings').upsert({
        product_id: selectedCourse.id,
        product_type: selectedCourse.type ?? 'course',
        user_id: session.user.id,
        rating,
      }, { onConflict: 'product_type,product_id,user_id' })
      if (error) throw error
      setRatingValue(rating)
      const refreshed = await refreshRatingSummaries()
      setRatingNotice(refreshed
        ? 'Your rating has been saved. Thanks for sharing!'
        : 'Your rating was saved, but the average could not be refreshed.')
    } catch (error) {
      console.error('Your product rating could not be saved', error)
      setRatingError(error.message)
      setRatingNotice('Your rating could not be saved. Please try again.')
    } finally {
      setRatingSaving(false)
    }
  }
  const handleProductRatingChange = (rating) => {
    setRatingValue(rating)
    if (!session) {
      setRatingError('')
      setRatingNotice('Sign in to save your rating.')
      return
    }
    void submitProductRating(rating)
  }
  const buyNow = (product) => {
    setDirectCheckoutProductId(product.id)
    navigate('checkout')
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
  const finishSignup = (email) => {
    setSignupSuccess({ email, seconds: 10 })
  }
  const signOut = async () => {
    if (!supabase) return
    if (logoutAlert) return
    setAccountError('')
    setLogoutAlert(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setLogoutAlert(false)
        setAccountError(friendlyMessage(error, 'account'))
        return
      }
      setSession(null)
      setAdminPreviewProductIds([])
      setPage('home')
      setLogoutAlert(false)
      setToast('You’ve signed out.')
    } catch (error) {
      setLogoutAlert(false)
      setAccountError(friendlyMessage(error, 'account'))
    }
  }

  const failFriendly = (message) => {
    const error = new Error(message)
    error.userFacing = true
    return error
  }

  const verifyCheckoutPayment = async (response, orderRecordId) => {
    setPaymentModalOpen(false)
    setPaymentBusy(true)
    setPaymentError('')
    try {
      if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
        throw failFriendly('We didn’t receive the full payment confirmation. If money has left your account, don’t worry — it will be checked. Please try again or contact us.')
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
      setPaymentError(error?.userFacing ? error.message : friendlyMessage(error, 'payment'))
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
      if (!supabase || !session) throw failFriendly('Please sign in again to complete your purchase.')
      if (pendingPayment) {
        await verifyCheckoutPayment(pendingPayment.response, pendingPayment.orderRecordId)
        return
      }
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw failFriendly('Secure checkout isn’t quite ready yet. Nothing has been charged — please try again in a little while.')
      if (typeof window.Razorpay !== 'function') throw failFriendly('The secure payment window couldn’t open. Check your connection and try again — nothing has been charged.')
      const productIds = checkoutCourses.map((product) => product.id)
      if (!productIds.length) throw failFriendly('Please choose at least one item in your cart before checking out.')

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
        theme: { color: '#673ab7' },
      })
      checkout.on('payment.failed', (event) => {
        paymentModalResult.current = 'failed'
        setPaymentModalOpen(false)
        setPaymentBusy(false)
        const failedMessage = event.error?.description
          ? friendlyMessage(event.error.description, 'payment')
          : 'That payment didn’t go through. Nothing has been charged — you can try again whenever you’re ready.'
        setPaymentError(failedMessage)
        paymentAttemptActive.current = false
      })
      checkout.open()
      setPaymentBusy(false)
      setPaymentModalOpen(true)
    } catch (error) {
      setPaymentError(error?.userFacing ? error.message : friendlyMessage(error, 'payment'))
      setPaymentBusy(false)
      paymentAttemptActive.current = false
    }
  }

  const renderHome = () => (
    <>
      <section
        ref={heroRef}
        className="hero-section"
        aria-label="Featured learning resources"
        aria-roledescription="carousel"
        data-lenis-prevent-wheel
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onFocusCapture={() => setHeroPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHeroPaused(false)
        }}
      >
        {featured.map((product, index) => {
          const isEbook = product.type === 'ebook'
          const isOwned = ownedProductIds.includes(product.id)
          return (
            <article className={`hero-slide${index === slide ? ' hero-slide-active' : ''}`} key={product.id} aria-hidden={index !== slide}>
              <div className="hero-photo" style={{ backgroundImage: `url("${productImageUrl(product, 1800)}")` }} />
              <div className="hero-scrim" />
              <div className="hero-content">
                <span className="hero-kicker"><span className="kicker-sun"><Icon name="sun" size={14} /></span> FEATURED {isEbook ? 'E-BOOK' : 'COURSE'} <span>·</span> {product.category.toUpperCase()}</span>
                <h1>{product.title}</h1>
                <p>{isEbook
                  ? `${product.pages} pages to explore at your own pace, written by ${product.instructor}.`
                  : `${product.lessons} self-paced lessons with ${product.instructor}, made to help you keep learning.`}</p>
                {featuredNotice && index === slide && <p className="hero-featured-notice" role="status">{featuredNotice}</p>}
                <div className="hero-product-facts">
                  <span>{isEbook ? `${product.pages} pages · ${product.fileFormat}` : `${product.hours} · ${product.lessons} lessons`}</span>
                </div>
                <div className="hero-actions">
                  <button className="button button-gold" onClick={() => openCourse(product)}>View {isEbook ? 'e-book' : 'course'} <Icon name="arrow" size={17} /></button>
                  <button className="hero-play-link" onClick={() => isOwned ? navigate('learn', product) : buyNow(product)}>
                    <span className="play-ring"><Icon name={isOwned ? 'book' : 'bag'} size={14} /></span>
                    {isOwned ? 'Open in my library' : 'Buy now'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
        <div className="hero-bottom">
          <div className="hero-proof"><span>Books and courses for curious minds</span></div>
          <div className="hero-dots" aria-label="Choose a featured product">
            {featured.map((product, index) => <button key={product.id} onClick={() => setSlide(index)} className={index === slide ? 'active' : ''} aria-label={`Show featured ${product.type === 'ebook' ? 'e-book' : 'course'} ${index + 1}`} />)}
          </div>
          <div className="hero-controls">
            <span className="hero-slide-count">0{slide + 1} <span>/</span> 0{featured.length}</span>
            <button type="button" onClick={() => setSlide((current) => (current - 1 + featured.length) % featured.length)} aria-label="Previous featured product" disabled={featured.length < 2}><Icon name="chevronLeft" size={18} /></button>
            <button type="button" onClick={() => setSlide((current) => (current + 1) % featured.length)} aria-label="Next featured product" disabled={featured.length < 2}><Icon name="chevron" size={18} /></button>
          </div>
        </div>
      </section>

      <section className="category-strip" aria-label="Browse categories">
        <span className="category-label">Browse categories</span>
        {categories.map((item) => <button key={item} className={`category-chip${category === item ? ' selected' : ''}`} onClick={() => { setCategory(item); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }}>{item}</button>)}
      </section>

      <div id="discover" className="catalog">
        {catalogError && (
          <Notice
            variant="error"
            title="Our collection needs a moment"
            action={<button className="notice-action-button" type="button" onClick={() => refreshCatalog().catch(() => {})}>Try again</button>}
          >
            {catalogError}
          </Notice>
        )}
        {search || category !== 'All products' ? (
          <section className="course-section search-results">
            <div className="section-heading">
              <div><p className="eyebrow">THE INFINIVIUM COLLECTION</p><h2>{search ? `Results for “${search}”` : category}</h2><p className="section-description">{search
                ? `${filteredCourses.length} ${filteredCourses.length === 1 ? 'result' : 'results'}.`
                : `${filteredCourses.length} ${category === 'Courses' ? 'courses' : category === 'E-books' ? 'e-books' : 'books and courses'} to browse.`}</p></div>
              <button className="text-link" onClick={() => { setSearch(''); setCategory('All products') }}>Clear filters <Icon name="close" size={16} /></button>
            </div>
            {filteredCourses.length ? <div className="course-grid">{filteredCourses.map((course) => <ProductCard key={course.id} course={course} ratingSummary={ratingSummaries[productRatingKey(course)]} purchased={ownedProductIds.includes(course.id)} onOpen={openCourse} onAdd={addToCart} />)}</div> : <div className="empty-search"><span className="empty-icon"><Icon name="search" size={23} /></span><h3>Nothing found just yet</h3><p>Try a different search or browse the complete collection.</p><button className="button button-dark" onClick={() => { setSearch(''); setCategory('All products') }}>See everything</button></div>}
          </section>
        ) : (
          <>
            <ProductSection eyebrow="READ & KEEP" title="E-books for your next chapter" description="Downloadable guides and journals, ready to keep close." items={storefrontProducts.filter((product) => product.type === 'ebook')} owned={ownedProductIds} ratingSummaries={ratingSummaries} onOpen={openCourse} onAdd={addToCart} />
            <ProductSection eyebrow="WATCH & MAKE" title="Courses to follow your curiosity" description="Buy once, then open your course video links from your library." items={storefrontProducts.filter((product) => product.type === 'course')} owned={ownedProductIds} ratingSummaries={ratingSummaries} onOpen={openCourse} onAdd={addToCart} />
          </>
        )}
      </div>
    </>
  )

  const renderCart = () => (
    <main className="inner-page">
      <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><span>Your cart</span></div>
      <div className="page-title-block"><p className="eyebrow">A GOOD CHOICE, EITHER WAY</p><h1>Your cart<span className="cart-title-count"> ({cartCourses.length})</span></h1><p>Keep the ones you’re considering. Choose what feels right when you’re ready.</p></div>
      {!cartCourses.length ? (
        <div className="empty-cart"><span className="empty-icon"><Icon name="bag" size={24} /></span><h2>Your next favorite read or course is out there.</h2><p>Have a look around, and save a little inspiration for later.</p><button className="button button-dark" onClick={() => navigate('home')}>Browse the collection <Icon name="arrow" size={16} /></button></div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Items in your cart">
            {cartCourses.map((course) => <article className={`cart-item${selectedCart.includes(course.id) ? '' : ' not-selected'}`} key={course.id}>
              <label className="cart-checkbox"><input type="checkbox" checked={selectedCart.includes(course.id)} onChange={() => toggleCartItem(course.id)} aria-label={`Select ${course.title}`} /><span className="custom-checkbox"><Icon name="check" size={14} /></span></label>
              <button className="cart-item-image" onClick={() => openCourse(course)}><img src={productImageUrl(course, 320)} alt={course.coverPath ? `${course.title} cover` : course.imageAlt} /></button>
              <div className="cart-item-info"><p className="course-category">{course.type === 'ebook' ? 'E-book' : 'Course'} <span>·</span> {course.category} · {course.instructor}</p><button className="cart-item-title" onClick={() => openCourse(course)}>{course.title}</button><p className="cart-item-meta"><Icon name="book" size={14} /> {course.type === 'ebook' ? `${course.pages} pages · ${course.fileFormat} download` : `${course.hours} · ${course.lessons} lessons`}</p><button className="remove-link" onClick={() => { setCart((items) => items.filter((id) => id !== course.id)); setSelectedCart((items) => items.filter((id) => id !== course.id)) }}>Remove</button></div>
              <strong className="cart-item-price">{formatPrice(course.price)}</strong>
            </article>)}
          </section>
          <aside className="order-summary"><p className="eyebrow">ORDER SUMMARY</p><h2>Order summary</h2><div className="summary-line"><span>Selected items</span><span>{checkoutCourses.length}</span></div><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(subtotal)}</strong></div><SlideCommit
            key={checkoutCourses.map((product) => product.id).join(':')}
            label="Slide to checkout"
            doneLabel="Opening checkout"
            errorLabel="Could not continue"
            onConfirm={() => Promise.resolve()}
            onDone={() => { setDirectCheckoutProductId(null); navigate('checkout') }}
            onError={(error) => { console.error('Could not continue to checkout', error); setToast('Could not continue to checkout. Please try again.') }}
            trackColor="#ece9f0"
            handleColor="#ffffff"
            fillColor="#673ab7"
            successColor="#673ab7"
            dangerColor="#b42318"
            width={252}
            height={48}
            radius={24}
            holdMs={0}
            disabled={!checkoutCourses.length}
          /><p className="summary-note">You’ll complete payment securely on Razorpay.</p><div className="secure-note">Secure Razorpay checkout</div></aside>
        </div>
      )}
    </main>
  )

  const renderCourseDetails = () => {
    const lessons = ['A warm welcome & what we’ll make', 'Finding the story in a brand', 'Gathering your visual inspiration', 'Putting your first idea on paper']
    const isEbook = selectedCourse.type === 'ebook'
    const alreadyOwned = ownedProductIds.includes(selectedCourse.id)
    const productRatingSummary = ratingSummaries[productRatingKey(selectedCourse)]
    const ratingAverageLabel = productRatingSummary ? Number(productRatingSummary.average_rating).toFixed(1) : '—'
    const ratingCountLabel = productRatingSummary ? ` · ${productRatingSummary.rating_count} ratings` : ''
    return (
      <main className="inner-page">
        <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><button onClick={() => navigate('home')}>{selectedCourse.category}</button><Icon name="chevron" size={14} /><span>{isEbook ? 'E-book details' : 'Course details'}</span></div>
        <div className="detail-layout">
          <section className="detail-main">
            <p className="eyebrow">{isEbook ? 'E-BOOK' : 'COURSE'} <span>·</span> {selectedCourse.category.toUpperCase()} · {selectedCourse.level.toUpperCase()}</p>
            <div className="detail-title-row">
              <h1>{selectedCourse.title}</h1>
              <div className="detail-title-rating">
                <PeekRating
                  value={ratingValue}
                  onChange={handleProductRatingChange}
                  count={5}
                  shape="star"
                  labels={['Poor', 'Fair', 'Good', 'Great', 'Superb']}
                  activeColor="#673ab7"
                  idleColor="#b8b2c2"
                  tipColor="#17151b"
                  tipTextColor="#ffffff"
                  size={22}
                  lift={5}
                  magnify={1.12}
                  riseDuration={300}
                  popScale={1.2}
                  showTip={false}
                  allowClear={false}
                  disabled={ratingLoading || ratingSaving}
                  ariaLabel="Your star rating"
                />
                <span className="detail-rating-summary">
                  <strong>{ratingAverageLabel}</strong>
                  {ratingCountLabel}
                </span>
              </div>
            </div>
            {ratingNotice && <div className={`detail-rating-feedback${ratingError ? ' detail-rating-feedback-error' : ''}`} role="status">
              <span>{ratingNotice}</span>
              {!session && <button type="button" onClick={() => { setAuthMode('login'); setAuthReturnPage('course'); navigate('auth') }}>Log in</button>}
            </div>}
            <p className="detail-intro">{isEbook
              ? 'A practical digital book to read on your own schedule. After a confirmed purchase, download the file directly from your library.'
              : 'A practical, expert-led course to follow at your own pace. After a confirmed purchase, open the private Google Drive course links from your library.'}</p>
            <div className="detail-instructor"><span className="instructor-avatar">{selectedCourse.instructor.split(' ').map((part) => part[0]).join('')}</span><span>{isEbook ? 'Author' : 'Instructor'}: <strong>{selectedCourse.instructor}</strong></span></div>
            <div className="detail-cover"><img src={productImageUrl(selectedCourse, 1200)} alt={selectedCourse.coverPath ? `${selectedCourse.title} cover` : selectedCourse.imageAlt} />{!isEbook && <span className="cover-play"><Icon name="play" size={21} /></span>}</div>
            <div className="detail-stats">{isEbook ? <span><Icon name="book" size={17} /> {selectedCourse.pages} pages · {selectedCourse.fileFormat}</span> : <><span><Icon name="clock" size={17} /> {selectedCourse.hours}</span><span><Icon name="book" size={17} /> {selectedCourse.lessons} lessons</span></>}<span><Icon name="heart" size={17} /> {selectedCourse.students} {isEbook ? 'readers' : 'learners'}</span></div>
            <section className="about-class"><p className="eyebrow">{isEbook ? 'ABOUT THIS E-BOOK' : 'ABOUT THIS COURSE'}</p><h2>{isEbook ? 'A resource to return to' : 'Learn, then put it into practice'}</h2><p>{isEbook
              ? selectedCourse.description || 'Keep the ideas and exercises close at hand. Your purchase includes access to a downloadable digital copy in your student library.'
              : selectedCourse.description || 'Follow clear lessons and practical exercises designed to help you make progress. Course videos are hosted in a private Google Drive library and are opened through your student account.'}</p></section>
            {!isEbook && <section className="curriculum"><p className="eyebrow">COURSE CONTENT</p><h2>What’s inside</h2>{lessons.map((item, index) => <div className="lesson-preview" key={item}><span className="lesson-number">0{index + 1}</span><span>{item}</span><span className="lesson-duration">{index + 2}:30</span></div>)}</section>}
          </section>
          <aside className="detail-sidebar"><p className="eyebrow">{isEbook ? 'E-BOOK PRICE' : 'COURSE PRICE'}</p><div className="detail-price">{formatPrice(selectedCourse.price)}</div><p className="sidebar-note">{isEbook ? 'One-time purchase · PDF download' : 'One-time purchase · Drive link access'}</p>{alreadyOwned ? <button className="button button-dark detail-cta" onClick={() => navigate('learn', selectedCourse)}><Icon name={isEbook ? 'book' : 'arrow'} size={16} /> {isEbook ? 'Open my e-book' : 'Open my course'}</button> : <div className="detail-actions"><button className="button button-outline detail-cta" onClick={() => addToCart(selectedCourse)}>Add to cart</button><button className="button button-dark detail-cta" onClick={() => buyNow(selectedCourse)}>Buy now <Icon name="arrow" size={16} /></button></div>}<p className="sidebar-includes">{isEbook ? 'Your e-book includes' : 'Your course includes'}</p><ul>{isEbook ? <><li><Icon name="check" size={16} /> {selectedCourse.pages} pages in PDF format</li><li><Icon name="check" size={16} /> Download from your library</li><li><Icon name="check" size={16} /> Read on your own device</li></> : <><li><Icon name="check" size={16} /> Course video links in Google Drive</li><li><Icon name="check" size={16} /> Access from your student library</li><li><Icon name="check" size={16} /> Learn on your own schedule</li></>}</ul></aside>
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
          {!checkoutCourses.length && <Notice variant="warning" title="Your cart is waiting">Your cart has no available selected items. Return to your cart to choose what you’d like.</Notice>}
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
          {paymentError ? (
            <Notice
              variant="error"
              title="Let’s sort that out"
            >
              {paymentError}
            </Notice>
          ) : (
            <p>Your order total is verified securely before the Razorpay payment window opens. You’ll never be charged without a clear confirmation.</p>
          )}
          <div className="payment-actions">
            <button className="button button-dark" disabled={paymentBusy || paymentModalOpen || !checkoutCourses.length} onClick={startCheckout}>
              {paymentBusy ? 'Preparing checkout…' : paymentModalOpen ? 'Razorpay is open…' : pendingPayment ? 'Retry payment verification' : paymentError ? 'Try again' : 'Checkout'}
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
      {paymentError ? (
        <Notice
          variant="error"
          title="We’re checking on your order"
          action={<a className="notice-action-link" href="mailto:hello@infinivium.com">Contact us</a>}
        >
          {paymentError}
        </Notice>
      ) : (
        <p className="success-copy">{paymentOrderStatus === 'paid'
          ? 'Your purchase is confirmed. Your downloads and course links are now available in your library.'
          : paymentOrderStatus === 'failed'
            ? 'No access was granted. You can return to your cart and try again.'
            : paymentOrderStatus === 'not-found'
              ? 'We could not find this order on your account. Contact support if you believe payment was taken.'
              : 'Razorpay has returned you to Infinivium. Access is enabled only after our server verifies your payment.'}</p>
      )}
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
        {deliveryError && (
          <Notice
            variant="error"
            title={isEbook ? 'Your reader needs a moment' : 'Your lessons are on their way'}
            action={<a className="notice-action-link" href="mailto:hello@infinivium.com">Contact us</a>}
          >
            {deliveryError}
          </Notice>
        )}
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
                    <span className="playlist-thumbnail"><img src={lesson.thumbnail_url || productImageUrl(selectedCourse, 320)} alt="" /><span><Icon name="play" size={17} /></span></span>
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
        {currentEnrollmentsLoading ? <p className="loading-note" role="status"><span className="loading-spinner" aria-hidden="true" /> Gathering your books and courses…</p>
          : currentEnrollmentsError ? <Notice variant="error" title="Your library is taking a moment" action={<button className="notice-action-button" type="button" onClick={() => setLibraryRefreshKey((key) => key + 1)}>Try again</button>}>{currentEnrollmentsError}</Notice>
            : myProducts.length ? <div className="course-grid library-grid">{myProducts.map((product) => <ProductCard key={product.id} course={product} purchased onOpen={openCourse} onAdd={addToCart} />)}</div>
              : <div className="empty-cart"><span className="empty-icon"><Icon name="book" size={24} /></span><h2>A library with room to grow.</h2><p>Your purchased e-books and course links will appear here once a payment is confirmed.</p><button className="button button-dark" onClick={() => navigate('home')}>Browse the collection <Icon name="arrow" size={16} /></button></div>}
      </main>
    )
  }

  const pageContent = page === 'admin'
    ? adminAccess
      ? <AdminPage email={session?.user.email ?? ''} onBack={() => setPage('home')} onSignOut={signOut} onCatalogChanged={refreshCatalog} />
      : <main className="admin-page"><p role="status">Verifying administrator access…</p></main>
    : page === 'profile' ? session
      ? <ProfilePage key={`${session.user.id}:${session.user.email}`} user={session.user} onSignOut={signOut} />
      : <main className="profile-page"><p className="profile-loading" role="status">Checking your account…</p></main>
      : page === 'auth' ? <AuthPage initialMode={authMode} onModeChange={setAuthMode} onAuthenticated={finishAuthentication} onSignupSuccess={finishSignup} /> : page === 'home' ? renderHome() : page === 'cart' ? renderCart() : page === 'checkout' ? renderCheckout() : page === 'payment-return' ? renderPaymentReturn() : page === 'course' ? renderCourseDetails() : page === 'learn' ? renderLearning() : renderLibrary()
  return (
    <div className={`site-shell${page === 'admin' ? ' admin-shell' : ''}`}>
      {page !== 'admin' && <>
      <div className="header-top-strip" />
      <header className="site-header">
        <button className="brand" onClick={() => navigate('home')} aria-label="Infinivium home"><img className="brand-logo" src="/infinivium-logo.png" alt="" /></button>
        <div className="search-field">
          <Icon name="search" size={18} />
          <label className="visually-hidden" htmlFor="site-search">Search books and courses</label>
          <input
            id="site-search"
            type="search"
            placeholder="Search books, courses, or instructors"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setCategory('All products'); if (page !== 'home') setPage('home') }}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => { setSearch(''); setCategory('All products') }} aria-label="Clear search">
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
        <div className="header-actions">
          <button className="cart-button" onClick={() => navigate('cart')} aria-label={`Cart${cart.length ? `, ${cart.length} items` : ''}`}><span key={cartPulse} className={cartPulse ? 'cart-pop-icon' : ''}><Icon name="cart" size={20} /></span>{cart.length > 0 && <i>{cart.length}</i>}</button>
          {session ? <button className="header-auth-button" onClick={signOut}>Log out</button> : <>
            <button className="header-auth-button" onClick={() => { setAuthMode('login'); setAuthReturnPage('home'); navigate('auth') }}>Log in</button>
            <button className="header-signup-button" onClick={() => { setAuthMode('signup'); setAuthReturnPage('home'); setPage('auth') }}>Sign up</button>
          </>}
          {session && <button className={`profile-button${page === 'profile' ? ' profile-button-active' : ''}`} onClick={() => navigate('profile')} aria-label="Open profile"><Icon name="user" size={17} />Profile</button>}
        </div>
      </header>
      <div className="mobile-search">
        <Icon name="search" size={18} />
        <label className="visually-hidden" htmlFor="mobile-site-search">Search books and courses</label>
        <input
          id="mobile-site-search"
          type="search"
          placeholder="Find a book or course"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setCategory('All products'); if (page !== 'home') setPage('home') }}
        />
        {search && (
          <button type="button" className="search-clear" onClick={() => { setSearch(''); setCategory('All products') }} aria-label="Clear search">
            <Icon name="close" size={14} />
          </button>
        )}
      </div>
      </>}
      {pageContent}
      {accountError && (
        <div className="account-notice-wrap">
          <Notice variant="error" title="A quick note" onDismiss={() => setAccountError('')}>
            {accountError}
          </Notice>
        </div>
      )}
      {page !== 'admin' && <>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-block"><button className="brand footer-brand" onClick={() => navigate('home')} aria-label="Infinivium home"><img className="brand-logo" src="/infinivium-logo.png" alt="" /></button><p>Find a new idea.<br />Make room to grow.</p></div>
          <div className="footer-column"><p className="footer-heading">A good place to start</p><button onClick={() => navigate('home')}>Browse the collection</button><button onClick={() => navigate('library')}>My library</button><button onClick={() => navigate('cart')}>Your cart</button></div>
          <div className="footer-column"><p className="footer-heading">A little hello</p><a href="mailto:hello@infinivium.com">Get in touch</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <span>↗</span></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook <span>↗</span></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube <span>↗</span></a></div>
          <div className="footer-note"><span className="footer-sun"><Icon name="sun" size={22} /></span><p>Here’s to a life<br />of always learning.</p></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Infinivium. Made for the curious.</span><span>Good things to learn, wherever you are <span className="footer-heart">♥</span></span></div>
      </footer>
      </>}
      {toast && <div className="toast-message" role="status"><span><Icon name="check" size={17} /></span>{toast}</div>}
      {signupSuccess && (
        <div className="signup-success-alert" role="alert" aria-live="assertive">
          <span className="signup-success-icon"><Icon name="check" size={24} /></span>
          <div>
            <strong>Account created successfully</strong>
            <p>Check <b>{signupSuccess.email}</b> and verify your email before signing in.</p>
            <span>Returning to the homepage in {signupSuccess.seconds}s</span>
          </div>
        </div>
      )}
      {logoutAlert && (
        <div className="logout-alert" role="alert" aria-live="assertive">
          <span className="logout-spinner" aria-hidden="true" />
          <div>
            <strong>Logging you out of your account…</strong>
            <p>Please wait a moment.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
