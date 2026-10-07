// Pre-wedding main site — preserved as a backup/archive after the couple
// switched the default landing to the Thank You page.
//
// This is NOT the default route. It's reachable only via `#main-site`, which
// isn't linked from anywhere on the live site. To make it the homepage again,
// route the empty hash to `<MainSite />` in App.jsx instead of `<ThankYou />`.

import { Suspense, lazy, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './Hero/Hero'
import Footer from './Footer/Footer'
import ScrollProgress from './shared/ScrollProgress'
import BotanicalCursor from './shared/BotanicalCursor'
import BackgroundMusic from './BackgroundMusic/BackgroundMusic'
import mandapHeaderImg from '../assets/photos/mandap.svg'
import floralHeaderImg from '../assets/photos/floral.svg'
import { FLAGS } from '../featureFlags'

import OurStory from './OurStory/OurStory'
import Events   from './Events/Events'
import Gallery  from './Gallery/Gallery'
import RSVPForm from './RSVP/RSVPForm'
import Venues   from './Venues/Venues'
import Travel   from './Travel/Travel'
import Registry from './Registry/Registry'

gsap.registerPlugin(ScrollTrigger)

const GardenScene = lazy(() => import('./Hero/GardenScene'))

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
        <img
          ref={headerImgRef}
          src={mandapHeaderImg}
          alt=""
          aria-hidden="true"
          width="2814"
          height="1536"
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
      <img
        ref={headerImgRef}
        src={floralHeaderImg}
        alt=""
        aria-hidden="true"
        width="2814"
        height="1536"
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

export default function MainSite() {
  return (
    <>
      <ScrollProgress />
      <BotanicalCursor />
      <BackgroundMusic />

      <div className="relative">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(180deg, #2c4426 0%, #1a3018 50%, #0e2012 100%)',
          }}
          aria-hidden="true"
        />

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

        <div
          className="fixed inset-0 z-[2] pointer-events-none"
          style={{ background: 'rgba(6,12,4,0.22)' }}
          aria-hidden="true"
        />

        <main className="relative z-10 min-h-screen">
          <Hero />

          <div className="px-4 md:px-10 lg:px-20 pb-28 space-y-10 md:space-y-16">

            <SectionCard mandapHeader>
              <Suspense fallback={<SectionFallback />}>
                <OurStory />
              </Suspense>
            </SectionCard>

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <Gallery />
              </Suspense>
            </SectionCard>

            {FLAGS.rsvpEnabled && (
              <SectionCard>
                <Suspense fallback={<SectionFallback />}>
                  <RSVPForm />
                </Suspense>
              </SectionCard>
            )}

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <Events />
              </Suspense>
            </SectionCard>

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <Venues />
              </Suspense>
            </SectionCard>

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <Travel />
              </Suspense>
            </SectionCard>

            <SectionCard>
              <Suspense fallback={<SectionFallback />}>
                <Registry />
              </Suspense>
            </SectionCard>
          </div>
          <Footer />
        </main>
      </div>
    </>
  )
}
