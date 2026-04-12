import { lazy, Suspense, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './components/Hero/Hero'
import Footer from './components/Footer/Footer'
import ScrollProgress from './components/shared/ScrollProgress'
import BotanicalCursor from './components/shared/BotanicalCursor'
import mandapHeaderImg from './assets/photos/mandap_header.png'
import floralHeaderImg from './assets/photos/floral_header.png'

gsap.registerPlugin(ScrollTrigger)

const GardenScene    = lazy(() => import('./components/Hero/GardenScene'))
const OurStory       = lazy(() => import('./components/OurStory/OurStory'))
const Celebrations   = lazy(() => import('./components/OurStory/Celebrations'))
const Gallery        = lazy(() => import('./components/Gallery/Gallery'))
const RSVPForm       = lazy(() => import('./components/RSVP/RSVPForm'))

function SectionFallback() {
  return <div className="min-h-[400px]" aria-hidden="true" />
}

// Each section floats as a card. The mandap header sits directly above it
// so its bottom edge aligns with the card's top border.
function SectionCard({ children, mandapHeader = false }) {
  const wrapperRef   = useRef(null)
  const headerImgRef = useRef(null)

  useEffect(() => {
    if (!headerImgRef.current || !wrapperRef.current) return
    if (window.innerWidth < 768) return  // skip on mobile
    const ctx = gsap.context(() => {
      gsap.to(headerImgRef.current, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top 90%',
          end: 'top 10%',
          scrub: true,
        },
      })
    })
    return () => ctx.revert()
  }, [])

  const cardStyle = {
    border: '1px solid rgba(201,168,124,0.28)',
    boxShadow:
      '0 2px 4px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.38), 0 32px 90px rgba(0,0,0,0.58)',
  }

  if (mandapHeader) {
    return (
      <div ref={wrapperRef} className="max-w-6xl mx-auto">
        {/* Mandap header anchored to card top */}
        <img
          ref={headerImgRef}
          src={mandapHeaderImg}
          alt=""
          aria-hidden="true"
          className="relative z-10 w-full h-auto block pointer-events-none select-none"
          style={{ marginTop: '-10%' }}
        />
        <div className="relative overflow-hidden" style={{ marginTop: '-22%', ...cardStyle }}>
          <div
            className="absolute inset-x-0 top-0 h-px z-10 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(201,168,124,0.55) 35%, rgba(201,168,124,0.55) 65%, transparent)',
            }}
            aria-hidden="true"
          />
          {children}
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="max-w-6xl mx-auto">
      {/* Floral header anchored to card top */}
      <img
        ref={headerImgRef}
        src={floralHeaderImg}
        alt=""
        aria-hidden="true"
        className="relative z-10 w-full h-auto block pointer-events-none select-none"
      />
      <div className="relative overflow-hidden" style={{ marginTop: '-25%', ...cardStyle }}>
        <div
          className="absolute inset-x-0 top-0 h-px z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(201,168,124,0.55) 35%, rgba(201,168,124,0.55) 65%, transparent)',
          }}
          aria-hidden="true"
        />
        {children}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollProgress />
      <BotanicalCursor />

      {/* Page root — provides the positioning context so the gradient
          spans the full scrollable height, not just the viewport */}
      <div className="relative">

        {/* ── Full-page water-depth gradient ──
            'absolute inset-0' stretches to match the full content height,
            so the colour continuously deepens as the user scrolls down */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(180deg, #2c4426 0%, #1a3018 50%, #0e2012 100%)',
          }}
          aria-hidden="true"
        />

        {/* ── Floating particle scene (fixed) ──
            Covers the viewport at every scroll position so particles appear
            across the entire page background */}
        <motion.div
          className="fixed inset-0 z-[1]"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, ease: 'easeIn' }}
        >
          <Suspense fallback={null}>
            <GardenScene />
          </Suspense>
        </motion.div>

        {/* Subtle dark veil — keeps card text legible against the particles */}
        <div
          className="fixed inset-0 z-[2] pointer-events-none"
          style={{ background: 'rgba(6,12,4,0.22)' }}
          aria-hidden="true"
        />

        {/* ── Scrollable content ── */}
        <main className="relative z-10 min-h-screen">
          <Hero />

          {/* Cards — spaced so the mandap header between each pair is visible */}
          <div className="px-4 md:px-10 lg:px-20 pb-28 space-y-10 md:space-y-16">

            <SectionCard mandapHeader>
              <Suspense fallback={<SectionFallback />}>
                <OurStory />
              </Suspense>
            </SectionCard>

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <Celebrations />
              </Suspense>
            </SectionCard>

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <Gallery />
              </Suspense>
            </SectionCard>

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <RSVPForm />
              </Suspense>
            </SectionCard>

          </div>

          <Footer />
        </main>
      </div>
    </>
  )
}
