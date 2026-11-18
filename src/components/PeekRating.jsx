import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FavouriteIcon, FlashIcon, StarIcon } from '@hugeicons/core-free-icons'
import './PeekRating.css'

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const SHAPES = { star: StarIcon, heart: FavouriteIcon, bolt: FlashIcon }
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function PeekRating({
  value: valueProp,
  defaultValue = 0,
  onChange,
  onPreview,
  count = 5,
  shape = 'star',
  icon,
  labels = [],
  activeColor = '#f5b400',
  idleColor = '#52525b',
  tipColor = '#27272a',
  tipTextColor = '#f5f5f5',
  size = 28,
  lift = 6,
  magnify = 1.15,
  riseDuration = 320,
  popScale = 1.3,
  showTip = true,
  allowClear = true,
  readOnly = false,
  disabled = false,
  ariaLabel = 'Rating',
  className = '',
}) {
  const [inner, setInner] = useState(defaultValue)
  const value = clamp(valueProp ?? inner, 0, count)
  const interactive = !readOnly && !disabled
  const rootRef = useRef(null)
  const rowRef = useRef(null)
  const tipEl = useRef(null)
  const starEls = useRef([])
  const liftEls = useRef([])
  const glyphEls = useRef([])
  const state = useRef({ hover: null, pressing: false, pointerId: null, settled: false, rect: null, rtl: false })

  const paint = () => {
    const { hover, settled, rtl } = state.current
    const previewing = hover !== null && !settled
    const shown = previewing ? hover + 1 : value
    const still = reducedMotion()

    for (let index = 0; index < count; index += 1) {
      const liftElement = liftEls.current[index]
      const glyphElement = glyphEls.current[index]
      if (!liftElement || !glyphElement) continue
      const lifted = previewing && !still && index <= hover
      liftElement.style.transform = lifted
        ? `translateY(${-lift}px) scale(${index === hover ? magnify : 1})`
        : 'translateY(0px) scale(1)'
      glyphElement.dataset.lit = String(index < shown)
    }

    const tip = tipEl.current
    if (!tip) return
    if (previewing && showTip) {
      const row = rowRef.current
      const slot = row ? row.clientWidth / count : size
      const visual = rtl ? count - 1 - hover : hover
      const wasHidden = tip.dataset.show !== 'true'
      if (wasHidden) tip.style.transition = 'none'
      tip.textContent = labels[hover] ?? String(hover + 1)
      tip.style.transform = `translate(calc(${slot * (visual + 0.5)}px - 50%), 0)`
      if (wasHidden) {
        void tip.offsetWidth
        tip.style.transition = ''
      }
      tip.dataset.show = 'true'
    } else {
      tip.dataset.show = 'false'
    }
  }
  useLayoutEffect(paint)

  const setHover = (index) => {
    if (index === state.current.hover) return
    state.current.hover = index
    if (index !== null) state.current.settled = false
    paint()
    onPreview?.(index === null ? null : index + 1)
  }
  const setHoverRef = useRef(setHover)
  useLayoutEffect(() => {
    setHoverRef.current = setHover
  })

  const measure = () => {
    const row = rowRef.current
    if (!row) return
    state.current.rect = row.getBoundingClientRect()
    state.current.rtl = getComputedStyle(row).direction === 'rtl'
  }

  const indexAt = (x, y) => {
    const { rect, pressing, rtl } = state.current
    if (!rect || !rect.width) return null
    if (pressing && (y < rect.top - size || y > rect.bottom + size)) return null
    const index = clamp(Math.floor(((x - rect.left) / rect.width) * count), 0, count - 1)
    return rtl ? count - 1 - index : index
  }

  const commit = (next, pop = true) => {
    if (valueProp === undefined) setInner(next)
    onChange?.(next)
    state.current.settled = true
    paint()
    const glyph = glyphEls.current[next - 1]
    if (pop && next > 0 && popScale > 1 && glyph && typeof glyph.animate === 'function' && !reducedMotion()) {
      glyph.getAnimations().forEach((animation) => animation.cancel())
      glyph.animate([
        { transform: 'scale(1)', easing: EASE_OUT },
        { transform: `scale(${popScale})`, offset: 0.35, easing: EASE_OUT },
        { transform: 'scale(1)' },
      ], { duration: 300 })
    }
  }

  const handlePointerEnter = (event) => {
    if (!interactive || event.pointerType !== 'mouse') return
    rootRef.current?.removeAttribute('data-instant')
    measure()
  }
  const handlePointerDown = (event) => {
    if (!interactive || event.button !== 0 || state.current.pointerId !== null) return
    rootRef.current?.removeAttribute('data-instant')
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {}
    state.current.pointerId = event.pointerId
    state.current.pressing = true
    measure()
    setHover(indexAt(event.clientX, event.clientY))
  }
  const handlePointerMove = (event) => {
    if (!interactive) return
    const { pressing, pointerId } = state.current
    if (event.pointerType !== 'mouse' && !pressing) return
    if (pressing && event.pointerId !== pointerId) return
    if (!pressing && !state.current.rect) measure()
    setHover(indexAt(event.clientX, event.clientY))
  }
  const endPress = (event) => {
    const { pressing, pointerId, hover } = state.current
    if (!pressing || event.pointerId !== pointerId) return
    state.current.pressing = false
    state.current.pointerId = null
    if (event.type === 'pointerup' && hover !== null) {
      const next = hover + 1
      commit(allowClear && next === value ? 0 : next)
    }
    if (event.pointerType !== 'mouse') setHover(null)
  }
  const handlePointerLeave = () => {
    if (!state.current.pressing) setHover(null)
  }
  const handleKeyDown = (event) => {
    if (!interactive) return
    const min = allowClear ? 0 : 1
    let next
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = clamp(value + 1, min, count)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = clamp(value - 1, min, count)
        break
      case 'Home':
        next = 1
        break
      case 'End':
        next = count
        break
      case 'Backspace':
      case 'Delete':
        if (!allowClear) return
        next = 0
        break
      case ' ':
      case 'Enter': {
        const index = starEls.current.indexOf(event.target)
        if (index === -1) return
        next = allowClear && index + 1 === value ? 0 : index + 1
        break
      }
      default:
        return
    }
    event.preventDefault()
    rootRef.current?.setAttribute('data-instant', 'true')
    state.current.hover = null
    commit(next, false)
    starEls.current[Math.max(next, 1) - 1]?.focus()
  }

  useEffect(() => {
    const reset = () => {
      state.current.pressing = false
      state.current.pointerId = null
      setHoverRef.current(null)
    }
    const onVisibility = () => {
      if (document.hidden) reset()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', reset)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', reset)
    }
  }, [])

  const Star = readOnly ? 'span' : 'button'
  const shapeIcon = SHAPES[shape] || SHAPES.star
  const tipRoom = interactive && showTip ? Math.round(size * 0.9) : 0

  return (
    <div
      ref={rootRef}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${value} of ${count}` : ariaLabel}
      aria-disabled={disabled || undefined}
      className={`peek-rating${className ? ` ${className}` : ''}`}
      style={{
        '--pr-active': activeColor,
        '--pr-idle': idleColor,
        '--pr-tip': tipColor,
        '--pr-tip-text': tipTextColor,
        '--pr-size': `${size}px`,
        '--pr-gap': `${Math.round(size * 0.22)}px`,
        '--pr-room': `${lift + tipRoom}px`,
        '--pr-rise': `${riseDuration}ms`,
      }}
      onKeyDown={readOnly ? undefined : handleKeyDown}
    >
      <div
        ref={rowRef}
        className="peek-rating__row"
        onPointerEnter={handlePointerEnter}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onLostPointerCapture={endPress}
        onPointerLeave={handlePointerLeave}
      >
        {interactive && showTip ? <span ref={tipEl} className="peek-rating__tip" aria-hidden="true" /> : null}
        {Array.from({ length: count }, (_, index) => {
          const checked = value === index + 1
          const label = labels[index] ? `${index + 1} of ${count}, ${labels[index]}` : `${index + 1} of ${count}`
          return (
            <Star
              key={index}
              ref={(element) => { starEls.current[index] = element }}
              type={readOnly ? undefined : 'button'}
              className="peek-rating__star"
              role={readOnly ? undefined : 'radio'}
              aria-checked={readOnly ? undefined : checked}
              aria-label={readOnly ? undefined : label}
              aria-hidden={readOnly || undefined}
              tabIndex={!interactive ? -1 : (value === 0 ? index === 0 : checked) ? 0 : -1}
            >
              <span ref={(element) => { liftEls.current[index] = element }} className="peek-rating__lift">
                <span ref={(element) => { glyphEls.current[index] = element }} className="peek-rating__glyph">
                  {icon ?? <HugeiconsIcon icon={shapeIcon} size={size} fill="currentColor" strokeWidth={1.5} />}
                </span>
              </span>
            </Star>
          )
        })}
      </div>
    </div>
  )
}
