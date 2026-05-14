import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { toCSV, downloadCSV } from '../lib/csv'
import { Btn } from '../components/ui'

export default function EventBreakdownView() {
  const [events, setEvents]       = useState([])
  const [responses, setResponses] = useState([])
  const [guests, setGuests]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [selectedSlug, setSelectedSlug] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: evts }, { data: resp }, { data: gs }] = await Promise.all([
        supabase.from('events').select('slug, label, event_date').order('sort_order'),
        supabase.from('rsvp_responses').select('id, phone, member_attendance, submitted_at'),
        supabase.from('guests').select('id, party_name'),
      ])
      setEvents(evts ?? [])
      setResponses(resp ?? [])
      setGuests(gs ?? [])
      if (evts?.length) setSelectedSlug(evts[0].slug)
      setLoading(false)
    }
    load()
  }, [])

  // Map of event slug → array of attending members
  const attendeesBySlug = useMemo(() => {
    const partyByGuestId = Object.fromEntries(guests.map(g => [g.id, g.party_name]))
    const extractGuestId = memberId => {
      if (memberId.startsWith('additional_')) return null
      const idx = memberId.indexOf('__')
      return idx === -1 ? memberId : memberId.slice(0, idx)
    }
    const map = {}
    responses.forEach(r => {
      if (!r.member_attendance) return
      Object.entries(r.member_attendance).forEach(([memberId, member]) => {
        if (!Array.isArray(member.events)) return
        const guestId = extractGuestId(memberId)
        const partyName = guestId ? partyByGuestId[guestId] ?? null : null
        member.events.forEach(slug => {
          if (!map[slug]) map[slug] = []
          map[slug].push({
            key:         `${r.id}:${memberId}`,
            name:        member.name,
            additional:  !!member.additional,
            addedBy:     member.added_by_name ?? null,
            phone:       r.phone,
            partyName,
            submittedAt: r.submitted_at,
          })
        })
      })
    })
    Object.values(map).forEach(list =>
      list.sort((a, b) => {
        // Party-less attendees go after parties
        if (!a.partyName && b.partyName) return 1
        if (a.partyName && !b.partyName) return -1
        if (a.partyName !== b.partyName) {
          return (a.partyName ?? '').localeCompare(b.partyName ?? '')
        }
        return a.name.localeCompare(b.name)
      })
    )
    return map
  }, [responses, guests])

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  const attendees = (selectedSlug && attendeesBySlug[selectedSlug]) || []
  const selectedEvent = events.find(e => e.slug === selectedSlug)

  function exportCSV() {
    if (!selectedEvent) return
    const csv = toCSV([
      { label: 'Name',      value: a => a.name },
      { label: 'Party',     value: a => a.partyName ?? '' },
      { label: 'Phone',     value: a => a.phone },
      { label: 'RSVP date', value: a => new Date(a.submittedAt).toISOString() },
      { label: 'Added by',  value: a => a.additional ? (a.addedBy ?? 'unknown') : '' },
    ], attendees)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(`attendees-${selectedEvent.slug}-${date}.csv`, csv)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {events.map(e => {
            const count = attendeesBySlug[e.slug]?.length ?? 0
            const active = selectedSlug === e.slug
            return (
              <button
                key={e.slug}
                onClick={() => setSelectedSlug(e.slug)}
                className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                  active
                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{e.label}</span>
                <span className={`ml-2 ${active ? 'text-rose-400' : 'text-gray-400'}`}>{count}</span>
              </button>
            )
          })}
        </div>
        <Btn variant="secondary" onClick={exportCSV} disabled={attendees.length === 0}>
          Export CSV
        </Btn>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Party</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">RSVP date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                  No confirmed attendees for this event yet.
                </td>
              </tr>
            )}
            {attendees.map((a, i) => {
              const prev = attendees[i - 1]
              const partyChanged = i > 0 && (prev?.partyName ?? null) !== (a.partyName ?? null)
              return (
                <tr key={a.key} className={`hover:bg-gray-50 ${partyChanged ? 'border-t-2 border-t-gray-200' : ''}`}>
                  <td className="px-4 py-3 text-gray-900">
                    {a.name}
                    {a.additional && (
                      <span className="ml-2 text-[10px] text-rose-400 font-normal">
                        +added{a.addedBy ? ` by ${a.addedBy}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {a.partyName || <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.phone}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(a.submittedAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
