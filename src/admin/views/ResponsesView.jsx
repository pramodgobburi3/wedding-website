import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResponsesView() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('rsvp_responses')
        .select('*, guest:guests(name)')
        .order('submitted_at', { ascending: false })
      setResponses(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  const totalGuests = responses.reduce((sum, r) => sum + r.guest_count, 0)

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-sm text-gray-500">{responses.length} RSVPs</p>
        <p className="text-sm text-gray-500">·</p>
        <p className="text-sm text-gray-500">{totalGuests} guests total</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Events</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Note</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {responses.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">
                  {r.guest?.name ?? r.name ?? <span className="text-gray-400 italic">unknown</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.phone}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.events_attending?.join(', ') || '—'}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">{r.guest_count}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{r.message || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(r.submitted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {responses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No RSVPs yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
