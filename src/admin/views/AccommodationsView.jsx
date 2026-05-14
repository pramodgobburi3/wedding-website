import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { toCSV, downloadCSV } from '../lib/csv'
import { Btn, Input } from '../components/ui'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function AccommodationsView() {
  const [responses, setResponses] = useState([])
  const [dates, setDates]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [newDate, setNewDate]     = useState('')
  const [newLabel, setNewLabel]   = useState('')
  const [savingDate, setSavingDate] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  async function load() {
    const [{ data: resp, error: respErr }, { data: ds, error: dsErr }] = await Promise.all([
      supabase
        .from('rsvp_responses')
        .select('id, phone, guest_count, accommodations_requested, member_attendance, submitted_at, guest:guests(name, party_name)')
        .not('accommodations_requested', 'is', null)
        .order('submitted_at', { ascending: false }),
      supabase.from('accommodation_dates').select('*').order('date'),
    ])
    if (respErr) setError(respErr.message)
    if (dsErr)   setError(dsErr.message)
    setResponses(resp ?? [])
    setDates(ds ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addDate(e) {
    e.preventDefault()
    if (!newDate) return
    setSavingDate(true)
    setError(null)
    const { error: insertErr } = await supabase
      .from('accommodation_dates')
      .insert({ date: newDate, label: newLabel.trim() || null })
    setSavingDate(false)
    if (insertErr) {
      setError(insertErr.message.includes('duplicate') ? 'That date is already in the list' : insertErr.message)
      return
    }
    setNewDate('')
    setNewLabel('')
    load()
  }

  async function deleteDate(id) {
    if (!window.confirm('Remove this date from accommodations?')) return
    const { error: delErr } = await supabase.from('accommodation_dates').delete().eq('id', id)
    if (delErr) { setError(delErr.message); return }
    load()
  }

  const rows = useMemo(() => {
    return responses
      .filter(r => Array.isArray(r.accommodations_requested) && r.accommodations_requested.length > 0)
      .map(r => ({
        id:          r.id,
        name:        r.guest?.party_name ?? r.guest?.name ?? '—',
        phone:       r.phone,
        guestCount:  r.guest_count,
        nights:      r.accommodations_requested,
        submittedAt: r.submitted_at,
        members:     r.member_attendance
          ? Object.values(r.member_attendance).map(m => ({ name: m.name, additional: !!m.additional }))
          : [],
      }))
  }, [responses])

  const totalRequests = rows.length
  const totalGuests = rows.reduce((sum, r) => sum + r.guestCount, 0)
  const totalGuestNights = rows.reduce((sum, r) => sum + r.guestCount * r.nights.length, 0)

  function exportCSV() {
    const csv = toCSV([
      { label: 'Name',           value: r => r.name },
      { label: 'Phone',          value: r => r.phone },
      { label: 'Guests',         value: r => r.guestCount },
      { label: 'Nights',         value: r => r.nights.map(formatDate).join('; ') },
      { label: 'Submitted',      value: r => new Date(r.submittedAt).toISOString() },
    ], rows)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(`accommodations-${date}.csv`, csv)
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="space-y-6">
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Manage dates */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-800 mb-1">Available nights</p>
        <p className="text-xs text-gray-400 mb-3">
          Dates listed here appear as opt-in checkboxes on the RSVP form for guests in groups marked for travel accommodations.
        </p>

        {dates.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-3">No nights added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {dates.map(d => (
              <span key={d.id} className="inline-flex items-center gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded px-2 py-1">
                <span>{formatDate(d.date)}{d.label ? ` · ${d.label}` : ''}</span>
                <button
                  onClick={() => deleteDate(d.id)}
                  className="text-amber-600 hover:text-red-500 leading-none"
                  aria-label={`Remove ${formatDate(d.date)}`}
                >×</button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={addDate} className="flex flex-wrap items-end gap-2">
          <div className="w-40">
            <label className="block text-xs text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              required
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
            />
          </div>
          <div className="w-56">
            <Input
              label="Label"
              hint="(optional)"
              type="text"
              placeholder="e.g. Pre-wedding night"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
            />
          </div>
          <Btn type="submit" variant="primary" disabled={savingDate || !newDate}>
            {savingDate ? 'Adding…' : 'Add night'}
          </Btn>
        </form>
      </div>

      {/* Requests */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{totalRequests} {totalRequests === 1 ? 'request' : 'requests'}</span>
            <span>·</span>
            <span>{totalGuests} guests</span>
            <span>·</span>
            <span>{totalGuestNights} guest-nights</span>
          </div>
          <Btn variant="secondary" onClick={exportCSV} disabled={rows.length === 0}>Export CSV</Btn>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-400">No accommodation requests yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Guests</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nights</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => {
                  const hasParty = r.members.length > 1
                  const isExpanded = expandedIds.has(r.id)
                  return [
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 ${hasParty ? 'cursor-pointer' : ''}`}
                      onClick={() => hasParty && setExpandedIds(prev => {
                        const next = new Set(prev)
                        next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                        return next
                      })}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <span>{r.name}</span>
                        {hasParty && (
                          <span className="ml-2 text-xs text-rose-400">{isExpanded ? '▴' : '▾'} members</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.guestCount}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {r.nights.map(d => (
                            <span key={d} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                              {formatDate(d)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.phone}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>,
                    hasParty && isExpanded && (
                      <tr key={`${r.id}-members`} className="bg-rose-50/40">
                        <td colSpan={5} className="px-6 py-3">
                          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Party members</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {r.members.map((m, i) => (
                              <span key={i} className="text-xs text-gray-700">
                                {m.name}
                                {m.additional && (
                                  <span className="ml-1.5 text-[10px] text-rose-400 font-normal">+added</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
