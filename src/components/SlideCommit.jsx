import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import './SlideCommit.css'

const PAD = 4
const SQUASH_MAX = 0.08
const SQUASH_DIV = 110
const SWELL = 1.03
const MIN_PENDING = 300
const EASE_OUT = [0.23, 1, 0.32, 1]
const SHAKE = [0, -5, 5, -3, 3, -1, 0]
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const onColor = (hex) => {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? [...raw].map((character) => character + character).join('') : raw.slice(0, 6)
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) return '#ffffff'
  const yiq = (((value >> 16) & 255) * 299 + ((value >> 8) & 255) * 587 + (value & 255) * 114) / 1000
  return yiq >= 128 ? '#111111' : '#ffffff'
}
const velocityOf = (history) => {
  if (history.length < 2) return 0
  const [startTime, startX] = history[0]
  const [endTime, endX] = history[history.length - 1]
  return ((endX - startX) / Math.max(1, endTime - startTime)) * 1000
}
const finePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

const Spinner = ({ size }) => (
  <svg className="slide-commit__spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeOpacity="0.25" />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)

export default function SlideCommit({
  label = 'Slide to pay',
  doneLabel = 'Paid',
  errorLabel = 'Payment failed',
  onConfirm,
  onDone,
  onError,
  trackColor = '#ece9f0',
  handleColor = '#f5f5f5',
  fillColor = '#673ab7',
  successColor = '#673ab7',
  dangerColor = '#e5484d',
  width = 280,
  height = 56,
  radius = 28,
  speed = 50,
  returnBounce = 0.38,
  landingDip = 0.026,
  holdMs = 1500,
  disabled = false,
  icon,
  className = '',
}) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState('idle')
  const [held, setHeld] = useState(false)
  const [hot, setHot] = useState(false)
  const trackRef = useRef(null)
  const capsuleRef = useRef(null)
  const grip = useRef(null)
  const timer = useRef(0)
  const homeTimer = useRef(0)
  const run = useRef(0)
  const unwatch = useRef(null)
  const live = useRef({ move: () => {}, up: () => {} })
  const lastPercent = useRef(0)
  const GRIP = height - PAD * 2
  const INNER = width - PAD * 2
  const TRAVEL = Math.max(1, INNER - GRIP)
  const r = clamp(radius, 0, height / 2)
  const gripR = Math.max(0, r - PAD)
  const k = 260 + (clamp(speed, 0, 100) / 100) * 640
  const mass = 0.9
  const critical = 2 * Math.sqrt(k * mass)
  const commitSpring = { type: 'spring', stiffness: k, damping: critical, mass }
  const homeSpring = { ...commitSpring, damping: critical * (1 - clamp(returnBounce, 0, 0.5)) }
  const x = useMotionValue(0)
  const anchor = useMotionValue(0)
  const shown = useMotionValue(1)
  const spin = useMotionValue(0)
  const pulse = useMotionValue(1)
  const shake = useMotionValue(0)
  const seen = useTransform(x, (value) => clamp(value, 0, TRAVEL))
  const edge = useTransform([seen, anchor], ([value, target]) => value + GRIP + clamp(target - value, 0, TRAVEL))
  const fillWidth = useTransform(edge, (value) => `${clamp((value - GRIP) / TRAVEL, 0, 1) * 100}%`)
  const clip = useTransform(edge, (value) => `inset(0 ${INNER - value}px 0 0 round ${gripR}px)`)
  const content = useTransform([seen, edge], ([value, target]) => `translateX(${(value + target) / 2 - INNER / 2}px)`)
  const swell = hot && !held && phase === 'idle' && !reduce ? SWELL : 1
  const shape = useTransform(x, (value) => {
    const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -value) / SQUASH_DIV)
    return `scale(${q * swell}, ${swell / q})`
  })
  const origin = useTransform(seen, (value) => `${value}px 50%`)
  const arrow = useTransform([seen, shown], ([value, visible]) => visible * clamp(1 - (value - TRAVEL * 0.55) / (TRAVEL * 0.4), 0, 1))
  const trackTransform = useTransform([shake, pulse], ([offset, scale]) => `translateX(${offset}px) scale(${scale})`)
  const labelText = typeof label === 'string' ? label : 'Slide to confirm'

  useMotionValueEvent(seen, 'change', (value) => {
    const percent = Math.round((value / TRAVEL) * 100)
    if (percent === lastPercent.current || !capsuleRef.current) return
    lastPercent.current = percent
    capsuleRef.current.setAttribute('aria-valuenow', String(percent))
    capsuleRef.current.setAttribute('aria-valuetext', `${labelText}, ${percent}%`)
    trackRef.current?.setAttribute('data-progress', percent > 60 ? 'over-60' : 'under-60')
  })

  useEffect(() => () => {
    clearTimeout(timer.current)
    clearTimeout(homeTimer.current)
    unwatch.current?.()
    run.current += 1
  }, [])

  const local = (clientX) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return (clientX - rect.left) / (rect.width / width || 1)
  }
  const goHome = (velocity) => {
    if (reduce) animate(x, 0, { duration: 0.2, ease: EASE_OUT })
    else animate(x, 0, { ...homeSpring, velocity: Math.min(0, velocity) })
  }
  const settle = () => {
    setPhase('idle')
    animate(shown, 1, { duration: 0.2, delay: 0.12 })
    if (reduce) anchor.set(0)
    else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 })
  }
  const resolve = (viaKey) => {
    setPhase('done')
    anchor.set(x.get())
    animate(spin, 0, { duration: 0.12 })
    if (reduce) x.set(0)
    else {
      animate(x, 0, commitSpring)
      if (!viaKey && landingDip > 0) {
        animate(pulse, [1, 1 - landingDip, 1], { duration: 0.46, times: [0, 0.62, 1], ease: EASE_OUT, delay: 0.1 })
      }
    }
    onDone?.()
    if (holdMs > 0) timer.current = window.setTimeout(settle, holdMs)
  }
  const reject = (reason) => {
    setPhase('error')
    onError?.(reason)
    animate(spin, 0, { duration: 0.12 })
    animate(shown, 1, { duration: 0.2, delay: 0.12 })
    if (reduce) goHome(0)
    else {
      animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT })
      homeTimer.current = window.setTimeout(() => {
        if (!grip.current) goHome(0)
      }, 300)
    }
    timer.current = window.setTimeout(() => setPhase('idle'), Math.max(holdMs, 1500))
  }
  const commit = (viaKey) => {
    clearTimeout(timer.current)
    const id = ++run.current
    x.set(TRAVEL)
    let result
    try {
      result = onConfirm?.()
    } catch (reason) {
      reject(reason)
      return
    }
    const pending = result && typeof result.then === 'function' ? result : null
    if (!pending) {
      animate(shown, 0, { duration: 0.12 })
      resolve(viaKey)
      return
    }
    setPhase('pending')
    animate(shown, 0, { duration: 0.2 })
    animate(spin, 1, { duration: 0.2 })
    const startTime = performance.now()
    const later = (callback) => {
      window.setTimeout(() => {
        if (id === run.current) callback()
      }, Math.max(0, MIN_PENDING - (performance.now() - startTime)))
    }
    pending.then(
      () => later(() => resolve(viaKey)),
      (reason) => later(() => reject(reason)),
    )
  }
  const down = (event) => {
    if (disabled || grip.current || phase === 'pending' || phase === 'done' || event.button !== 0) return
    x.stop()
    grip.current = { id: event.pointerId, grab: null, moved: false, hist: [] }
    setHeld(true)
    try {
      trackRef.current?.setPointerCapture(event.pointerId)
    } catch {}
    unwatch.current?.()
    const onMove = (pointerEvent) => pointerEvent.isTrusted && live.current.move(pointerEvent)
    const onUp = (pointerEvent) => pointerEvent.isTrusted && live.current.up(pointerEvent)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    unwatch.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      unwatch.current = null
    }
  }
  const move = (event) => {
    const activeGrip = grip.current
    if (!activeGrip || activeGrip.id !== event.pointerId) return
    const position = local(event.clientX)
    if (activeGrip.grab === null) {
      activeGrip.grab = position - x.get()
      return
    }
    const next = clamp(position - activeGrip.grab, 0, TRAVEL)
    if (Math.abs(next - x.get()) > 0.5) activeGrip.moved = true
    activeGrip.hist.push([event.timeStamp, next])
    if (activeGrip.hist.length > 4) activeGrip.hist.shift()
    x.set(next)
  }
  const up = (event) => {
    const activeGrip = grip.current
    if (!activeGrip || activeGrip.id !== event.pointerId) return
    grip.current = null
    unwatch.current?.()
    try {
      trackRef.current?.releasePointerCapture(event.pointerId)
    } catch {}
    setHeld(false)
    if (x.get() >= TRAVEL) commit(false)
    else if (activeGrip.moved) goHome(velocityOf(activeGrip.hist))
  }
  useLayoutEffect(() => {
    live.current = { move, up }
  })
  const onKeyDown = (event) => {
    if (disabled || phase === 'pending' || phase === 'done') return
    const step = TRAVEL / 10
    if (event.key === 'End') {
      event.preventDefault()
      commit(true)
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = Math.min(TRAVEL, x.get() + step)
      x.set(next)
      if (next >= TRAVEL) commit(true)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      x.set(Math.max(0, x.get() - step))
    } else if (event.key === 'Home' || event.key === 'Escape') {
      event.preventDefault()
      if (grip.current) up({ pointerId: grip.current.id })
      else x.set(0)
    }
  }
  const fontSize = clamp(Math.round(height * 0.25), 13, 17)
  const iconSize = Math.round(GRIP * 0.42)
  const done = phase === 'done'

  return (
    <div
      className={`slide-commit${className ? ` ${className}` : ''}`}
      data-phase={phase}
      data-held={held ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      style={{
        width,
        height,
        '--sc-track': trackColor,
        '--sc-ink': handleColor,
        '--sc-fill': fillColor,
        '--sc-ok': successColor,
        '--sc-no': dangerColor,
        '--sc-on-ink': onColor(handleColor),
        '--sc-on-ok': onColor(successColor),
        '--sc-radius': `${r}px`,
        '--sc-grip-r': `${gripR}px`,
        '--sc-grip': `${GRIP}px`,
        '--sc-pad': `${PAD}px`,
        '--sc-font': `${fontSize}px`,
      }}
    >
      <motion.div ref={trackRef} className="slide-commit__track" style={{ transform: trackTransform }} onPointerDown={down}>
        <motion.span className="slide-commit__fill" style={{ width: fillWidth }} aria-hidden="true" />
        <motion.span className="slide-commit__label" aria-hidden="true">
          <span className="slide-commit__text slide-commit__text--plain">{label}</span>
          <span className="slide-commit__text slide-commit__text--error">{errorLabel}</span>
        </motion.span>
        <motion.div
          ref={capsuleRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={labelText}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-busy={phase === 'pending' || undefined}
          aria-disabled={disabled || undefined}
          className="slide-commit__capsule"
          style={{ clipPath: clip, background: 'transparent', transform: shape, transformOrigin: origin }}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse' && finePointer()) setHot(true)
          }}
          onPointerLeave={() => setHot(false)}
          onKeyDown={onKeyDown}
        >
          <motion.span className="slide-commit__thumb" style={{ x: seen }} aria-hidden="true" />
          <motion.div className="slide-commit__content" style={{ transform: content }}>
            <motion.span className="slide-commit__arrow" style={{ opacity: arrow }} aria-hidden="true">
              {icon ?? <HugeiconsIcon icon={ArrowRight02Icon} size={iconSize} strokeWidth={2} />}
            </motion.span>
            <motion.span className="slide-commit__spin" style={{ opacity: spin }} aria-hidden="true">
              <Spinner size={iconSize} />
            </motion.span>
            <motion.span
              className="slide-commit__done"
              aria-hidden="true"
              initial={false}
              animate={{ opacity: done ? 1 : 0, scale: done || reduce ? 1 : 0.95 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <HugeiconsIcon icon={Tick02Icon} size={Math.round(GRIP * 0.38)} strokeWidth={2.5} />
              {doneLabel}
            </motion.span>
          </motion.div>
        </motion.div>
        <span className="slide-commit__sr" aria-live="polite">
          {phase === 'pending' ? 'Working' : phase === 'done' ? doneLabel : phase === 'error' ? errorLabel : ''}
        </span>
      </motion.div>
    </div>
  )
}
