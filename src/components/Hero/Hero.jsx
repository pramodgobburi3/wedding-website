import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

// TODO: Set your wedding date here
const WEDDING_DATE = new Date('2026-08-16T10:57:00-04:00') // 10:57 AM Eastern

// ─── Ripple animation ─────────────────────────────────────────────────────────

// Two large ripple origins — like lotus pads disturbing the water surface
const RIPPLE_ORIGINS = [
  { x: '38%', y: '64%', delay: 0,    maxR: 420, color: 'rgba(201,168,124,0.5)' },
  { x: '63%', y: '72%', delay: 0.8,  maxR: 380, color: 'rgba(232,180,184,0.45)' },
]

function RippleRing({ delay, diameter, color }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: '50%', top: '50%',
        translateX: '-50%', translateY: '-50%',
        border: `1px solid ${color}`,
        width: 10, height: 10,
      }}
      animate={{ width: diameter, height: diameter, opacity: [0.85, 0.4, 0] }}
      transition={{ delay, duration: 3.6, ease: [0.08, 0.5, 0.25, 1] }}
    />
  )
}

function LotusRippleOrigin({ x, y, delay, maxR, color }) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <RippleRing delay={delay}       diameter={maxR * 2}    color={color} />
      <RippleRing delay={delay + 0.6} diameter={maxR * 1.1}  color={color} />
    </div>
  )
}

function LotusRipples() {
  return (
    <motion.div
      className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 3.2, duration: 1.0 }}
    >
      {RIPPLE_ORIGINS.map((o, i) => (
        <LotusRippleOrigin key={i} {...o} />
      ))}
    </motion.div>
  )
}

// ─── Hero UI components ───────────────────────────────────────────────────────

function RoseDivider() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 24"
      className="w-44 h-6 mx-auto my-4"
      fill="none"
    >
      <line x1="0" y1="12" x2="68" y2="12" stroke="#C9A87C" strokeWidth="0.8" opacity="0.7" />
      <line x1="112" y1="12" x2="180" y2="12" stroke="#C9A87C" strokeWidth="0.8" opacity="0.7" />
      {[0, 40, 80, 120, 160].map((deg, i) => (
        <ellipse
          key={i}
          cx={90 + Math.cos((deg * Math.PI) / 180) * 8}
          cy={12 + Math.sin((deg * Math.PI) / 180) * 8}
          rx="4.5"
          ry="8"
          fill={i % 2 === 0 ? '#E8B4B8' : '#D9A8AC'}
          opacity="0.8"
          transform={`rotate(${deg} ${90 + Math.cos((deg * Math.PI) / 180) * 8} ${12 + Math.sin((deg * Math.PI) / 180) * 8})`}
        />
      ))}
      <circle cx="90" cy="12" r="4.5" fill="#C47E85" opacity="0.9" />
      <circle cx="90" cy="12" r="2"   fill="#F4D6D8" />
    </svg>
  )
}

function CountdownBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-serif text-3xl md:text-5xl text-ivory font-light leading-none tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="font-sans text-[10px] md:text-xs tracking-[0.2em] uppercase text-ivory/50 mt-1">
        {label}
      </span>
    </div>
  )
}

function CountdownSeparator() {
  return (
    <span className="font-serif text-2xl md:text-4xl text-ivory/30 self-center leading-none mb-2">
      ·
    </span>
  )
}

function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(target))
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target])
  return timeLeft
}

function calcTimeLeft(target) {
  const diff = Math.max(0, target - Date.now())
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0  },
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero() {
  const timeLeft = useCountdown(WEDDING_DATE)
  const [showText, setShowText] = useState(false)
  const heroRef = useRef(null)

  // Text starts alongside the ripples
  useEffect(() => {
    const t = setTimeout(() => setShowText(true), 200)
    return () => clearTimeout(t)
  }, [])

  const textAnimate = showText ? 'visible' : 'hidden'

  // Parallax: different layers move at different speeds as user scrolls away from hero
  // Disabled on mobile to preserve native scroll momentum
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const { scrollY } = useScroll()
  const taglineY   = useTransform(scrollY, [0, 600], isMobile ? [0, 0] : [0, -70])
  const namesY     = useTransform(scrollY, [0, 600], isMobile ? [0, 0] : [0, -40])
  const dividerY   = useTransform(scrollY, [0, 600], isMobile ? [0, 0] : [0, -25])
  const countdownY = useTransform(scrollY, [0, 600], isMobile ? [0, 0] : [0, -12])

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Lotus ripple intro */}
      <LotusRipples />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">

        {/* Tagline — moves fastest on scroll (deepest parallax layer) */}
        <motion.div style={{ y: taglineY }}>
          <motion.p
            className="font-script text-gold text-xl md:text-2xl mb-2 text-shadow-light"
            variants={fadeUp}
            initial="hidden"
            animate={textAnimate}
            transition={{ duration: 0.9, delay: 0.15 }}
          >
            Forever More
          </motion.p>
        </motion.div>

        {/* Names — second layer */}
        <motion.div style={{ y: namesY }}>
          <motion.h1
            className="font-serif text-ivory leading-none text-shadow-bloom"
            style={{ fontSize: 'clamp(3.2rem, 10vw, 7.5rem)', fontWeight: 300 }}
            variants={fadeUp}
            initial="hidden"
            animate={textAnimate}
            transition={{ duration: 1.0, delay: 0.4 }}
          >
            Snigdha{' '}
            <span className="font-script text-blush" style={{ fontSize: '0.65em' }}>&amp;</span>
            {' '}Pramod
          </motion.h1>
        </motion.div>

        {/* Rose divider — third layer */}
        <motion.div style={{ y: dividerY }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={textAnimate}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <RoseDivider />
          </motion.div>

          {/* Date */}
          <motion.p
            className="font-sans text-ivory/70 text-sm md:text-base tracking-[0.3em] uppercase mb-8"
            variants={fadeUp}
            initial="hidden"
            animate={textAnimate}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            August 16, 2026
          </motion.p>
        </motion.div>

        {/* Countdown — barely moves (anchored feel) */}
        <motion.div style={{ y: countdownY }}>
          <motion.div
            className="flex items-end justify-center gap-4 md:gap-8 mb-10"
            variants={fadeUp}
            initial="hidden"
            animate={textAnimate}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <CountdownBlock value={timeLeft.days}    label="Days"    />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.hours}   label="Hours"   />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.minutes} label="Minutes" />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.seconds} label="Seconds" />
          </motion.div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={fadeUp}
          initial="hidden"
          animate={textAnimate}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          <a
            href="#invitation"
            className="inline-block font-sans text-xs tracking-[0.25em] uppercase px-10 py-3.5 rounded-full border border-blush/50 text-ivory hover:bg-blush/15 transition-all duration-300"
          >
            Invitation
          </a>
          <a
            href="#gallery"
            className="inline-block font-sans text-xs tracking-[0.25em] uppercase px-10 py-3.5 rounded-full border border-blush/50 text-ivory hover:bg-blush/15 transition-all duration-300"
          >
            Gallery
          </a>
          <a
            href="#rsvp"
            className="inline-block font-sans text-xs tracking-[0.25em] uppercase px-10 py-3.5 rounded-full bg-dustyRose hover:bg-dustyRose-dark text-ivory transition-all duration-300"
          >
            RSVP
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={showText ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.8, duration: 1.0 }}
      >
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-ivory/40">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-ivory/40 to-transparent" />
      </motion.div>
    </section>
  )
}
