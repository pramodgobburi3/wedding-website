import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { groupLabel } from '../lib/utils'
import { toCSV, downloadCSV } from '../lib/csv'
import { Btn } from '../components/ui'

export default function ResponsesView() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('rsvp_responses')
        .select('*, guest:guests(name, party_name, group:groups(name))')
        .order('submitted_at', { ascending: false })
      setResponses(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  const totalGuests = responses.reduce((sum, r) => sum + r.guest_count, 0)

  function exportCSV() {
    const csv = toCSV([
      { label: 'Name',            value: r => r.guest?.party_name ?? r.guest?.name ?? r.name ?? '' },
      { label: 'Group',           value: r => r.guest?.group?.name ? groupLabel(r.guest.group.name) : '' },
      { label: 'Phone',           value: r => r.phone },
      { label: 'Events',          value: r => (r.events_attending ?? []).join(', ') },
      { label: 'Guests',          value: r => r.guest_count },
      { label: 'Note',            value: r => r.message ?? '' },
      { label: 'Submitted',       value: r => new Date(r.submitted_at).toISOString() },
      { label: 'Party breakdown', value: r => {
        if (!r.member_attendance) return ''
        return Object.values(r.member_attendance)
          .map(m => `${m.name}: ${(m.events ?? []).join(', ') || 'not attending'}`)
          .join(' | ')
      } },
    ], responses)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(`responses-${date}.csv`, csv)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{responses.length} RSVPs</span>
          <span>·</span>
          <span>{totalGuests} guests total</span>
        </div>
        <Btn variant="secondary" onClick={exportCSV} disabled={responses.length === 0}>
          Export CSV
        </Btn>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Group</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Events</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Note</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {responses.map(r => {
              const hasParty = r.member_attendance && Object.keys(r.member_attendance).length > 1
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
                  <td className="px-4 py-3 text-gray-900">
                    <span>{r.guest?.party_name ?? r.guest?.name ?? r.name ?? <span className="text-gray-400 italic">unknown</span>}</span>
                    {hasParty && (
                      <span className="ml-2 text-xs text-rose-400">{isExpanded ? '▴' : '▾'} details</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                    {r.guest?.group?.name ? groupLabel(r.guest.group.name) : <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.phone}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.events_attending?.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{r.guest_count}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{r.message || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(r.submitted_at).toLocaleDateString()}
                  </td>
                </tr>,
                hasParty && isExpanded && (
                  <tr key={`${r.id}-party`} className="bg-rose-50/40">
                    <td colSpan={7} className="px-6 py-3">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Party breakdown</p>
                      <div className="space-y-1">
                        {Object.entries(r.member_attendance).map(([guestId, member]) => (
                          <div key={guestId} className="flex items-start gap-3 text-xs">
                            <span className="font-medium text-gray-700 w-36 flex-shrink-0">
                              {member.name}
                              {member.additional && (
                                <span className="ml-1.5 text-[10px] text-rose-400 font-normal">+added</span>
                              )}
                            </span>
                            <span className="text-gray-500">
                              {member.events?.length
                                ? member.events.join(', ')
                                : <span className="italic text-gray-400">not attending</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ),
              ]
            })}
            {responses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No RSVPs yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
