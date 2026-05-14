import { useState, useEffect, Fragment, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { BLANK_GUEST } from '../lib/constants'
import { normalizePhone, groupLabel } from '../lib/utils'
import { parseCSV } from '../lib/csv'
import { Btn } from '../components/ui'
import GuestFormFields from '../components/GuestFormFields'

function validateRows(rows, groups, existingPhones, partyGroupMap) {
  const seenInBatch = new Set()
  // Track party→group seen earlier in the same batch so that later rows in
  // the CSV get the same group as the first occurrence.
  const batchPartyGroup = {}
  return rows.map(row => {
    const name = row.name?.trim()
    const normalizedInput = row.group?.toLowerCase().trim().replace(/\s+/g, '_')
    let group = groups.find(g => g.name.toLowerCase() === normalizedInput)
    const phones = (row.phones ?? '').split(',').map(normalizePhone).filter(Boolean)
    const partyName = row.party_name?.trim() || null
    let warning = null
    let error = null
    if (!name) error = 'Missing name'
    else if (!group) error = `Unknown group "${row.group}"`
    else {
      const dupe = phones.find(p => existingPhones.has(p))
      const dupeInBatch = phones.find(p => seenInBatch.has(p))
      if (dupe)         error = `Phone ${dupe} already exists`
      else if (dupeInBatch) error = `Phone ${dupeInBatch} repeated in CSV`
    }

    // Apply party→group lock. Existing party in DB wins; otherwise the first
    // row in the CSV for a party sets the group for that party.
    if (!error && partyName) {
      const lockedId = partyGroupMap[partyName] ?? batchPartyGroup[partyName]
      if (lockedId) {
        if (group && group.id !== lockedId) {
          const lockedGroup = groups.find(g => g.id === lockedId)
          warning = `Group changed to ${lockedGroup?.name ?? '?'} to match party`
          group = lockedGroup ?? group
        }
      } else if (group) {
        batchPartyGroup[partyName] = group.id
      }
    }

    phones.forEach(p => seenInBatch.add(p))
    return { name, groupName: row.group?.trim(), group, phones, partyName, error, warning }
  })
}

export default function GuestsView() {
  const [guests, setGuests]           = useState([])
  const [groups, setGroups]           = useState([])
  const [events, setEvents]           = useState([])
  const [responses, setResponses]     = useState([])
  const [statusFilter, setStatusFilter] = useState('all') // all | responded | pending
  const [loading, setLoading]         = useState(true)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [editingId, setEditingId]     = useState(null)
  const [editForm, setEditForm]       = useState(BLANK_GUEST)
  const [showAdd, setShowAdd]         = useState(false)
  const [addForm, setAddForm]         = useState(BLANK_GUEST)
  const [phoneInputs, setPhoneInputs] = useState({})
  const [error, setError]             = useState(null)
  const [showImport, setShowImport]   = useState(false)
  const [importPreview, setImportPreview] = useState([])
  const [importing, setImporting]     = useState(false)
  const [importResult, setImportResult]  = useState(null)
  const [search, setSearch]           = useState('')
  const fileInputRef                  = useRef(null)

  const existingPhones = useMemo(
    () => new Set(guests.flatMap(g => (g.phones ?? []).map(p => p.phone))),
    [guests]
  )

  // Map of party_name → group_id from existing guests. When editing, the guest
  // being edited is excluded so a sole member of a party can still change groups.
  const partyGroupMap = useMemo(() => {
    const map = {}
    guests.forEach(g => {
      if (!g.party_name || g.id === editingId) return
      const gid = g.group?.id ?? g.group_id
      if (gid && !map[g.party_name]) map[g.party_name] = gid
    })
    return map
  }, [guests, editingId])

  // Guest IDs that appear in any RSVP — either as the response's primary guest,
  // or referenced inside member_attendance (handling guest_id__N split-name ids).
  const respondedSet = useMemo(() => {
    const set = new Set()
    responses.forEach(r => {
      if (r.guest_id) set.add(r.guest_id)
      if (r.member_attendance) {
        Object.keys(r.member_attendance).forEach(memberId => {
          if (memberId.startsWith('additional_')) return
          const idx = memberId.indexOf('__')
          set.add(idx === -1 ? memberId : memberId.slice(0, idx))
        })
      }
    })
    return set
  }, [responses])

  const respondedCount = useMemo(
    () => guests.filter(g => respondedSet.has(g.id)).length,
    [guests, respondedSet]
  )

  const filteredGuests = useMemo(() => {
    const q = search.toLowerCase().trim()
    const qDigits = q.replace(/\D/g, '')
    const filtered = guests.filter(g => {
      const responded = respondedSet.has(g.id)
      if (statusFilter === 'responded' && !responded) return false
      if (statusFilter === 'pending'   &&  responded) return false
      if (!q) return true
      if (g.name?.toLowerCase().includes(q)) return true
      if (g.party_name?.toLowerCase().includes(q)) return true
      if (g.group?.name?.toLowerCase().includes(q)) return true
      if (qDigits && g.phones?.some(p => p.phone.includes(qDigits))) return true
      return false
    })
    // Group rows by party_name; party-less guests sort to the end.
    return filtered.sort((a, b) => {
      if (!a.party_name && b.party_name) return 1
      if (a.party_name && !b.party_name) return -1
      if (a.party_name !== b.party_name) {
        return (a.party_name ?? '').localeCompare(b.party_name ?? '')
      }
      return a.name.localeCompare(b.name)
    })
  }, [guests, search, statusFilter, respondedSet])

  async function load() {
    const [{ data: g, error: ge }, { data: grps }, { data: evts }, { data: resp }] = await Promise.all([
      supabase
        .from('guests')
        .select('*, group:groups(id, name, invited_events), phones:guest_phones(id, phone)')
        .order('name'),
      supabase.from('groups').select('id, name').order('name'),
      supabase.from('events').select('slug, label').order('sort_order'),
      supabase.from('rsvp_responses').select('guest_id, member_attendance'),
    ])
    if (ge) setError(ge.message)
    setGuests(g ?? [])
    setGroups(grps ?? [])
    setEvents(evts ?? [])
    setResponses(resp ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const { data: guest, error } = await supabase
      .from('guests')
      .insert({
        name:            addForm.name.trim(),
        group_id:        addForm.group_id,
        events_override: addForm.events_override?.length ? addForm.events_override : null,
        party_name:      addForm.party_name?.trim() || null,
      })
      .select('id')
      .single()
    if (error) { setError(error.message); return }

    const phones = (addForm.phones ?? '').split(',').map(normalizePhone).filter(Boolean)
    if (phones.length) {
      const { error: phoneErr } = await supabase
        .from('guest_phones')
        .insert(phones.map(phone => ({ guest_id: guest.id, phone })))
      if (phoneErr) { setError(phoneErr.message); return }
    }

    setShowAdd(false)
    setAddForm(BLANK_GUEST)
    load()
  }

  async function handleUpdate(e) {
    e.preventDefault()
    const { error } = await supabase.from('guests').update({
      name:            editForm.name.trim(),
      group_id:        editForm.group_id,
      events_override: editForm.events_override?.length ? editForm.events_override : null,
      party_name:      editForm.party_name?.trim() || null,
    }).eq('id', editingId)
    if (error) { setError(error.message); return }

    const phones = (editForm.phones ?? '').split(',').map(normalizePhone).filter(Boolean)
    await supabase.from('guest_phones').delete().eq('guest_id', editingId)
    if (phones.length) {
      const { error: phoneErr } = await supabase
        .from('guest_phones')
        .insert(phones.map(phone => ({ guest_id: editingId, phone })))
      if (phoneErr) { setError(phoneErr.message); return }
    }

    setEditingId(null)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this guest and all their phone numbers?')) return
    await supabase.from('guests').delete().eq('id', id)
    setExpandedIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    load()
  }

  async function handleAddPhone(guestId) {
    const phone = normalizePhone(phoneInputs[guestId] ?? '')
    if (!phone) return
    const { error } = await supabase.from('guest_phones').insert({ guest_id: guestId, phone })
    if (error) { setError(error.message); return }
    setPhoneInputs(prev => ({ ...prev, [guestId]: '' }))
    load()
  }

  async function handleDeletePhone(id) {
    await supabase.from('guest_phones').delete().eq('id', id)
    load()
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result)
      setImportPreview(validateRows(rows, groups, existingPhones, partyGroupMap))
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const valid = importPreview.filter(r => !r.error)
    setImporting(true)

    try {
      const payload = valid.map(row => ({
        name:       row.name,
        group_id:   row.group.id,
        party_name: row.partyName,
        phones:     row.phones,
      }))
      const { data, error: rpcErr } = await supabase.rpc('bulk_import_guests', { p_payload: payload })
      if (rpcErr) throw rpcErr

      setImportResult({ ok: data?.inserted ?? valid.length, errors: [] })
      setImportPreview([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      load()
    } catch (err) {
      setImportResult({ ok: 0, errors: [err.message] })
    } finally {
      setImporting(false)
    }
  }

  function startEdit(guest) {
    setEditingId(guest.id)
    setExpandedIds(prev => new Set(prev).add(guest.id))
    setEditForm({
      name:            guest.name,
      group_id:        guest.group.id,
      events_override: guest.events_override ?? [],
      phones:          guest.phones.map(p => p.phone).join(', '),
      party_name:      guest.party_name ?? '',
    })
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-sm text-gray-500 flex-shrink-0">
          {search.trim() || statusFilter !== 'all'
            ? `${filteredGuests.length} of ${guests.length} matching`
            : `${guests.reduce((sum, g) => sum + ((g.name ?? '').split(',').map(n => n.trim()).filter(Boolean).length || 1), 0)} guests`}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Btn variant="secondary" onClick={() => { setShowImport(v => !v); setImportPreview([]); setImportResult(null) }}>
            Import CSV
          </Btn>
          <Btn variant="primary" onClick={() => setShowAdd(v => !v)}>+ Add guest</Btn>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all',       label: 'All',       count: guests.length },
            { key: 'responded', label: 'Responded', count: respondedCount },
            { key: 'pending',   label: 'Pending',   count: guests.length - respondedCount },
          ].map(f => {
            const active = statusFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                  active
                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{f.label}</span>
                <span className={`ml-2 ${active ? 'text-rose-400' : 'text-gray-400'}`}>{f.count}</span>
              </button>
            )
          })}
        </div>
        <input
          type="search"
          placeholder="Search by name, phone, group, or party…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300 flex-shrink-0"
        />
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {showImport && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Import guests from CSV</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Required columns: <span className="font-mono">name, group, phones</span> — optional: <span className="font-mono">party_name</span>.
                Phones can be comma-separated inside quotes. Group names match case-insensitively.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:text-gray-600 file:bg-gray-50 hover:file:bg-gray-100"
          />

          {importPreview.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-1.5 pr-4 font-medium">Name</th>
                    <th className="py-1.5 pr-4 font-medium">Group</th>
                    <th className="py-1.5 pr-4 font-medium">Party</th>
                    <th className="py-1.5 pr-4 font-medium">Phones</th>
                    <th className="py-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {importPreview.map((row, i) => (
                    <tr key={i} className={row.error ? 'text-gray-400' : 'text-gray-700'}>
                      <td className="py-1.5 pr-4">{row.name || <span className="italic">—</span>}</td>
                      <td className="py-1.5 pr-4">
                        {row.group?.name && row.group.name.toLowerCase() !== row.groupName?.toLowerCase().replace(/\s+/g, '_')
                          ? <span><s className="text-gray-400">{row.groupName}</s> {row.group.name}</span>
                          : row.groupName}
                      </td>
                      <td className="py-1.5 pr-4">{row.partyName || <span className="italic text-gray-300">—</span>}</td>
                      <td className="py-1.5 pr-4">{row.phones.length ? row.phones.join(', ') : <span className="italic text-gray-300">none</span>}</td>
                      <td className="py-1.5">
                        {row.error
                          ? <span className="text-red-500">{row.error}</span>
                          : row.warning
                            ? <span className="text-amber-600" title={row.warning}>✓ {row.warning}</span>
                            : <span className="text-green-600">✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {importResult && (
            <div className={`text-xs p-3 rounded ${importResult.errors.length ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
              <p>{importResult.ok} guest{importResult.ok !== 1 ? 's' : ''} imported successfully.</p>
              {importResult.errors.map((e, i) => <p key={i} className="mt-0.5 text-red-600">{e}</p>)}
            </div>
          )}

          {importPreview.some(r => !r.error) && (
            <div className="flex gap-2">
              <Btn variant="primary" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing…' : `Import ${importPreview.filter(r => !r.error).length} valid guest${importPreview.filter(r => !r.error).length !== 1 ? 's' : ''}`}
              </Btn>
              <Btn variant="secondary" onClick={() => { setImportPreview([]); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                Clear
              </Btn>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-800">New guest</p>
          <GuestFormFields form={addForm} onChange={setAddForm} groups={groups} events={events} showPhones partyGroupMap={partyGroupMap} />
          <div className="flex gap-2">
            <Btn type="submit" variant="primary">Add guest</Btn>
            <Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Group</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Party</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Events</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  {search.trim() ? 'No guests match your search.' : 'No guests yet.'}
                </td>
              </tr>
            )}
            {filteredGuests.map((guest, i) => {
              const prev = filteredGuests[i - 1]
              const partyChanged = i > 0 && (prev?.party_name ?? null) !== (guest.party_name ?? null)
              const groupBreakClass = partyChanged ? 'border-t-2 border-t-gray-200' : ''
              return (
              <Fragment key={guest.id}>
                {editingId === guest.id ? (
                  <tr className={groupBreakClass}>
                    <td colSpan={6} className="px-4 py-4">
                      <form onSubmit={handleUpdate} className="space-y-3">
                        <GuestFormFields form={editForm} onChange={setEditForm} groups={groups} events={events} showPhones partyGroupMap={partyGroupMap} />
                        <div className="flex gap-2">
                          <Btn type="submit" variant="primary">Save</Btn>
                          <Btn variant="secondary" onClick={() => setEditingId(null)}>Cancel</Btn>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr
                    className={`hover:bg-gray-50 cursor-pointer ${groupBreakClass}`}
                    onClick={() => setExpandedIds(prev => {
                      const next = new Set(prev)
                      next.has(guest.id) ? next.delete(guest.id) : next.add(guest.id)
                      return next
                    })}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{groupLabel(guest.group.name)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{guest.party_name || <span className="text-gray-300 italic">—</span>}</td>
                    <td className="px-4 py-3 text-xs">
                      {(() => {
                        const overridden = guest.events_override?.length > 0
                        const slugs = overridden ? guest.events_override : (guest.group.invited_events ?? [])
                        return (
                          <span className={overridden ? 'text-gray-700' : 'text-gray-400'}>
                            {slugs.join(', ')}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {respondedSet.has(guest.id)
                        ? <span className="inline-block px-2 py-0.5 rounded bg-green-50 text-green-700 font-medium">Responded</span>
                        : <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Btn variant="ghost" onClick={e => { e.stopPropagation(); startEdit(guest) }}>Edit</Btn>
                      <Btn variant="danger" onClick={e => { e.stopPropagation(); handleDelete(guest.id) }} className="ml-2">Delete</Btn>
                    </td>
                  </tr>
                )}

                {expandedIds.has(guest.id) && editingId !== guest.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {guest.phones.length === 0 && (
                          <span className="text-xs text-gray-400">No phone numbers yet</span>
                        )}
                        {guest.phones.map(p => (
                          <span key={p.id} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 font-mono">
                            {p.phone}
                            <button
                              onClick={() => handleDeletePhone(p.id)}
                              className="text-gray-400 hover:text-red-500 ml-1 leading-none"
                              aria-label="Remove phone"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="tel"
                          placeholder="Add phone (any format)"
                          value={phoneInputs[guest.id] ?? ''}
                          onChange={e => setPhoneInputs(prev => ({ ...prev, [guest.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhone(guest.id) } }}
                          className="text-xs border border-gray-300 rounded px-2 py-1.5 w-52 focus:outline-none focus:ring-1 focus:ring-rose-300 font-mono"
                        />
                        <Btn variant="ghost" onClick={() => handleAddPhone(guest.id)}>Add</Btn>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
