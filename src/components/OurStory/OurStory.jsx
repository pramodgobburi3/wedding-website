import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import invitationBg from '../../assets/photos/invitation_background.png'

// ─── Shared decorative components ────────────────────────────────────────────

function GoldDivider({ wide = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${wide ? 'my-8' : 'my-5'}`}>
      <div className={`h-px bg-gold/60 ${wide ? 'w-20' : 'w-10'}`} />
      <svg viewBox="0 0 24 12" className="w-8 h-3 text-gold" fill="currentColor">
        <path d="M12,1 L14,5 L18,5 L15,8 L16,12 L12,9 L8,12 L9,8 L6,5 L10,5 Z" opacity="0.9" />
      </svg>
      <div className={`h-px bg-gold/60 ${wide ? 'w-20' : 'w-10'}`} />
    </div>
  )
}

function SmallCaps({ children, className = '' }) {
  return (
    <p className={`font-sans text-[11px] tracking-[0.38em] uppercase text-bark/70 ${className}`}>
      {children}
    </p>
  )
}

// ─── Family block ─────────────────────────────────────────────────────────────

function FamilyBlock({ label, lateElders, parents, city }) {
  return (
    <div className="text-center px-4">
      <SmallCaps className="mb-3">{label}</SmallCaps>

      {lateElders && (
        <p className="font-serif italic text-bark/60 text-md leading-relaxed mb-2">
          With the blessings of<br />
          <span className="not-italic text-bark/75">{lateElders}</span>
        </p>
      )}

      <p
        className="font-serif text-bark leading-snug"
        style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}
      >
        {parents}
      </p>

      {city && <SmallCaps className="mt-2">{city}</SmallCaps>}
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function OurStory() {
  const sectionRef = useRef(null)
  const bgRef      = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance fade-in
      gsap.fromTo(
        '.invite-body',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%' },
        }
      )
      // Background parallax — disabled on mobile to preserve native scroll feel
      if (window.innerWidth >= 768) {
        gsap.to(bgRef.current, {
          yPercent: -16.67,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      }
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="invitation"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      {/* Invitation background — full-bleed watermark with parallax */}
      <img
        ref={bgRef}
        src={invitationBg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        className="absolute left-0 top-0 w-full object-cover pointer-events-none select-none"
        style={{ height: '120%', mixBlendMode: 'multiply', opacity: 0.15, willChange: 'transform' }}
      />

      {/* ── Invitation body ── */}
      <div className="invite-body relative z-10 max-w-xl mx-auto px-6 py-16 md:py-24 text-center">

        {/* ── Telugu invocation ── */}
        <p
          className="font-serif text-gold leading-snug mb-1"
          style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', letterSpacing: '0.04em' }}
        >
          శ్రీరస్తు &nbsp;|&nbsp; శుభమస్తు &nbsp;|&nbsp; అవిఘ్నమస్తు
        </p>
        <SmallCaps>Srirastu &nbsp;·&nbsp; Shubhamastu &nbsp;·&nbsp; Avighnamastu</SmallCaps>

        <GoldDivider wide />

        {/* ── Opening blessing ── */}
        <p className="font-serif italic text-bark/70 text-base md:text-lg leading-relaxed mb-8 px-2">
          With the blessings of the Almighty<br />
          and the gracious wishes of our elders
        </p>

        {/* ── Bride's family ── */}
        <FamilyBlock
          label="Bride's Family"
          lateElders="Late Smt. [Maternal Grandmother] & Late Shri [Maternal Grandfather]"
          parents="Smt. Sridevi & Shri Krishna Prasad Madiraju"
        />

        {/* "along with" connector */}
        <div className="flex items-center justify-center gap-3 my-6">
          <div className="h-px w-10 bg-gold/45" />
          <p className="font-script text-gold text-xl px-1">along with</p>
          <div className="h-px w-10 bg-gold/45" />
        </div>

        {/* ── Groom's family ── */}
        <FamilyBlock
          label="Groom's Family"
          lateElders="Late Smt. [Paternal Grandmother] & Late Shri [Paternal Grandfather]"
          parents="Smt. Sandhya & Late Shri Srimannarayanacharyulu Gobburi "
        />

        <GoldDivider wide />

        {/* ── Request line ── */}
        <p className="font-serif italic text-bark/70 text-base md:text-lg leading-relaxed mb-8 px-4">
          request the honour of your presence<br />
          at the auspicious wedding of their children
        </p>

        {/* ── Couple's names ── */}
        <p
          className="font-script text-dustyRose leading-none"
          style={{ fontSize: 'clamp(1rem, 3.5vw, 1.5rem)' }}
        >
          Chi. Sow. Snigdha Om Madiraju
        </p>
        <div className="flex items-center justify-center gap-4 my-2">
          <div className="h-px w-14 bg-gold/45" />
          <span className="font-serif text-gold text-xl">&amp;</span>
          <div className="h-px w-14 bg-gold/45" />
        </div>
        <p
          className="font-script text-dustyRose leading-none mb-10"
          style={{ fontSize: 'clamp(1rem, 3.5vw, 1.5rem)' }}
        >
          Chi. Phani Pramod Gobburi
        </p>

        <GoldDivider />

        {/* ── Date & venue ── */}
        <div className="mb-8">
          <SmallCaps className="mb-2">Sunday · The Sixteenth of August</SmallCaps>
          <p className="font-script text-gold text-2xl mb-2">Two Thousand & Twenty Six</p>
          <SmallCaps>Presidential Ballroom · Waldorf Astoria DC</SmallCaps>
        </div>
      </div>
    </section>
  )
}
