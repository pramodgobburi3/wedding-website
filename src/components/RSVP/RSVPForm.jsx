import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { supabase } from '../../lib/supabase'
import rsvpBg from '../../assets/photos/rsvp_background.webp'

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function formatEventTime(timeStr) {
  return timeStr || 'TBD'
}

function normalizePhone(raw) {
  return raw.replace(/\D/g, '')
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function RoseIcon() {
  return (
    <svg aria-hidden="true" className="w-12 h-12 mx-auto mb-4" viewBox="0 0 48 48" fill="none">
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => (
        <ellipse
          key={i}
          cx={24 + Math.cos((deg * Math.PI) / 180) * 11}
          cy={24 + Math.sin((deg * Math.PI) / 180) * 11}
          rx="5" ry="9"
          fill={i % 2 === 0 ? '#E8B4B8' : '#C47E85'}
          opacity="0.8"
          transform={`rotate(${deg} ${24 + Math.cos((deg * Math.PI) / 180) * 11} ${24 + Math.sin((deg * Math.PI) / 180) * 11})`}
        />
      ))}
      <circle cx="24" cy="24" r="6"   fill="#C47E85" />
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

function Divider() {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="h-px w-16 bg-gold/50" />
      <span className="text-gold text-xl">✦</span>
      <div className="h-px w-16 bg-gold/50" />
    </div>
  )
}

const inputBase =
  'w-full bg-transparent border-b-2 border-dustyRose/30 focus:border-dustyRose outline-none py-2 font-sans text-bark placeholder-bark/35 transition-colors duration-200 text-base'

const labelBase =
  'block font-sans text-xs tracking-widest uppercase text-bark/90 mb-1'

// ─── Section shell ────────────────────────────────────────────────────────────

function SectionShell({ sectionRef, bgRef, children, narrow = false }) {
  return (
    <section
      ref={sectionRef}
      id="rsvp"
      className="py-24 px-6 relative overflow-hidden"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <img
        ref={bgRef}
        src={rsvpBg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute left-0 top-0 w-full object-cover pointer-events-none select-none"
        style={{ height: '120%', filter: 'grayscale(100%)', mixBlendMode: 'multiply', opacity: 0.10, willChange: 'transform' }}
      />
      <div className={`${narrow ? 'max-w-md' : 'max-w-lg'} mx-auto relative z-10`}>
        {children}
      </div>
    </section>
  )
}

function FormHeader() {
  return (
    <div className="text-center mb-12">
      <p className="font-script text-dustyRose text-2xl mb-2">Kindly Reply</p>
      <h2 className="font-serif text-4xl md:text-5xl text-bark mb-4" style={{ fontWeight: 300 }}>
        RSVP
      </h2>
      <Divider />
    </div>
  )
}

function EventToggle({ id, label, date, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="flex items-center gap-3 text-left px-4 py-3 rounded border transition-all duration-200"
      style={{
        borderColor:     checked ? 'rgba(196,126,133,0.9)' : 'rgba(196,126,133,0.4)',
        backgroundColor: checked ? 'rgba(196,126,133,0.08)' : 'transparent',
      }}
    >
      <span
        className="flex-shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors duration-200"
        style={{
          borderColor:     checked ? '#C47E85' : 'rgba(196,126,133,0.7)',
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
}

// ─── Main component ───────────────────────────────────────────────────────────

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
            end:   'bottom top',
            scrub: true,
          },
        })
      }
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const [phase, setPhase]                 = useState('phone') // phone | form | already_submitted | success
  const [phoneInput, setPhoneInput]       = useState('')
  const [guestId, setGuestId]             = useState(null)
  const [isUnknown, setIsUnknown]         = useState(false)
  const [allowedEvents, setAllowedEvents] = useState([])
  const [allEvents, setAllEvents]         = useState([])
  const [loading, setLoading]             = useState(false)
  const [lookupError, setLookupError]     = useState(null)
  const [form, setForm]                   = useState({ name: '', guestCount: '1', message: '', events: {}, attending: true })
  const [declined, setDeclined]           = useState(false)
  const [submitError, setSubmitError]     = useState(null)

  useEffect(() => {
    supabase.from('events').select('*').order('sort_order')
      .then(({ data }) => setAllEvents(data ?? []))
  }, [])

  async function handlePhoneLookup(e) {
    e.preventDefault()
    const phone = normalizePhone(phoneInput)
    if (!phone) return
    setLoading(true)
    setLookupError(null)

    try {
      const { data, error } = await supabase.rpc('lookup_guest_by_phone', { p_phone: phone })
      if (error) throw error

      if (data.already_submitted) { setPhase('already_submitted'); return }

      const events = data.allowed_events ?? []
      setGuestId(data.guest_id)
      setIsUnknown(!data.found)
      setAllowedEvents(events)
      setForm({
        name:       data.name ?? '',
        guestCount: '1',
        message:    '',
        events:     Object.fromEntries(events.map(id => [id, false])),
      })
      setPhase('form')
    } catch {
      setLookupError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isUnknown && !form.name.trim()) return

    setLoading(true)
    setSubmitError(null)

    const eventsAttending = form.attending
      ? Object.entries(form.events).filter(([, v]) => v).map(([k]) => k)
      : []

    try {
      const { error } = await supabase.from('rsvp_responses').insert({
        guest_id:         guestId,
        phone:            normalizePhone(phoneInput),
        name:             isUnknown ? form.name.trim() : null,
        events_attending: eventsAttending,
        guest_count:      form.attending ? Number(form.guestCount) : 0,
        message:          form.message.trim() || null,
      })
      if (error) throw error
      setDeclined(!form.attending)
      setPhase('success')
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleEventToggle(id) {
    setForm(prev => ({ ...prev, events: { ...prev.events, [id]: !prev.events[id] } }))
  }

  const visibleEvents = allEvents.filter(e => allowedEvents.includes(e.slug))

  if (phase === 'success') {
    return (
      <SectionShell sectionRef={sectionRef} bgRef={bgRef} narrow>
        <div className="text-center">
          <RoseIcon />
          <h2 className="font-serif text-3xl text-bark mb-3" style={{ fontWeight: 300 }}>
            {declined ? 'We\'ll Miss You!' : 'Thank You!'}
          </h2>
          <p className="font-serif italic text-bark/65 text-lg leading-relaxed">
            {declined
              ? 'We\'re sorry you can\'t make it, but we appreciate you letting us know. You\'ll be in our hearts on the day.'
              : 'Your RSVP has been received. We are overjoyed that you will be joining us for our celebration.'}
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
      </SectionShell>
    )
  }

  if (phase === 'already_submitted') {
    return (
      <SectionShell sectionRef={sectionRef} bgRef={bgRef} narrow>
        <div className="text-center">
          <RoseIcon />
          <h2 className="font-serif text-3xl text-bark mb-3" style={{ fontWeight: 300 }}>
            Already Received
          </h2>
          <p className="font-serif italic text-bark/65 text-lg leading-relaxed">
            We already have your RSVP on file — thank you! If you need to make
            any changes, please reach out to us.
          </p>
          <Divider />
          <p className="font-sans font-light text-bark/70 text-md mt-6">
            With love, Snigdha &amp; Pramod
          </p>
        </div>
      </SectionShell>
    )
  }

  return (
    <SectionShell sectionRef={sectionRef} bgRef={bgRef}>
      <FormHeader />

      {phase === 'phone' && (
        <form onSubmit={handlePhoneLookup} noValidate>
          <p className="font-serif italic text-bark/55 text-center text-lg mb-10 -mt-6">
            We can't wait to celebrate with you —
            enter your phone number to get started.
          </p>
          <div className="mb-8">
            <label htmlFor="phone" className={labelBase}>Phone Number</label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Your phone number"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              className={inputBase}
              aria-required="true"
            />
            {lookupError && (
              <p role="alert" className="mt-2 font-sans text-xs text-dustyRose">
                {lookupError}
              </p>
            )}
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={loading || !phoneInput.trim()}
              aria-busy={loading}
              className="inline-flex items-center gap-3 bg-dustyRose hover:bg-dustyRose-dark disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-serif tracking-widest text-sm uppercase px-12 py-4 rounded-full transition-all duration-300"
            >
              {loading ? <><Spinner /><span>Looking up…</span></> : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {phase === 'form' && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-8">
            <label htmlFor="name" className={labelBase}>Your Name(s)</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your full name(s)"
              value={form.name}
              onChange={e => handleFormChange('name', e.target.value)}
              disabled={!isUnknown}
              className={`${inputBase} ${!isUnknown ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-required={isUnknown}
            />
          </div>

          {/* Attendance toggle */}
          <div className="mb-8">
            <p className={labelBase}>Will you be joining us?</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { value: true,  label: 'Joyfully Attending' },
                { value: false, label: 'Unable to Attend' },
              ].map(({ value, label }) => {
                const active = form.attending === value
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleFormChange('attending', value)}
                    className="px-4 py-3 rounded border text-sm font-serif text-bark transition-all duration-200"
                    style={{
                      borderColor:     active ? 'rgba(196,126,133,0.9)' : 'rgba(196,126,133,0.4)',
                      backgroundColor: active ? 'rgba(196,126,133,0.08)' : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {form.attending && (
            <>
              <div className="mb-8">
                <label htmlFor="guestCount" className={labelBase}>
                  Number attending <span className="normal-case opacity-60">(including yourself)</span>
                </label>
                <select
                  id="guestCount"
                  value={form.guestCount}
                  onChange={e => handleFormChange('guestCount', e.target.value)}
                  className={`${inputBase} cursor-pointer`}
                  aria-required="true"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                  ))}
                </select>
              </div>

              <div className="mb-8">
                <p className={labelBase}>Events Planning to Attend</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleEvents.map(event => (
                    <EventToggle
                      key={event.slug}
                      id={event.slug}
                      label={event.label}
                      date={[formatEventDate(event.event_date), formatEventTime(event.start_time)].filter(Boolean).join(' · ')}
                      checked={!!form.events[event.slug]}
                      onToggle={handleEventToggle}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="mb-10">
            <label htmlFor="message" className={labelBase}>
              A Note for the Couple <span className="normal-case opacity-60">(optional)</span>
            </label>
            <textarea
              id="message"
              placeholder="Share a warm wish or note…"
              value={form.message}
              onChange={e => handleFormChange('message', e.target.value)}
              rows={3}
              className={`${inputBase} resize-none`}
            />
          </div>

          {submitError && (
            <div role="alert" className="mb-6 p-4 bg-dustyRose/10 border border-dustyRose/30 rounded text-center">
              <p className="font-sans text-sm text-dustyRose-dark">{submitError}</p>
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading || (isUnknown && !form.name.trim())}
              aria-busy={loading}
              className="inline-flex items-center gap-3 bg-dustyRose hover:bg-dustyRose-dark disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-serif tracking-widest text-sm uppercase px-12 py-4 rounded-full transition-all duration-300"
            >
              {loading ? <><Spinner /><span>Sending…</span></> : form.attending ? 'Confirm Attendance' : 'Send Regrets'}
            </button>
          </div>
        </form>
      )}
    </SectionShell>
  )
}
