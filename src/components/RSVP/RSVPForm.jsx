import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import rsvpBg from '../../assets/photos/rsvp_background.webp'

function RoseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-12 h-12 mx-auto mb-4"
      viewBox="0 0 48 48"
      fill="none"
    >
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => (
        <ellipse
          key={i}
          cx={24 + Math.cos((deg * Math.PI) / 180) * 11}
          cy={24 + Math.sin((deg * Math.PI) / 180) * 11}
          rx="5"
          ry="9"
          fill={i % 2 === 0 ? '#E8B4B8' : '#C47E85'}
          opacity="0.8"
          transform={`rotate(${deg} ${24 + Math.cos((deg * Math.PI) / 180) * 11} ${24 + Math.sin((deg * Math.PI) / 180) * 11})`}
        />
      ))}
      <circle cx="24" cy="24" r="6"  fill="#C47E85" />
      <circle cx="24" cy="24" r="2.5" fill="#F4D6D8" />
    </svg>
  )
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin"
      aria-label="Loading"
    />
  )
}

const inputBase =
  'w-full bg-transparent border-b-2 border-dustyRose/30 focus:border-dustyRose outline-none py-2 font-sans text-bark placeholder-bark/35 transition-colors duration-200 text-base'

const labelBase =
  'block font-sans text-xs tracking-widest uppercase text-bark/90 mb-1'

const EVENTS = [
  { id: 'sangeet',   label: 'Sangeet',          date: 'Friday, August 14' },
  { id: 'baraat',    label: 'Baraat',            date: 'Saturday, August 15' },
  { id: 'ceremony',  label: 'Wedding Ceremony',  date: 'Sunday, August 16' },
  { id: 'reception', label: 'Reception',         date: 'Sunday, August 16' },
]

export default function RSVPForm() {
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

  const [form, setForm] = useState({
    name:    '',
    email:   '',
    guests:  '1',
    message: '',
    events:  { sangeet: false, baraat: false, ceremony: false, reception: false },
  })
  const [status, setStatus]   = useState('idle') // idle | submitting | success | error
  const [errors, setErrors]   = useState({})

  function validate() {
    const errs = {}
    if (!form.name.trim())  errs.name  = 'Please enter your name.'
    if (!form.email.trim()) {
      errs.email = 'Please enter your email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address.'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStatus('submitting')

    try {
      const url = import.meta.env.VITE_APPS_SCRIPT_URL
      if (!url) throw new Error('RSVP endpoint not configured.')

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          name:    form.name.trim(),
          email:   form.email.trim().toLowerCase(),
          guests:  Number(form.guests),
          message: form.message.trim(),
          events:  Object.entries(form.events)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(', '),
        }),
      })
      setStatus('success')
      // Play the success Lottie
      setTimeout(() => lottieRef.current?.play(), 100)
    } catch {
      setStatus('error')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleEventToggle(id) {
    setForm((prev) => ({
      ...prev,
      events: { ...prev.events, [id]: !prev.events[id] },
    }))
  }

  if (status === 'success') {
    return (
      <section ref={sectionRef} id="rsvp" className="py-24 px-6 relative overflow-hidden" style={{ backgroundColor: '#EDE4D8' }}>
        <img
          ref={bgRef}
          src={rsvpBg}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          className="absolute left-0 top-0 w-full object-cover pointer-events-none select-none"
          style={{ height: '120%', filter: 'grayscale(100%)', mixBlendMode: 'multiply', opacity: 0.15, willChange: 'transform' }}
        />
        <div className="max-w-md mx-auto text-center relative z-10">
          <RoseIcon />
          <h2 className="font-serif text-3xl text-bark mb-3" style={{ fontWeight: 300 }}>
            Thank You!
          </h2>
          <p className="font-serif italic text-bark/65 text-lg leading-relaxed">
            Your RSVP has been received. We are overjoyed that you will be
            joining us for our celebration.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-12 bg-gold/50" />
            <span className="text-gold">✦</span>
            <div className="h-px w-12 bg-gold/50" />
          </div>
          <p className="font-sans font-light text-bark/70 text-md mt-4">
            With love, Snigdha &amp; Pramod
          </p>
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} id="rsvp" className="py-24 px-6 relative overflow-hidden" style={{ backgroundColor: '#EDE4D8' }}>
      <img
        ref={bgRef}
        src={rsvpBg}
        alt=""
        aria-hidden="true"
        className="absolute left-0 top-0 w-full object-cover pointer-events-none select-none"
        style={{ height: '120%', filter: 'grayscale(100%)', mixBlendMode: 'multiply', opacity: 0.15 }}
      />
      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-script text-dustyRose text-2xl mb-2">Kindly Reply</p>
          <h2 className="font-serif text-4xl md:text-5xl text-bark mb-4" style={{ fontWeight: 300 }}>
            RSVP
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50" />
            <span className="text-gold text-xl">✦</span>
            <div className="h-px w-16 bg-gold/50" />
          </div>
          <p className="font-serif italic text-bark/55 mt-4 text-lg">
            We can't wait to celebrate our garden romance with you —
            please let us know you're coming!
          </p>
        </div>

        {/* Error banner */}
        {status === 'error' && (
          <div role="alert" className="mb-6 p-4 bg-dustyRose/10 border border-dustyRose/30 rounded text-center">
            <p className="font-sans text-sm text-dustyRose-dark">
              Something went wrong. Please try again or contact us directly.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-2 font-sans text-xs underline text-dustyRose hover:text-dustyRose-dark"
            >
              Try again
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="mb-8">
            <label htmlFor="name" className={labelBase}>Full Name</label>
            <input
              id="name" name="name" type="text" autoComplete="name"
              placeholder="Your full name"
              value={form.name} onChange={handleChange}
              className={inputBase}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="mt-1 font-sans text-xs text-dustyRose">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-8">
            <label htmlFor="email" className={labelBase}>Email Address</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              placeholder="your@email.com"
              value={form.email} onChange={handleChange}
              className={inputBase}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1 font-sans text-xs text-dustyRose">
                {errors.email}
              </p>
            )}
          </div>

          {/* Number of Guests */}
          <div className="mb-8">
            <label htmlFor="guests" className={labelBase}>Number attending (Please include children)</label>
            <select
              id="guests" name="guests"
              value={form.guests} onChange={handleChange}
              className={`${inputBase} cursor-pointer`}
              aria-required="true"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>

          {/* Events attending */}
          <div className="mb-8">
            <p className={labelBase}>Events Planning to Attend</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EVENTS.map(({ id, label, date }) => {
                const checked = form.events[id]
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleEventToggle(id)}
                    className="flex items-center gap-3 text-left px-4 py-3 rounded border transition-all duration-200"
                    style={{
                      borderColor: checked ? 'rgba(196,126,133,0.9)' : 'rgba(196,126,133,0.4)',
                      backgroundColor: checked ? 'rgba(196,126,133,0.08)' : 'transparent',
                    }}
                  >
                    {/* Custom checkbox */}
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors duration-200"
                      style={{
                        borderColor: checked ? '#C47E85' : 'rgba(196,126,133,0.7)',
                        backgroundColor: checked ? '#C47E85' : 'transparent',
                      }}
                      aria-hidden="true"
                    >
                      {checked && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-ivory">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span>
                      <span className="block font-serif text-bark text-sm font-bold">{label}</span>
                      <span className="block font-sans text-[10px] tracking-widest uppercase text-bark/90">{date}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message */}
          <div className="mb-10">
            <label htmlFor="message" className={labelBase}>
              A Note for the Couple <span className="normal-case opacity-60">(optional)</span>
            </label>
            <textarea
              id="message" name="message"
              placeholder="Share a warm wish or note…"
              value={form.message} onChange={handleChange}
              rows={3}
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={status === 'submitting'}
              aria-busy={status === 'submitting'}
              className="inline-flex items-center gap-3 bg-dustyRose hover:bg-dustyRose-dark disabled:opacity-70 disabled:cursor-not-allowed text-ivory font-serif tracking-widest text-sm uppercase px-12 py-4 rounded-full transition-all duration-300"
            >
              {status === 'submitting' ? (
                <><Spinner /><span>Sending…</span></>
              ) : (
                'Confirm Attendance'
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
