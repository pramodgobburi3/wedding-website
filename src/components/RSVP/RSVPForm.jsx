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
  const digits = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('+') && digits.length > 10) return digits.slice(-10)
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits
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

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5 text-dustyRose/60 flex-shrink-0"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function CheckMark({ checked }) {
  return (
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
  )
}

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

function AttendingToggle({ attending, onChange }) {
  return (
    <div className="flex gap-2">
      {[
        { val: true,  label: 'Attending' },
        { val: false, label: 'Not Attending' },
      ].map(({ val, label }) => {
        const active = attending === val
        return (
          <button
            key={label}
            type="button"
            onClick={() => { if (!active) onChange(val) }}
            className="px-3 py-1.5 rounded text-xs font-sans transition-all duration-200"
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor:     active ? 'rgba(196,126,133,0.9)' : 'rgba(196,126,133,0.35)',
              backgroundColor: active ? 'rgba(196,126,133,0.10)' : 'transparent',
              color: '#5C3D2E',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RSVPForm() {
  const sectionRef = useRef(null)
  const bgRef      = useRef(null)
  const additionalIdRef = useRef(0)

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

  // phases: phone | members | select_events | accommodations | not_found | contact_sent | already_submitted | success
  const [phase, setPhase]                   = useState('phone')
  const [phoneInput, setPhoneInput]         = useState('')
  const [guestId, setGuestId]               = useState(null)
  const [hostAllowedEvents, setHostAllowed] = useState([])
  const [allEvents, setAllEvents]           = useState([])
  const [accommodationDates, setAccommodationDates] = useState([])
  const [loading, setLoading]               = useState(false)
  const [lookupError, setLookupError]       = useState(null)
  const [submitError, setSubmitError]       = useState(null)
  const [declined, setDeclined]             = useState(false)
  const [contactName, setContactName]       = useState('')
  const [contactError, setContactError]     = useState(null)
  const [travelEligible, setTravelEligible] = useState(false)

  // Unified party state. Member shape: { id, name, allowed_events, additional }
  const [members, setMembers]             = useState([])
  const [attendingSet, setAttendingSet]   = useState(new Set())
  const [memberEvents, setMemberEvents]   = useState({})
  const [accommodations, setAccommodations] = useState(new Set())
  const [partyMessage, setPartyMessage]   = useState('')

  useEffect(() => {
    supabase.from('events').select('*').order('sort_order')
      .then(({ data }) => setAllEvents(data ?? []))
    supabase.from('accommodation_dates').select('*').order('date')
      .then(({ data }) => setAccommodationDates(data ?? []))
  }, [])

  const dbMemberCount = members.filter(m => !m.additional).length

  function makeAdditionalMember(allowedEvents) {
    const id = `additional_${++additionalIdRef.current}`
    return { id, name: '', allowed_events: allowedEvents, additional: true }
  }

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

      if (!data.found) {
        setPhase('not_found')
        return
      }

      const hostEvents = data.allowed_events ?? []
      // Use party_members if the updated RPC is deployed; otherwise fall back
      // to building a single-member list from the basic lookup fields.
      const rawMembers = Array.isArray(data.party_members) && data.party_members.length > 0
        ? data.party_members
        : [{ guest_id: data.guest_id, name: data.name, allowed_events: hostEvents }]
      // Split comma-separated names in a single guest entry into individual members.
      const dbMembers = rawMembers.flatMap(m => {
        const names = (m.name ?? '').split(',').map(n => n.trim()).filter(Boolean)
        const allowed = m.allowed_events ?? []
        if (names.length <= 1) {
          return [{ id: m.guest_id, name: m.name, allowed_events: allowed, additional: false }]
        }
        return names.map((name, i) => ({
          id:             `${m.guest_id}__${i}`,
          name,
          allowed_events: allowed,
          additional:     false,
        }))
      })

      setTravelEligible(!!data.travel_accommodations)
      setAccommodations(new Set())
      setGuestId(data.guest_id)
      setHostAllowed(hostEvents)
      setMembers(dbMembers)
      setAttendingSet(new Set(dbMembers.map(m => m.id)))

      const initEvents = {}
      dbMembers.forEach(m => {
        initEvents[m.id] = Object.fromEntries((m.allowed_events ?? []).map(s => [s, true]))
      })
      setMemberEvents(initEvents)

      setPhase('members')
    } catch {
      setLookupError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function addMember() {
    const newMember = makeAdditionalMember(hostAllowedEvents)
    setMembers(prev => [...prev, newMember])
    setAttendingSet(prev => new Set(prev).add(newMember.id))
    setMemberEvents(prev => ({
      ...prev,
      [newMember.id]: Object.fromEntries(hostAllowedEvents.map(s => [s, true])),
    }))
  }

  function removeMember(id) {
    setMembers(prev => prev.filter(m => m.id !== id))
    setAttendingSet(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setMemberEvents(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  function updateMemberName(id, name) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, name } : m))
  }

  function toggleMemberAttending(id, val) {
    setAttendingSet(prev => {
      const next = new Set(prev)
      val ? next.add(id) : next.delete(id)
      return next
    })
  }

  function toggleMemberEvent(id, slug) {
    setMemberEvents(prev => ({
      ...prev,
      [id]: { ...prev[id], [slug]: !prev[id]?.[slug] },
    }))
  }

  function isRemovable(member, index) {
    if (!member.additional) return false
    // For unknown phones, the first row is the host — can't remove.
    if (dbMemberCount === 0 && index === 0) return false
    return true
  }

  const namesIncomplete = members.some(m => !m.name.trim())
  const canContinue = members.length > 0 && !namesIncomplete

  // Events to show in event-selection step
  const partyVisibleEvents = allEvents.filter(event =>
    members.some(
      m => attendingSet.has(m.id) && (m.allowed_events ?? []).includes(event.slug)
    )
  )

  // Nights the party can request accommodations for. Driven entirely by the
  // accommodation_dates admin list; the party just needs to be in a group
  // flagged for travel_accommodations.
  const accommodationOptions = travelEligible ? accommodationDates : []

  const anyoneAttendingAnything = members.some(
    m => attendingSet.has(m.id) && Object.values(memberEvents[m.id] ?? {}).some(v => v)
  )

  async function performSubmit() {
    if (namesIncomplete) return
    setLoading(true)
    setSubmitError(null)

    const hostName = (members.find(m => !m.additional)?.name ?? members[0]?.name ?? '').trim() || null
    const memberAttendance = {}
    members.forEach(m => {
      const events = attendingSet.has(m.id)
        ? Object.entries(memberEvents[m.id] ?? {}).filter(([, v]) => v).map(([k]) => k)
        : []
      memberAttendance[m.id] = {
        name:       m.name.trim(),
        events,
        additional: m.additional,
        ...(m.additional && {
          added_by_name:     hostName,
          added_by_guest_id: guestId,
        }),
      }
    })

    const allEventsAttending = [...new Set(Object.values(memberAttendance).flatMap(m => m.events))]
    const guestCount = Object.values(memberAttendance).filter(m => m.events.length > 0).length

    const accommodationsList = accommodationOptions
      .map(d => d.date)
      .filter(date => accommodations.has(date))

    try {
      const { data, error } = await supabase.rpc('submit_rsvp', {
        p_guest_id:                guestId,
        p_phone:                   normalizePhone(phoneInput),
        p_events_attending:        allEventsAttending,
        p_guest_count:             guestCount,
        p_message:                 partyMessage.trim() || null,
        p_member_attendance:       memberAttendance,
        p_accommodations_requested: accommodationsList.length ? accommodationsList : null,
      })
      if (error) throw error
      if (data?.ok === false && data?.reason === 'already_submitted') {
        setPhase('already_submitted')
        return
      }
      setDeclined(guestCount === 0)
      setPhase('success')
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    // If anyone is going to an accommodation-eligible event and the party's
    // group allows accommodations, route them through the accommodations step.
    if (anyoneAttendingAnything && accommodationOptions.length > 0) {
      setPhase('accommodations')
      return
    }
    performSubmit()
  }

  function handleMembersContinue() {
    if (attendingSet.size === 0) {
      performSubmit()
    } else {
      setPhase('select_events')
    }
  }

  function tryAnotherNumber() {
    setPhase('phone')
    setPhoneInput('')
    setLookupError(null)
    setContactName('')
    setContactError(null)
  }

  async function submitContactRequest(e) {
    e.preventDefault()
    if (!contactName.trim()) return
    setLoading(true)
    setContactError(null)
    try {
      const { error } = await supabase.from('contact_requests').insert({
        phone: normalizePhone(phoneInput),
        name:  contactName.trim(),
      })
      if (error) throw error
      setPhase('contact_sent')
    } catch {
      setContactError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success ──────────────────────────────────────────────────────────────────

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

  // ── Contact request sent ──────────────────────────────────────────────────────

  if (phase === 'contact_sent') {
    return (
      <SectionShell sectionRef={sectionRef} bgRef={bgRef} narrow>
        <div className="text-center">
          <RoseIcon />
          <h2 className="font-serif text-3xl text-bark mb-3" style={{ fontWeight: 300 }}>
            Thanks for Reaching Out
          </h2>
          <p className="font-serif italic text-bark/65 text-lg leading-relaxed">
            We've received your message and will be in touch with you shortly.
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

  // ── Already submitted ─────────────────────────────────────────────────────────

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

      {/* ── Phone step ──────────────────────────────────────────────────────── */}

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

      {/* ── Not found step ──────────────────────────────────────────────────── */}

      {phase === 'not_found' && (
        <div>
          <div className="text-center mb-8 -mt-6">
            <p className="font-serif italic text-bark/65 text-lg leading-relaxed mb-3">
              We're so sorry — we couldn't find an invitation matching that phone number.
            </p>
            <p className="font-sans text-sm text-bark/60">
              Please try again with a different number, or notify us below and we'll reach out.
            </p>
          </div>

          <div className="text-center mb-10">
            <button
              type="button"
              onClick={tryAnotherNumber}
              className="font-sans text-xs tracking-widest uppercase text-dustyRose hover:text-dustyRose-dark border border-dustyRose/40 hover:border-dustyRose rounded-full px-6 py-2 transition-colors duration-200"
            >
              Try a Different Number
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gold/30" />
            <span className="font-sans text-[10px] tracking-widest uppercase text-bark/40">Or contact the hosts</span>
            <div className="h-px flex-1 bg-gold/30" />
          </div>

          <form onSubmit={submitContactRequest} noValidate>
            <div className="mb-8">
              <label htmlFor="contact-name" className={labelBase}>Your Name</label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className={inputBase}
                aria-required="true"
              />
              {contactError && (
                <p role="alert" className="mt-2 font-sans text-xs text-dustyRose">
                  {contactError}
                </p>
              )}
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={loading || !contactName.trim()}
                aria-busy={loading}
                className="inline-flex items-center gap-3 bg-dustyRose hover:bg-dustyRose-dark disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-serif tracking-widest text-sm uppercase px-12 py-4 rounded-full transition-all duration-300"
              >
                {loading ? <><Spinner /><span>Sending…</span></> : 'Notify the Hosts'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Members step ────────────────────────────────────────────────────── */}

      {phase === 'members' && (
        <div>
          <p className="font-serif italic text-bark/55 text-center text-lg mb-10 -mt-6">
            Please confirm your RSVP and add any additional guests.
          </p>

          <div className="mb-6 space-y-3">
            <div className="flex items-baseline justify-between">
              <p className={labelBase}>Your RSVP</p>
              <p className="font-sans text-[10px] tracking-wide text-bark/45 italic">Tap a name to edit</p>
            </div>
            {members.map((member, index) => {
              const attending = attendingSet.has(member.id)
              const removable = isRemovable(member, index)
              const isHostUnknownRow = member.additional && dbMemberCount === 0 && index === 0
              return (
                <div
                  key={member.id}
                  className="rounded border px-4 py-3"
                  style={{ borderColor: 'rgba(196,126,133,0.3)', backgroundColor: 'rgba(196,126,133,0.03)' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 flex items-center gap-2 border-b-2 border-dustyRose/40 focus-within:border-dustyRose transition-colors">
                      <input
                        type="text"
                        value={member.name}
                        onChange={e => updateMemberName(member.id, e.target.value)}
                        placeholder={isHostUnknownRow ? 'Your name' : 'Guest name'}
                        className="flex-1 bg-transparent outline-none py-1 font-sans text-bark placeholder-bark/35 text-base"
                        aria-required="true"
                      />
                      <PencilIcon />
                    </div>
                    {removable && (
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        aria-label={`Remove ${member.name || 'guest'}`}
                        className="text-bark/40 hover:text-dustyRose text-xl leading-none px-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {!member.additional && (
                    <AttendingToggle
                      attending={attending}
                      onChange={val => toggleMemberAttending(member.id, val)}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {attendingSet.size > 0 && (
            <div className="mb-8 text-center">
              <button
                type="button"
                onClick={addMember}
                className="font-sans text-xs tracking-widest uppercase text-dustyRose hover:text-dustyRose-dark border border-dustyRose/40 hover:border-dustyRose rounded-full px-6 py-2 transition-colors duration-200"
              >
                + Add another guest
              </button>
            </div>
          )}

          {submitError && (
            <div role="alert" className="mb-6 p-4 bg-dustyRose/10 border border-dustyRose/30 rounded text-center">
              <p className="font-sans text-sm text-dustyRose-dark">{submitError}</p>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleMembersContinue}
              disabled={!canContinue || loading}
              aria-busy={loading}
              className="inline-flex items-center gap-3 bg-dustyRose hover:bg-dustyRose-dark disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-serif tracking-widest text-sm uppercase px-12 py-4 rounded-full transition-all duration-300"
            >
              {loading
                ? <><Spinner /><span>Sending…</span></>
                : namesIncomplete ? 'Enter All Names'
                : attendingSet.size === 0 ? 'Send Regrets'
                : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* ── Event selection step ─────────────────────────────────────────────── */}

      {phase === 'select_events' && (
        <form onSubmit={handleSubmit} noValidate>
          {attendingSet.size === 0 ? (
            <p className="font-serif italic text-bark/55 text-center text-lg mb-10 -mt-6">
              We're sorry to hear you can't make it. Please send your regards below.
            </p>
          ) : (
            <p className="font-serif italic text-bark/55 text-center text-lg mb-10 -mt-6">
              For each event, select who will be attending.
            </p>
          )}

          {partyVisibleEvents.length > 0 && (
            <div className="mb-8 space-y-5">
              <p className={labelBase}>Events</p>
              {partyVisibleEvents.map(event => {
                const eligibleMembers = members.filter(
                  m => attendingSet.has(m.id) && (m.allowed_events ?? []).includes(event.slug)
                )
                return (
                  <div
                    key={event.slug}
                    className="rounded border px-4 py-3"
                    style={{ borderColor: 'rgba(196,126,133,0.3)', backgroundColor: 'rgba(196,126,133,0.03)' }}
                  >
                    <div className="mb-2">
                      <span className="font-serif text-bark text-sm font-bold">{event.label}</span>
                      <span className="ml-2 font-sans text-[10px] tracking-widest uppercase text-bark/70">
                        {[formatEventDate(event.event_date), formatEventTime(event.start_time)].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {eligibleMembers.map(member => {
                        const checked = memberEvents[member.id]?.[event.slug] ?? false
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleMemberEvent(member.id, event.slug)}
                            className="flex items-center gap-3 w-full text-left py-1"
                          >
                            <CheckMark checked={checked} />
                            <span className="font-sans text-sm text-bark">{member.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mb-10">
            <label htmlFor="party-message" className={labelBase}>
              A Note for the Couple <span className="normal-case opacity-60">(optional)</span>
            </label>
            <textarea
              id="party-message"
              placeholder="Share a warm wish or note…"
              value={partyMessage}
              onChange={e => setPartyMessage(e.target.value)}
              rows={3}
              className={`${inputBase} resize-none`}
            />
          </div>

          {submitError && (
            <div role="alert" className="mb-6 p-4 bg-dustyRose/10 border border-dustyRose/30 rounded text-center">
              <p className="font-sans text-sm text-dustyRose-dark">{submitError}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPhase('members')}
              className="font-sans text-xs tracking-widest uppercase text-bark/60 hover:text-bark transition-colors duration-200"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="inline-flex items-center gap-3 bg-dustyRose hover:bg-dustyRose-dark disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-serif tracking-widest text-sm uppercase px-12 py-4 rounded-full transition-all duration-300"
            >
              {loading
                ? <><Spinner /><span>Sending…</span></>
                : !anyoneAttendingAnything ? 'Send Regrets'
                : accommodationOptions.length > 0 ? 'Continue'
                : 'Confirm Attendance'}
            </button>
          </div>
        </form>
      )}

      {/* ── Accommodations step ─────────────────────────────────────────────── */}

      {phase === 'accommodations' && (
        <form onSubmit={e => { e.preventDefault(); performSubmit() }} noValidate>
          <div className="text-center mb-10 -mt-6">
            <p className="font-script text-dustyRose text-2xl mb-2">A place to rest</p>
            <p className="font-serif italic text-bark/65 text-lg leading-relaxed">
              We'd love for you to stay with us.
            </p>
            <p className="font-sans text-sm text-bark/60 mt-3">
              Pick the nights you'd like a room and we'll take care of the rest.
            </p>
          </div>

          <div className="mb-8">
            <p className={labelBase}>Nights with us</p>
            <div
              className="mt-3 rounded border px-4 py-3 space-y-1"
              style={{ borderColor: 'rgba(196,126,133,0.3)', backgroundColor: 'rgba(196,126,133,0.03)' }}
            >
              {accommodationOptions.map(night => {
                const checked = accommodations.has(night.date)
                return (
                  <button
                    key={night.id}
                    type="button"
                    onClick={() => {
                      setAccommodations(prev => {
                        const next = new Set(prev)
                        next.has(night.date) ? next.delete(night.date) : next.add(night.date)
                        return next
                      })
                    }}
                    className="flex items-center gap-3 w-full text-left py-1.5"
                  >
                    <CheckMark checked={checked} />
                    <span className="font-sans text-sm text-bark">
                      {formatEventDate(night.date)}
                      {night.label && (
                        <span className="ml-2 text-[10px] tracking-widest uppercase text-bark/60">
                          {night.label}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="font-sans text-xs text-bark/45 italic mt-3">
              Don't need a room? Just leave them all unchecked.
            </p>
          </div>

          {submitError && (
            <div role="alert" className="mb-6 p-4 bg-dustyRose/10 border border-dustyRose/30 rounded text-center">
              <p className="font-sans text-sm text-dustyRose-dark">{submitError}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPhase('select_events')}
              className="font-sans text-xs tracking-widest uppercase text-bark/60 hover:text-bark transition-colors duration-200"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="inline-flex items-center gap-3 bg-dustyRose hover:bg-dustyRose-dark disabled:opacity-50 disabled:cursor-not-allowed text-ivory font-serif tracking-widest text-sm uppercase px-12 py-4 rounded-full transition-all duration-300"
            >
              {loading ? <><Spinner /><span>Sending…</span></> : 'Confirm Attendance'}
            </button>
          </div>
        </form>
      )}
    </SectionShell>
  )
}
