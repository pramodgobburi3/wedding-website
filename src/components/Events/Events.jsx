import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Player } from '@lottiefiles/react-lottie-player'
import flowerBloomLottie from '../../assets/lottie/flower-bloom.json'
import EventCard from './EventCard'

// TODO: Fill in your actual event dates, times, and venues
const EVENTS = [
  {
    id: 'mehendi',
    name: 'Mehendi',
    tagline: 'Colors of Love',
    date: 'Date TBD',
    time: 'Time TBD',
    venue: 'Venue TBD',
    dresscode: 'Colorful Traditional',
    accent: '#7A8C6E',
    icon: 'leaf',
  },
  {
    id: 'haldi',
    name: 'Haldi',
    tagline: 'Blessed in Gold',
    date: 'Date TBD',
    time: 'Time TBD',
    venue: 'Venue TBD',
    dresscode: 'White or Yellow',
    accent: '#C9A87C',
    icon: 'sun',
  },
  {
    id: 'sangeet',
    name: 'Sangeet',
    tagline: 'Music & Dance',
    date: 'Date TBD',
    time: 'Time TBD',
    venue: 'Venue TBD',
    dresscode: 'Festive Traditional',
    accent: '#C47E85',
    icon: 'music',
  },
  {
    id: 'ceremony',
    name: 'Wedding Ceremony',
    tagline: 'The Sacred Union',
    date: 'Date TBD',
    time: 'Time TBD',
    venue: 'Venue TBD',
    dresscode: 'Formal Traditional',
    accent: '#5C7A4E',
    icon: 'flower',
  },
  {
    id: 'reception',
    name: 'Reception',
    tagline: 'Celebrate with Us',
    date: 'Date TBD',
    time: 'Time TBD',
    venue: 'Venue TBD',
    dresscode: 'Black Tie or Traditional',
    accent: '#E8B4B8',
    icon: 'star',
  },
]

// Gopuram (South Indian temple tower) silhouette — background watermark for Events section
function GopuramWatermark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 640"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full max-h-full w-auto pointer-events-none select-none"
      style={{ opacity: 0.055 }}
      fill="#4A3728"
    >
      {/* === Tiers === */}
      {/* Base / gateway (widest) */}
      <rect x="58"  y="556" width="284" height="84" />
      {/* Tier 1 */}
      <rect x="70"  y="504" width="260" height="54" />
      {/* Tier 2 */}
      <rect x="83"  y="455" width="234" height="51" />
      {/* Tier 3 */}
      <rect x="96"  y="410" width="208" height="47" />
      {/* Tier 4 */}
      <rect x="109" y="368" width="182" height="44" />
      {/* Tier 5 */}
      <rect x="122" y="329" width="156" height="41" />
      {/* Tier 6 */}
      <rect x="135" y="292" width="130" height="39" />
      {/* Tier 7 */}
      <rect x="147" y="257" width="106" height="37" />

      {/* Decorative bump row on base tier — the miniature-tower finials */}
      {[84,110,136,162,188,200,212,238,264,290,316].map((x) => (
        <path key={x} d={`M${x-11},556 Q${x},541 ${x+11},556 Z`} />
      ))}
      {/* Bump rows on mid tiers (fewer bumps as tower narrows) */}
      {[90,116,142,168,200,232,258,284,310].map((x) => (
        <path key={x} d={`M${x-9},504 Q${x},492 ${x+9},504 Z`} />
      ))}
      {[100,126,152,178,200,222,248,274,300].map((x) => (
        <path key={x} d={`M${x-8},455 Q${x},444 ${x+8},455 Z`} />
      ))}

      {/* === Shikhara — the tapering upper section toward the barrel vault === */}
      <path d="M147,257 L151,240 L156,220 L160,200 L163,182 L165,164 L235,164 L237,182 L240,200 L244,220 L249,240 L253,257 Z" />

      {/* === Barrel vault (nastika) — the distinctive horizontal dome at the apex === */}
      <ellipse cx="200" cy="148" rx="64" ry="22" />

      {/* === Kalash finials — pot-shaped stupi along the barrel vault ridge === */}
      {[144, 162, 200, 238, 256].map((x) => (
        <path
          key={x}
          d={`M${x-7},126 C${x-7},116 ${x-3},108 ${x},102 C${x+3},108 ${x+7},116 ${x+7},126 Z`}
        />
      ))}

      {/* Central flagpole with pennant */}
      <rect x="199" y="66" width="2" height="36" />
      <path d="M201,66 L216,72 L201,79 Z" />

      {/* === Entrance archway at the base === */}
      <path d="M179,640 L179,600 C179,578 188,568 200,568 C212,568 221,578 221,600 L221,640 Z" fill="#EDE4D8" />
    </svg>
  )
}

export default function Events() {
  const sectionRef  = useRef(null)
  const lottieRef   = useRef(null)
  const headingRef  = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Trigger Lottie once when heading enters view
      if (lottieRef.current && headingRef.current) {
        ScrollTrigger.create({
          trigger: headingRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            lottieRef.current?.play()
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="events"
      ref={sectionRef}
      className="section-pad bg-ivory relative overflow-hidden"
    >
      {/* Gopuram temple tower — background watermark */}
      <GopuramWatermark />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Section heading */}
        <div ref={headingRef} className="text-center mb-16 relative">
          {/* Lottie flower bloom above heading */}
          <div className="flex justify-center mb-4 h-20" aria-hidden="true">
            <Player
              ref={lottieRef}
              src={flowerBloomLottie}
              style={{ width: 80, height: 80 }}
              keepLastFrame
              autoplay={false}
            />
          </div>

          <p className="font-script text-dustyRose text-2xl mb-2">Mark your calendars</p>
          <h2
            className="font-serif text-4xl md:text-5xl text-bark mb-4"
            style={{ fontWeight: 300 }}
          >
            Celebrations
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50" />
            <span className="text-gold text-lg">✦</span>
            <div className="h-px w-16 bg-gold/50" />
          </div>
          <p className="font-serif italic text-bark/55 mt-4 text-lg max-w-md mx-auto">
            Join us across a beautiful series of ceremonies as we begin our new chapter together.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
          {EVENTS.map((event, i) => (
            <EventCard key={event.id} {...event} index={i} />
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center font-sans text-xs text-bark/35 tracking-widest uppercase mt-10">
          All event details will be updated as the date approaches
        </p>
      </div>
    </section>
  )
}
