import { useEffect, useMemo, useState } from 'react'
import './App.css'

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

const categories = ['All courses', 'Design', 'Photography', 'Lifestyle', 'Wellness', 'Art']
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

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16h16M8 7h8" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    heart: <path d="M20.8 8.7c0 4.2-8.8 10-8.8 10S3.2 12.9 3.2 8.7A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.8 2.2Z" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
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

function CourseCard({ course, purchased, onOpen, onAdd }) {
  return (
    <article className="course-card">
      <button className="course-image-button" onClick={() => onOpen(course)} aria-label={`View ${course.title}`}>
        <img className="course-image" src={imageUrl(course.image)} alt={course.imageAlt} />
        <span className="course-tag">{course.tag}</span>
      </button>
      <div className="course-card-body">
        <p className="course-category">{course.category}</p>
        <button className="course-title-button" onClick={() => onOpen(course)}>{course.title}</button>
        <p className="course-instructor">with {course.instructor}</p>
        <div className="course-rating"><Icon name="star" size={15} /><strong>{course.rating}</strong><span>({course.reviews.toLocaleString()})</span></div>
        <div className="course-card-bottom">
          <strong className="course-price">{formatPrice(course.price)}</strong>
          <button
            className={`add-course-button${purchased ? ' is-owned' : ''}`}
            onClick={() => purchased ? onOpen(course) : onAdd(course)}
            aria-label={purchased ? `Start learning ${course.title}` : `Add ${course.title} to cart`}
          >
            {purchased ? <><Icon name="play" size={15} /> Learn</> : <Icon name="plus" size={18} />}
          </button>
        </div>
      </div>
    </article>
  )
}

function CourseSection({ title, eyebrow, description, items, owned, onOpen, onAdd, onExplore }) {
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
        {items.map((course) => <CourseCard key={course.id} course={course} purchased={owned.includes(course.id)} onOpen={onOpen} onAdd={onAdd} />)}
      </div>
    </section>
  )
}

function App() {
  const [page, setPage] = useState('home')
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0].id)
  const [cart, setCart] = useState(() => readStored('grand-sun-cart', []))
  const [selectedCart, setSelectedCart] = useState(() => readStored('grand-sun-selected-cart', []))
  const [owned, setOwned] = useState(() => readStored('grand-sun-owned', []))
  const [lastPurchase, setLastPurchase] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All courses')
  const [slide, setSlide] = useState(0)
  const [toast, setToast] = useState('')
  const [lesson, setLesson] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const featured = [courses[0], courses[3], courses[4]]
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0]
  const cartCourses = cart.map((id) => courses.find((course) => course.id === id)).filter(Boolean)
  const checkoutCourses = cartCourses.filter((course) => selectedCart.includes(course.id))
  const subtotal = checkoutCourses.reduce((total, course) => total + course.price, 0)
  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesCategory = category === 'All courses' || course.category === category
      const matchesQuery = !query || `${course.title} ${course.category} ${course.instructor}`.toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [category, search])

  useEffect(() => { localStorage.setItem('grand-sun-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('grand-sun-selected-cart', JSON.stringify(selectedCart)) }, [selectedCart])
  useEffect(() => { localStorage.setItem('grand-sun-owned', JSON.stringify(owned)) }, [owned])
  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % featured.length), 6500)
    return () => window.clearInterval(timer)
  }, [featured.length])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const navigate = (nextPage, course) => {
    if (course) setSelectedCourseId(course.id)
    setPage(nextPage)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openCourse = (course) => navigate(owned.includes(course.id) ? 'learn' : 'course', course)
  const addToCart = (course) => {
    if (owned.includes(course.id) || cart.includes(course.id)) {
      setToast(owned.includes(course.id) ? 'This course is already in your library.' : 'This course is already in your cart.')
      return
    }
    setCart((items) => [...items, course.id])
    setSelectedCart((items) => [...items, course.id])
    setToast('Added to your cart.')
  }
  const toggleCartItem = (courseId) => {
    setSelectedCart((items) => items.includes(courseId) ? items.filter((id) => id !== courseId) : [...items, courseId])
  }
  const finishCheckout = (event) => {
    event.preventDefault()
    if (!checkoutCourses.length) return
    const purchasedIds = checkoutCourses.map((course) => course.id)
    setLastPurchase(purchasedIds)
    setOwned((items) => [...new Set([...items, ...purchasedIds])])
    setCart((items) => items.filter((id) => !purchasedIds.includes(id)))
    setSelectedCart((items) => items.filter((id) => !purchasedIds.includes(id)))
    setPage('success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderHome = () => (
    <>
      <section className="hero-section" aria-label="Featured courses">
        <div className="hero-photo" style={{ backgroundImage: `url("${imageUrl(featured[slide].image, 1800)}")` }} />
        <div className="hero-scrim" />
        <div className="hero-content">
          <span className="hero-kicker"><span className="kicker-sun"><Icon name="sun" size={14} /></span> ONLINE COURSES FOR EVERY AMBITION</span>
          <h1>Learn something<br /><em>new today.</em></h1>
          <p>Practical, expert-led classes to help you build skills, explore new interests, and reach your goals.</p>
          <div className="hero-actions">
            <button className="button button-gold" onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })}>Browse courses <Icon name="arrow" size={17} /></button>
            <button className="hero-play-link" onClick={() => openCourse(featured[slide])}><span className="play-ring"><Icon name="play" size={14} /></span> View featured course</button>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="hero-proof"><span className="proof-avatars"><i>J</i><i>A</i><i>M</i></span><span><strong>12,000+</strong> curious minds learning</span></div>
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
        {search || category !== 'All courses' ? (
          <section className="course-section search-results">
            <div className="section-heading">
              <div><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>{search ? `Results for “${search}”` : category}</h2><p className="section-description">{filteredCourses.length} thoughtful classes to explore.</p></div>
              <button className="text-link" onClick={() => { setSearch(''); setCategory('All courses') }}>Clear filters <Icon name="close" size={16} /></button>
            </div>
            {filteredCourses.length ? <div className="course-grid">{filteredCourses.map((course) => <CourseCard key={course.id} course={course} purchased={owned.includes(course.id)} onOpen={openCourse} onAdd={addToCart} />)}</div> : <div className="empty-search"><span className="empty-icon"><Icon name="search" size={23} /></span><h3>No classes found just yet</h3><p>Try a different search or browse all of our classes.</p><button className="button button-dark" onClick={() => { setSearch(''); setCategory('All courses') }}>See all classes</button></div>}
          </section>
        ) : (
          <>
            <CourseSection eyebrow="TRENDING NOW" title="Trending courses" description="Explore the courses learners are watching right now." items={[courses[0], courses[1], courses[4]]} owned={owned} onOpen={openCourse} onAdd={addToCart} onExplore={() => { setCategory('All courses'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }} />
            <CourseSection eyebrow="TOP RATED" title="Most reviewed" description="Highly rated courses recommended by our learners." items={[courses[2], courses[0], courses[5]]} owned={owned} onOpen={openCourse} onAdd={addToCart} onExplore={() => { setCategory('All courses'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }} />
            <CourseSection eyebrow="POPULAR COURSES" title="Most purchased" description="Popular picks to help you get started on something new." items={[courses[3], courses[4], courses[1]]} owned={owned} onOpen={openCourse} onAdd={addToCart} onExplore={() => { setCategory('All courses'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }} />
          </>
        )}
      </div>

      <section className="newsletter">
        <div className="newsletter-sun"><Icon name="sun" size={27} /></div>
        <div><p className="eyebrow">THE GRAND SUN NEWSLETTER</p><h2>New courses and learning ideas.</h2><p>Get occasional updates about new courses and learning resources.</p></div>
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
        <div className="empty-cart"><span className="empty-icon"><Icon name="bag" size={24} /></span><h2>Your next favorite class is out there.</h2><p>Have a look around, and save a little inspiration for later.</p><button className="button button-dark" onClick={() => navigate('home')}>Explore classes <Icon name="arrow" size={16} /></button></div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Items in your cart">
            {cartCourses.map((course) => <article className={`cart-item${selectedCart.includes(course.id) ? '' : ' not-selected'}`} key={course.id}>
              <label className="cart-checkbox"><input type="checkbox" checked={selectedCart.includes(course.id)} onChange={() => toggleCartItem(course.id)} aria-label={`Select ${course.title}`} /><span className="custom-checkbox"><Icon name="check" size={14} /></span></label>
              <button className="cart-item-image" onClick={() => openCourse(course)}><img src={imageUrl(course.image, 320)} alt={course.imageAlt} /></button>
              <div className="cart-item-info"><p className="course-category">{course.category} <span>·</span> {course.instructor}</p><button className="cart-item-title" onClick={() => openCourse(course)}>{course.title}</button><p className="cart-item-meta"><Icon name="clock" size={14} /> {course.hours} <span>·</span> <Icon name="book" size={14} /> {course.lessons} lessons</p><button className="remove-link" onClick={() => { setCart((items) => items.filter((id) => id !== course.id)); setSelectedCart((items) => items.filter((id) => id !== course.id)) }}>Remove</button></div>
              <strong className="cart-item-price">{formatPrice(course.price)}</strong>
            </article>)}
          </section>
          <aside className="order-summary"><p className="eyebrow">ORDER SUMMARY</p><h2>Order summary</h2><div className="summary-line"><span>Selected courses</span><span>{checkoutCourses.length}</span></div><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(subtotal)}</strong></div><button className="button button-dark checkout-button" disabled={!checkoutCourses.length} onClick={() => navigate('checkout')}>Continue to checkout <Icon name="arrow" size={17} /></button><p className="summary-note"><Icon name="check" size={15} /> Your courses will be available in My classes.</p><div className="secure-note">Secure checkout</div></aside>
        </div>
      )}
    </main>
  )

  const renderCourseDetails = () => {
    const lessons = ['A warm welcome & what we’ll make', 'Finding the story in a brand', 'Gathering your visual inspiration', 'Putting your first idea on paper']
    return (
      <main className="inner-page">
        <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><button onClick={() => navigate('home')}>{selectedCourse.category}</button><Icon name="chevron" size={14} /><span>Class details</span></div>
        <div className="detail-layout">
          <section className="detail-main">
            <p className="eyebrow">{selectedCourse.category.toUpperCase()} <span>·</span> {selectedCourse.level.toUpperCase()}</p>
            <h1>{selectedCourse.title}</h1>
            <p className="detail-intro">Build practical skills with expert instruction. Learn at your own pace and apply what you learn to your own projects.</p>
            <div className="detail-instructor"><span className="instructor-avatar">{selectedCourse.instructor.split(' ').map((part) => part[0]).join('')}</span><span>Instructor: <strong>{selectedCourse.instructor}</strong></span></div>
            <div className="detail-cover"><img src={imageUrl(selectedCourse.image, 1200)} alt={selectedCourse.imageAlt} /><span className="cover-play"><Icon name="play" size={21} /></span></div>
            <div className="detail-stats"><span><Icon name="star" size={17} /><strong>{selectedCourse.rating}</strong> ({selectedCourse.reviews.toLocaleString()} reviews)</span><span><Icon name="clock" size={17} /> {selectedCourse.hours}</span><span><Icon name="book" size={17} /> {selectedCourse.lessons} lessons</span><span><Icon name="heart" size={17} /> {selectedCourse.students} learners</span></div>
            <section className="about-class"><p className="eyebrow">ABOUT THIS COURSE</p><h2>What you’ll learn</h2><p>This course covers the key techniques and practical skills you need to make progress. Follow the lessons in order, or revisit any topic as you work on your own projects.</p></section>
            <section className="curriculum"><p className="eyebrow">COURSE CONTENT</p><h2>Course curriculum</h2>{lessons.map((item, index) => <div className="lesson-preview" key={item}><span className="lesson-number">0{index + 1}</span><span>{item}</span><span className="lesson-duration">{index + 2}:30</span></div>)}</section>
          </section>
          <aside className="detail-sidebar"><p className="eyebrow">COURSE PRICE</p><div className="detail-price">{formatPrice(selectedCourse.price)}</div><p className="sidebar-note">One-time payment. Learn at your own pace.</p><button className="button button-dark detail-cta" onClick={() => owned.includes(selectedCourse.id) ? navigate('learn', selectedCourse) : addToCart(selectedCourse)}>{owned.includes(selectedCourse.id) ? <><Icon name="play" size={16} /> Start learning</> : <>Add to cart <Icon name="arrow" size={16} /></>}</button><p className="sidebar-includes">This course includes</p><ul><li><Icon name="check" size={16} /> {selectedCourse.lessons} on-demand lessons</li><li><Icon name="check" size={16} /> Learn on your own schedule</li><li><Icon name="check" size={16} /> Lifetime course access</li><li><Icon name="check" size={16} /> Access on mobile and desktop</li></ul></aside>
        </div>
      </main>
    )
  }

  const renderCheckout = () => (
    <main className="inner-page">
      <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><button onClick={() => navigate('cart')}>Your cart</button><Icon name="chevron" size={14} /><span>Checkout</span></div>
      <div className="page-title-block"><p className="eyebrow">SECURE CHECKOUT</p><h1>Complete your order.</h1><p>Enter your details to continue.</p></div>
      {!checkoutCourses.length ? <div className="empty-cart"><span className="empty-icon"><Icon name="bag" size={24} /></span><h2>Your checkout is taking a little break.</h2><p>Choose at least one class from your cart to continue.</p><button className="button button-dark" onClick={() => navigate('cart')}>Back to your cart <Icon name="arrow" size={16} /></button></div> : (
        <form className="checkout-layout" onSubmit={finishCheckout}>
          <section className="checkout-form">
            <div className="checkout-step"><span>01</span><div><h2>Contact details</h2><p>Where should we send your order confirmation?</p></div></div>
            <div className="form-row"><label>First name<input name="firstName" autoComplete="given-name" placeholder="Jamie" required /></label><label>Last name<input name="lastName" autoComplete="family-name" placeholder="Parker" required /></label></div>
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <div className="checkout-step payment-step"><span>02</span><div><h2>Payment details</h2><p>Demo checkout — no payment will be taken.</p></div></div>
            <label>Name on card<input name="cardName" autoComplete="cc-name" placeholder="Jamie Parker" required /></label>
            <label>Card number<input name="cardNumber" inputMode="numeric" autoComplete="cc-number" minLength="12" placeholder="4242 4242 4242 4242" required /></label>
            <div className="form-row"><label>Expiry date<input name="expiry" autoComplete="cc-exp" placeholder="MM / YY" required /></label><label>Security code<input name="cvc" inputMode="numeric" autoComplete="cc-csc" minLength="3" placeholder="CVC" required /></label></div>
            <p className="demo-payment-note">This is a starter-project demo. Card details aren’t processed or stored.</p>
          </section>
          <aside className="order-summary checkout-summary"><p className="eyebrow">ORDER SUMMARY</p><h2>Your courses</h2>{checkoutCourses.map((course) => <div className="checkout-product" key={course.id}><img src={imageUrl(course.image, 220)} alt="" /><div><strong>{course.title}</strong><span>{course.instructor}</span></div><strong>{formatPrice(course.price)}</strong></div>)}<div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line summary-total"><strong>Total today</strong><strong>{formatPrice(subtotal)}</strong></div><button type="submit" className="button button-dark checkout-button">Complete demo checkout <Icon name="arrow" size={17} /></button><p className="summary-note"><Icon name="check" size={15} /> Demo only. No payment will be taken.</p></aside>
        </form>
      )}
    </main>
  )

  const renderLearning = () => {
    const lessons = ['A warm welcome & what we’ll make', 'Finding the story in a brand', 'Gathering your visual inspiration', 'Putting your first idea on paper']
    return (
      <main className="inner-page learning-page">
        <div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><button onClick={() => navigate('library')}>My classes</button><Icon name="chevron" size={14} /><span>{selectedCourse.title}</span></div>
        <div className="learning-heading"><div><p className="eyebrow">YOUR CLASSROOM</p><h1>{selectedCourse.title}</h1><p>Take your time. You’re right where you need to be.</p></div><button className="text-link" onClick={() => navigate('library')}><Icon name="book" size={16} /> All my classes</button></div>
        <div className="learning-layout"><section className="lesson-stage"><div className="video-wrap"><video controls playsInline poster={imageUrl(selectedCourse.image, 1200)} src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4">Your browser doesn’t support embedded video.</video><span className="demo-video-note">Sample media — replace with your course video</span></div><div className="active-lesson"><span className="eyebrow">LESSON {String(lesson + 1).padStart(2, '0')} OF {lessons.length}</span><h2>{lessons[lesson]}</h2><p>Settle in, take a breath, and enjoy learning at your own pace.</p></div></section><aside className="lesson-list"><p className="eyebrow">IN THIS CLASS</p><h2>Class lessons</h2>{lessons.map((item, index) => <button className={`lesson-list-item${lesson === index ? ' current-lesson' : ''}`} key={item} onClick={() => setLesson(index)}><span className="lesson-list-icon"><Icon name={lesson === index ? 'play' : 'book'} size={15} /></span><span><strong>{item}</strong><small>{index + 2}:30 min</small></span><span className="lesson-done">{lesson > index ? <Icon name="check" size={16} /> : null}</span></button>)}</aside></div>
      </main>
    )
  }

  const renderLibrary = () => {
    const myCourses = courses.filter((course) => owned.includes(course.id))
    return <main className="inner-page"><div className="breadcrumb"><button onClick={() => navigate('home')}>Home</button><Icon name="chevron" size={14} /><span>My classes</span></div><div className="page-title-block"><p className="eyebrow">YOUR OWN LITTLE LIBRARY</p><h1>My classes</h1><p>Your next chapter is right where you left it.</p></div>{myCourses.length ? <div className="course-grid library-grid">{myCourses.map((course) => <CourseCard key={course.id} course={course} purchased onOpen={openCourse} onAdd={addToCart} />)}</div> : <div className="empty-cart"><span className="empty-icon"><Icon name="book" size={24} /></span><h2>A library with room to grow.</h2><p>Once you find a class that feels right, you’ll find it here.</p><button className="button button-dark" onClick={() => navigate('home')}>Explore classes <Icon name="arrow" size={16} /></button></div>}</main>
  }

  const renderSuccess = () => (
    <main className="inner-page success-page"><span className="success-sun"><Icon name="sun" size={33} /></span><p className="eyebrow">A BRIGHT NEW BEGINNING</p><h1>Your next chapter starts now.</h1><p className="success-copy">Your demo order is all set. Your new classes are waiting in your library.</p><div className="success-actions"><button className="button button-dark" onClick={() => navigate('library')}>Visit my classes <Icon name="arrow" size={16} /></button><button className="text-link" onClick={() => navigate('home')}>Back to browsing</button></div><div className="success-courses">{lastPurchase.map((id) => courses.find((course) => course.id === id)).filter(Boolean).map((course) => <button key={course.id} onClick={() => navigate('learn', course)}><img src={imageUrl(course.image, 320)} alt="" /><span><strong>{course.title}</strong><small>Ready when you are <Icon name="arrow" size={14} /></small></span></button>)}</div></main>
  )

  const pageContent = page === 'home' ? renderHome() : page === 'cart' ? renderCart() : page === 'checkout' ? renderCheckout() : page === 'course' ? renderCourseDetails() : page === 'learn' ? renderLearning() : page === 'library' ? renderLibrary() : renderSuccess()

  return (
    <div className="site-shell">
      <div className="announcement"><Icon name="sun" size={14} /><span>A little something good to learn — <button onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })}>find your next class <Icon name="arrow" size={12} /></button></span></div>
      <header className="site-header">
        <button className="brand" onClick={() => navigate('home')} aria-label="The Grand Sun home"><span className="brand-mark"><Icon name="sun" size={23} /></span><span className="brand-name">the grand <strong>sun</strong><small>A BRIGHTER WAY TO LEARN</small></span></button>
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}><Icon name={mobileMenuOpen ? 'close' : 'menu'} size={22} /></button>
        <nav className={`main-nav${mobileMenuOpen ? ' nav-open' : ''}`} aria-label="Main navigation">
          <button className={page === 'home' ? 'nav-active' : ''} onClick={() => navigate('home')}>Explore</button>
          <button onClick={() => { setCategory('All courses'); setSearch(''); navigate('home'); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }) }}>Classes</button>
          <button className={page === 'library' || page === 'learn' ? 'nav-active' : ''} onClick={() => navigate('library')}>My classes{owned.length > 0 && <span className="nav-count">{owned.length}</span>}</button>
        </nav>
        <div className="header-actions">
          <label className="search-field"><Icon name="search" size={18} /><input type="search" placeholder="What would you love to learn?" value={search} onChange={(event) => { setSearch(event.target.value); setCategory('All courses'); if (page !== 'home') setPage('home') }} aria-label="Search classes" /><kbd>⌕</kbd></label>
          <button className="cart-button" onClick={() => navigate('cart')} aria-label={`Your cart${cart.length ? `, ${cart.length} items` : ''}`}><Icon name="bag" size={20} /><span>Cart</span>{cart.length > 0 && <i>{cart.length}</i>}</button>
        </div>
      </header>
      <div className="mobile-search"><Icon name="search" size={18} /><input type="search" placeholder="What would you love to learn?" value={search} onChange={(event) => { setSearch(event.target.value); setCategory('All courses'); if (page !== 'home') setPage('home') }} aria-label="Search classes" /></div>
      {pageContent}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-block"><button className="brand footer-brand" onClick={() => navigate('home')}><span className="brand-mark"><Icon name="sun" size={23} /></span><span className="brand-name">the grand <strong>sun</strong><small>ONLINE LEARNING</small></span></button><p>Learn a new skill.<br />Reach your next goal.</p></div>
          <div className="footer-column"><p className="footer-heading">A good place to start</p><button onClick={() => navigate('home')}>Explore classes</button><button onClick={() => navigate('library')}>My classes</button><button onClick={() => navigate('cart')}>Your cart</button></div>
          <div className="footer-column"><p className="footer-heading">A little hello</p><a href="mailto:hello@thegrandsun.com">Get in touch</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <span>↗</span></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook <span>↗</span></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube <span>↗</span></a></div>
          <div className="footer-note"><span className="footer-sun"><Icon name="sun" size={22} /></span><p>Here’s to a life<br />of always learning.</p></div>
        </div>
        <div className="footer-bottom"><span>© 2025 The Grand Sun. Made for the curious.</span><span>Good things to learn, wherever you are <span className="footer-heart">♥</span></span></div>
      </footer>
      {toast && <div className="toast-message" role="status"><span><Icon name="check" size={17} /></span>{toast}</div>}
    </div>
  )
}

export default App
