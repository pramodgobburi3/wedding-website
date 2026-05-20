import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { BLANK_GUEST } from '../lib/constants'
import { normalizePhone, isInternationalPhone, groupLabel } from '../lib/utils'
import { Btn } from '../components/ui'
import GuestFormFields from '../components/GuestFormFields'

export default function ContactRequestsView() {
  const [requests, setRequests]       = useState([])
  const [groups, setGroups]           = useState([])
  const [events, setEvents]           = useState([])
  const [allGuests, setAllGuests]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [convertingId, setConvertingId] = useState(null)
  const [convertForm, setConvertForm]   = useState(BLANK_GUEST)
  const [saving, setSaving]             = useState(false)

  async function load() {
    const [{ data: cr, error: crErr }, { data: grps }, { data: evts }, { data: gs }] = await Promise.all([
      supabase.from('contact_requests').select('*').order('submitted_at', { ascending: false }),
      supabase.from('groups').select('id, name').order('name'),
      supabase.from('events').select('slug, label').order('sort_order'),
      supabase.from('guests').select('party_name, group_id'),
    ])
    if (crErr) setError(crErr.message)
    setRequests(cr ?? [])
    setGroups(grps ?? [])
    setEvents(evts ?? [])
    setAllGuests(gs ?? [])
    setLoading(false)
  }

  const partyGroupMap = useMemo(() => {
    const map = {}
    allGuests.forEach(g => {
      if (g.party_name && g.group_id && !map[g.party_name]) map[g.party_name] = g.group_id
    })
    return map
  }, [allGuests])

  useEffect(() => { load() }, [])

  function startConvert(request) {
    setConvertingId(request.id)
    setConvertForm({
      ...BLANK_GUEST,
      name:   request.name,
      phones: request.phone,
    })
    setError(null)
  }

  function cancelConvert() {
    setConvertingId(null)
    setConvertForm(BLANK_GUEST)
  }

  async function handleConvert(e) {
    e.preventDefault()
    const request = requests.find(r => r.id === convertingId)
    if (!request) return
    setSaving(true)
    setError(null)

    try {
      const { data: guest, error: gErr } = await supabase
        .from('guests')
        .insert({
          name:            convertForm.name.trim(),
          group_id:        convertForm.group_id,
          events_override: convertForm.events_override?.length ? convertForm.events_override : null,
          party_name:      convertForm.party_name?.trim() || null,
        })
        .select('id')
        .single()
      if (gErr) throw gErr

      const phones = (convertForm.phones ?? '')
        .split(',')
        .map(raw => ({ phone: normalizePhone(raw), is_international: isInternationalPhone(raw) }))
        .filter(p => p.phone)
      if (phones.length) {
        const { error: pErr } = await supabase
          .from('guest_phones')
          .insert(phones.map(p => ({ guest_id: guest.id, phone: p.phone, is_international: p.is_international })))
        if (pErr) throw pErr
      }

      const { error: dErr } = await supabase.from('contact_requests').delete().eq('id', request.id)
      if (dErr) throw dErr

      setConvertingId(null)
      setConvertForm(BLANK_GUEST)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this contact request?')) return
    const { error } = await supabase.from('contact_requests').delete().eq('id', id)
    if (error) { setError(error.message); return }
    load()
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{requests.length} contact request{requests.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {requests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-400">No contact requests yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(r => (
                convertingId === r.id ? (
                  <tr key={r.id}>
                    <td colSpan={4} className="px-4 py-4">
                      <form onSubmit={handleConvert} className="space-y-3">
                        <p className="text-sm font-medium text-gray-800">Create guest from request</p>
                        <p className="text-xs text-gray-400">
                          Saving will create the guest, add their phone number, and remove the contact request.
                        </p>
                        <GuestFormFields form={convertForm} onChange={setConvertForm} groups={groups} events={events} showPhones partyGroupMap={partyGroupMap} />
                        <div className="flex gap-2">
                          <Btn type="submit" variant="primary" disabled={saving || !convertForm.name.trim() || !convertForm.group_id}>
                            {saving ? 'Saving…' : 'Create guest'}
                          </Btn>
                          <Btn variant="secondary" onClick={cancelConvert}>Cancel</Btn>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Btn variant="primary" onClick={() => startConvert(r)}>Create guest</Btn>
                      <Btn variant="danger" onClick={() => handleDelete(r.id)} className="ml-2">Delete</Btn>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
