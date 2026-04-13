import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import EventCard from '../Events/EventCard'
import mandapImg from '../../assets/photos/mandap.webp'
import sangeetIcon  from '../../assets/photos/sangeet.webp'
import baraatIcon   from '../../assets/photos/baraat.webp'
import ceremonyIcon from '../../assets/photos/ceremony.webp'
import receptionIcon from '../../assets/photos/reception.webp'

const EVENTS = [
  {
    id: 'sangeet',
    name: 'Sangeet',
    tagline: 'Music & Dance',
    date: 'August 14, 2026',
    time: 'Time TBD',
    venue: 'Robert and Arlene Kogod Courtyard',
    dresscode: 'Festive Traditional',
    accent: '#C47E85',
    icon: sangeetIcon,
    mapUrl: 'https://maps.google.com/?q=Kogod+Courtyard+Washington+DC',
  },
  {
    id: 'baraat',
    name: 'Baraat',
    tagline: 'The Grand Procession',
    date: 'August 15, 2026',
    time: 'Time TBD',
    venue: 'Waldorf Astoria DC',
    dresscode: 'Festive Traditional',
    accent: '#C9A87C',
    icon: baraatIcon,
    mapUrl: 'https://maps.google.com/?q=Waldorf+Astoria+Washington+DC+1100+Pennsylvania+Ave+NW',
  },
  {
    id: 'ceremony',
    name: 'Wedding Ceremony',
    tagline: 'The Sacred Union',
    date: 'August 16, 2026',
    time: '10:57 AM ET',
    venue: 'Presidential Ballroom, Waldorf Astoria DC',
    dresscode: 'Formal Traditional',
    accent: '#5C7A4E',
    icon: ceremonyIcon,
    mapUrl: 'https://maps.google.com/?q=Waldorf+Astoria+Washington+DC+1100+Pennsylvania+Ave+NW',
  },
  {
    id: 'reception',
    name: 'Reception',
    tagline: 'Celebrate with Us',
    date: 'August 16, 2026',
    time: 'Time TBD',
    venue: 'Andrew W. Mellon Auditorium',
    dresscode: 'Black Tie or Traditional',
    accent: '#E8B4B8',
    icon: receptionIcon,
    mapUrl: 'https://maps.google.com/?q=Andrew+W+Mellon+Auditorium+1301+Constitution+Ave+NW+Washington+DC',
  },
]

export default function Celebrations() {
  const sectionRef = useRef(null)
  const bgRef      = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
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
    <section id="celebrations" ref={sectionRef} className="section-pad relative overflow-hidden" style={{ backgroundColor: '#EDE4D8' }}>
      {/* Mandap — full-bleed background, faded, with parallax */}
      <img
        ref={bgRef}
        src={mandapImg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        className="absolute left-0 top-0 w-full object-cover pointer-events-none select-none"
        style={{ height: '120%', mixBlendMode: 'multiply', opacity: 0.2, willChange: 'transform' }}
      />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Section heading */}
        <div className="text-center mb-14">
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
          <p className="font-serif italic text-bark/60 mt-4 text-lg max-w-md mx-auto">
            Join us across a series of joyful ceremonies as we begin our new chapter together.
          </p>
        </div>

        {/* Cards grid — 1 col mobile → 2 cols sm → 4 cols lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
          {EVENTS.map((event, i) => (
            <EventCard key={event.id} {...event} index={i} />
          ))}
        </div>

        <p className="text-center font-sans text-xs text-bark/35 tracking-widest uppercase mt-10">
          All event details will be updated as the date approaches
        </p>
      </div>
    </section>
  )
}
