import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import EventCard from './EventCard'
import sangeetImg   from '../../assets/photos/sangeet.webp'
import ceremonyImg  from '../../assets/photos/ceremony.webp'
import receptionImg from '../../assets/photos/reception.webp'

// Static per-event presentation. `slug` matches public.events.slug so date/time
// hydrate from the DB — everything else (venue, dresscode, artwork) lives here
// since it isn't modeled in the schema.
const EVENT_META = [
  {
    slug: 'sangeet',
    name: 'Sangeet',
    tagline: 'Music & Dance',
    venue: 'The Robert and Arlene Kogod Courtyard',
    address: '8th and G Streets NW, Washington, DC 20001',
    dresscode: 'Indian Party Attire',
    accent: '#C47E85',
    icon: sangeetImg,
  },
  {
    slug: 'ceremony',
    name: 'Ceremony',
    tagline: 'The Sacred Union',
    venue: 'Waldorf Astoria Washington DC',
    address: '1100 Pennsylvania Ave NW, Washington, DC 20004',
    dresscode: 'Indian Traditional Attire',
    accent: '#5C7A4E',
    icon: ceremonyImg,
    sumuhurtham: '10:57 AM',
    icsEndTime: '12:00 PM',
  },
  {
    slug: 'reception',
    name: 'Reception',
    tagline: 'A Grand Celebration',
    venue: 'Andrew W. Mellon Auditorium',
    address: '1301 Constitution Ave NW, Washington, DC 20240',
    dresscode: 'Indian Party Attire & Formal Suits',
    accent: '#8FA9B8',
    icon: receptionImg,
  },
]

const SLUGS = EVENT_META.map(e => e.slug)

const COUPLE_PREFIX = 'Snigdha & Pramod'
const EVENT_TZID    = 'America/New_York'

// VTIMEZONE block referenced by TZID=America/New_York DTSTART/DTEND lines.
// Required by RFC 5545 whenever a TZID is used. Standard EST/EDT rules.
const VTIMEZONE_AMERICA_NEW_YORK = [
  'BEGIN:VTIMEZONE',
  `TZID:${EVENT_TZID}`,
  'BEGIN:STANDARD',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'END:DAYLIGHT',
  'END:VTIMEZONE',
].join('\r\n')

// "Sunday, August 16" (no year — guests know the wedding year already)
function formatShortDate(dateStr) {
  if (!dateStr) return null
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

// "Sunday, August 16 · 8:30 AM" — falls back gracefully if either half is null.
function buildWhen(dateStr, timeStr) {
  const d = formatShortDate(dateStr)
  if (!d && !timeStr) return 'Details to be announced'
  if (!d) return timeStr
  if (!timeStr) return d
  return `${d} · ${timeStr}`
}

// First comma-separated segment is treated as the street. If there's no comma,
// the whole string is returned as-is.
function streetOnly(fullAddress) {
  if (!fullAddress) return null
  const idx = fullAddress.indexOf(',')
  return idx === -1 ? fullAddress : fullAddress.slice(0, idx).trim()
}

// Google Maps deep link (works on iOS, Android, and desktop web).
function buildMapUrl(venue, address) {
  const query = [venue, address].filter(Boolean).join(', ')
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

const pad = n => String(n).padStart(2, '0')
const icsEscape = s => (s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
const fmtUtc = d =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

// Format a Date's UTC components as a local-wall-clock ICS timestamp. Used
// together with TZID=America/New_York so calendar apps show the event as
// "Eastern Time" everywhere and let the viewer see the local equivalent.
const fmtLocal = d =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`

// Build an ICS data URI for a single event. If start_time is null the event
// is written as an all-day event on event_date. Timed events carry the
// America/New_York timezone so the wall-clock time is preserved.
function buildIcsUri({ slug, name, tagline, venue, address, dateStr, timeStr, endTimeStr }) {
  if (!dateStr) return null

  const [y, mo, d] = dateStr.split('-').map(Number)
  const nowStamp = fmtUtc(new Date())
  let dtstart, dtend, needsTimezone = false

  if (timeStr) {
    const parsed = parseClockTime(timeStr)
    if (!parsed) return null
    // Treat the wall-clock ET time as if it were UTC purely for arithmetic —
    // we read the same components back out via fmtLocal, which prints the
    // wall clock unchanged. The TZID declaration in the DTSTART line tells
    // calendar apps this is America/New_York local time.
    const start = new Date(Date.UTC(y, mo - 1, d, parsed.h, parsed.m))
    // If an explicit end time is provided, honor it. Otherwise default to 3h.
    const parsedEnd = endTimeStr ? parseClockTime(endTimeStr) : null
    const end = parsedEnd
      ? new Date(Date.UTC(y, mo - 1, d, parsedEnd.h, parsedEnd.m))
      : new Date(start.getTime() + 3 * 60 * 60 * 1000)
    dtstart = `DTSTART;TZID=${EVENT_TZID}:${fmtLocal(start)}`
    dtend = `DTEND;TZID=${EVENT_TZID}:${fmtLocal(end)}`
    needsTimezone = true
  } else {
    const endDate = new Date(Date.UTC(y, mo - 1, d + 1))
    dtstart = `DTSTART;VALUE=DATE:${y}${pad(mo)}${pad(d)}`
    dtend = `DTEND;VALUE=DATE:${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}`
  }

  const summary = `${COUPLE_PREFIX} — ${name}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Snigdha & Pramod Wedding//EN',
    'CALSCALE:GREGORIAN',
  ]
  if (needsTimezone) lines.push(VTIMEZONE_AMERICA_NEW_YORK)
  lines.push(
    'BEGIN:VEVENT',
    `UID:${slug}-snigdhaandpramod-2026@snigdhaandpramod.com`,
    `DTSTAMP:${nowStamp}`,
    dtstart,
    dtend,
    `SUMMARY:${icsEscape(summary)}`,
    `LOCATION:${icsEscape(`${venue}, ${address}`)}`,
    `DESCRIPTION:${icsEscape(tagline)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  )

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}

// Accepts "8:30 AM", "20:00", "20:00:00" — anything Postgres or the admin UI
// might store. Returns { h, m } in 24-hour clock, or null on failure.
function parseClockTime(raw) {
  const s = String(raw).trim()
  const ampm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s)
  if (ampm) {
    let h = Number(ampm[1]) % 12
    if (/PM/i.test(ampm[3])) h += 12
    return { h, m: Number(ampm[2]) }
  }
  const twentyfour = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(s)
  if (twentyfour) return { h: Number(twentyfour[1]), m: Number(twentyfour[2]) }
  return null
}

export default function Events() {
  const [bySlug, setBySlug] = useState({})

  useEffect(() => {
    supabase
      .from('events')
      .select('slug, event_date, start_time')
      .in('slug', SLUGS)
      .then(({ data }) => {
        setBySlug(Object.fromEntries((data ?? []).map(e => [e.slug, e])))
      })
  }, [])

  return (
    <section
      id="events"
      className="section-pad relative overflow-hidden"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="max-w-xl mx-auto px-6 text-center mb-16">
          <p className="font-script text-dustyRose text-2xl mb-2">Mark your calendars</p>
          <h2 className="font-serif text-4xl md:text-5xl text-bark mb-4" style={{ fontWeight: 300 }}>
            Events
          </h2>

          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-16 bg-gold/50" />
            <span className="text-gold text-xl">✦</span>
            <div className="h-px w-16 bg-gold/50" />
          </div>

          <p className="font-serif italic text-bark/70 text-lg md:text-xl leading-relaxed">
            Join us across a beautiful series of ceremonies as we begin our new chapter together.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-6 max-w-4xl mx-auto">
          {EVENT_META.map((meta, i) => {
            const row = bySlug[meta.slug]
            const dateStr = row?.event_date
            const timeStr = row?.start_time
            return (
              <EventCard
                key={meta.slug}
                id={meta.slug}
                name={meta.name}
                tagline={meta.tagline}
                whenLabel={buildWhen(dateStr, timeStr)}
                venue={meta.venue}
                streetAddress={streetOnly(meta.address)}
                mapUrl={buildMapUrl(meta.venue, meta.address)}
                dresscode={meta.dresscode}
                sumuhurtham={meta.sumuhurtham}
                accent={meta.accent}
                icon={meta.icon}
                icsUri={buildIcsUri({
                  slug: meta.slug,
                  name: meta.name,
                  tagline: meta.tagline,
                  venue: meta.venue,
                  address: meta.address,
                  dateStr,
                  timeStr,
                  endTimeStr: meta.icsEndTime,
                })}
                icsFilename={`${meta.name.replace(/\s+/g, '-')}.ics`}
                index={i}
              />
            )
          })}
        </div>

        <p className="text-center font-sans text-xs text-bark/40 tracking-widest uppercase mt-12">
          All times are in Eastern Time
        </p>
      </div>
    </section>
  )
}
