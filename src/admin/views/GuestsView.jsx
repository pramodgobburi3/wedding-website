import { useState, useEffect, Fragment, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { BLANK_GUEST } from '../lib/constants'
import { normalizePhone, groupLabel } from '../lib/utils'
import { Btn } from '../components/ui'
import GuestFormFields from '../components/GuestFormFields'

function parseCSVLine(line) {
  const fields = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(field.trim())
      field = ''
    } else {
      field += ch
    }
  }
  fields.push(field.trim())
  return fields
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseCSVLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

function validateRows(rows, groups) {
  return rows.map(row => {
    const name = row.name?.trim()
    const normalizedInput = row.group?.toLowerCase().trim().replace(/\s+/g, '_')
    const group = groups.find(g => g.name.toLowerCase() === normalizedInput)
    const phones = (row.phones ?? '').split(',').map(normalizePhone).filter(Boolean)
    let error = null
    if (!name) error = 'Missing name'
    else if (!group) error = `Unknown group "${row.group}"`
    return { name, groupName: row.group?.trim(), group, phones, error }
  })
}

export default function GuestsView() {
  const [guests, setGuests]           = useState([])
  const [groups, setGroups]           = useState([])
  const [events, setEvents]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [expandedId, setExpandedId]   = useState(null)
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
  const fileInputRef                  = useRef(null)

  async function load() {
    const [{ data: g, error: ge }, { data: grps }, { data: evts }] = await Promise.all([
      supabase
        .from('guests')
        .select('*, group:groups(id, name), phones:guest_phones(id, phone)')
        .order('name'),
      supabase.from('groups').select('id, name').order('name'),
      supabase.from('events').select('slug, label').order('sort_order'),
    ])
    if (ge) setError(ge.message)
    setGuests(g ?? [])
    setGroups(grps ?? [])
    setEvents(evts ?? [])
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
    if (expandedId === id) setExpandedId(null)
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
      setImportPreview(validateRows(rows, groups))
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const valid = importPreview.filter(r => !r.error)
    setImporting(true)

    try {
      // Bulk insert all guests in one request, get back IDs in insertion order
      const { data: insertedGuests, error: gErr } = await supabase
        .from('guests')
        .insert(valid.map(row => ({ name: row.name, group_id: row.group.id })))
        .select('id')
      if (gErr) throw gErr

      // Build phone rows using the returned IDs (order matches insertion order)
      const phoneRows = insertedGuests.flatMap((guest, i) =>
        valid[i].phones.map(phone => ({ guest_id: guest.id, phone }))
      )

      // Bulk insert all phones in one request
      if (phoneRows.length) {
        const { error: pErr } = await supabase.from('guest_phones').insert(phoneRows)
        if (pErr) throw pErr
      }

      setImportResult({ ok: insertedGuests.length, errors: [] })
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
    setExpandedId(guest.id)
    setEditForm({
      name:            guest.name,
      group_id:        guest.group.id,
      events_override: guest.events_override ?? [],
      phones:          guest.phones.map(p => p.phone).join(', '),
    })
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{guests.length} guests</p>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => { setShowImport(v => !v); setImportPreview([]); setImportResult(null) }}>
            Import CSV
          </Btn>
          <Btn variant="primary" onClick={() => setShowAdd(v => !v)}>+ Add guest</Btn>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {showImport && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Import guests from CSV</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Required columns: <span className="font-mono">name, group, phones</span> — phones can be comma-separated inside quotes.
                Group names match case-insensitively (e.g. "Family Friends" → family_friends).
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
                    <th className="py-1.5 pr-4 font-medium">Phones</th>
                    <th className="py-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {importPreview.map((row, i) => (
                    <tr key={i} className={row.error ? 'text-gray-400' : 'text-gray-700'}>
                      <td className="py-1.5 pr-4">{row.name || <span className="italic">—</span>}</td>
                      <td className="py-1.5 pr-4">{row.groupName}</td>
                      <td className="py-1.5 pr-4">{row.phones.length ? row.phones.join(', ') : <span className="italic text-gray-300">none</span>}</td>
                      <td className="py-1.5">
                        {row.error
                          ? <span className="text-red-500">{row.error}</span>
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
          <GuestFormFields form={addForm} onChange={setAddForm} groups={groups} events={events} showPhones />
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
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Events</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phones</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {guests.map(guest => (
              <Fragment key={guest.id}>
                {editingId === guest.id ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4">
                      <form onSubmit={handleUpdate} className="space-y-3">
                        <GuestFormFields form={editForm} onChange={setEditForm} groups={groups} events={events} showPhones />
                        <div className="flex gap-2">
                          <Btn type="submit" variant="primary">Save</Btn>
                          <Btn variant="secondary" onClick={() => setEditingId(null)}>Cancel</Btn>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedId(v => v === guest.id ? null : guest.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{groupLabel(guest.group.name)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {guest.events_override?.length
                        ? <span className="text-gray-700">{guest.events_override.join(', ')}</span>
                        : <span className="italic">from group</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{guest.phones.length}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Btn variant="ghost" onClick={e => { e.stopPropagation(); startEdit(guest) }}>Edit</Btn>
                      <Btn variant="danger" onClick={e => { e.stopPropagation(); handleDelete(guest.id) }} className="ml-2">Delete</Btn>
                    </td>
                  </tr>
                )}

                {expandedId === guest.id && editingId !== guest.id && (
                  <tr>
                    <td colSpan={5} className="px-6 py-3 bg-gray-50 border-t border-gray-100">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
