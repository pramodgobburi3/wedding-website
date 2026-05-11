import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Btn, Input } from '../components/ui'

const BLANK_EVENT = { slug: '', label: '', event_date: '', start_time: '', sort_order: 0 }

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function formatTime(timeStr) {
  return timeStr || 'TBD'
}

function EventForm({ form, onChange, isEdit = false }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        label="Label"
        type="text"
        required
        placeholder="e.g. Wedding Ceremony"
        value={form.label}
        onChange={e => onChange({ ...form, label: e.target.value })}
      />
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Slug {isEdit && <span className="text-gray-400">(cannot change — used in group & guest event lists)</span>}
        </label>
        <input
          type="text"
          required
          readOnly={isEdit}
          placeholder="e.g. ceremony"
          value={form.slug}
          onChange={e => onChange({ ...form, slug: e.target.value })}
          className={`w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-rose-300 ${isEdit ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
        />
      </div>
      <Input
        label="Date"
        hint="(optional)"
        type="date"
        value={form.event_date ?? ''}
        onChange={e => onChange({ ...form, event_date: e.target.value || null })}
      />
      <Input
        label="Start time"
        hint="(e.g. AM, PM, 7 PM — leave empty for TBD)"
        type="text"
        placeholder="TBD"
        value={form.start_time ?? ''}
        onChange={e => onChange({ ...form, start_time: e.target.value || null })}
      />
      <Input
        label="Sort order"
        type="number"
        value={form.sort_order}
        onChange={e => onChange({ ...form, sort_order: Number(e.target.value) })}
      />
    </div>
  )
}

export default function EventsView() {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [addForm, setAddForm]     = useState(BLANK_EVENT)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm]   = useState(BLANK_EVENT)
  const [error, setError]         = useState(null)

  async function load() {
    const { data, error } = await supabase.from('events').select('*').order('sort_order')
    if (error) setError(error.message)
    setEvents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const { error } = await supabase.from('events').insert({
      slug:       addForm.slug.trim(),
      label:      addForm.label.trim(),
      event_date: addForm.event_date || null,
      start_time: addForm.start_time || null,
      sort_order: addForm.sort_order,
    })
    if (error) { setError(error.message); return }
    setShowAdd(false)
    setAddForm(BLANK_EVENT)
    load()
  }

  async function handleUpdate(e) {
    e.preventDefault()
    const { error } = await supabase.from('events').update({
      label:      editForm.label.trim(),
      event_date: editForm.event_date || null,
      start_time: editForm.start_time || null,
      sort_order: editForm.sort_order,
    }).eq('id', editingId)
    if (error) { setError(error.message); return }
    setEditingId(null)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event? Existing group and guest event lists that reference its slug will not be updated automatically.')) return
    await supabase.from('events').delete().eq('id', id)
    load()
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{events.length} events</p>
        <Btn variant="primary" onClick={() => setShowAdd(v => !v)}>+ Add event</Btn>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-800">New event</p>
          <EventForm form={addForm} onChange={setAddForm} />
          <div className="flex gap-2">
            <Btn type="submit" variant="primary">Add event</Btn>
            <Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Label</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Slug</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Time</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map(event => (
              editingId === event.id ? (
                <tr key={event.id}>
                  <td colSpan={6} className="px-4 py-4">
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <EventForm form={editForm} onChange={setEditForm} isEdit />
                      <div className="flex gap-2">
                        <Btn type="submit" variant="primary">Save</Btn>
                        <Btn variant="secondary" onClick={() => setEditingId(null)}>Cancel</Btn>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{event.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{event.label}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{event.slug}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(event.event_date)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatTime(event.start_time)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Btn variant="ghost" onClick={() => {
                      setEditingId(event.id)
                      setEditForm({
                        slug:       event.slug,
                        label:      event.label,
                        event_date: event.event_date ?? '',
                        start_time: event.start_time ?? '',
                        sort_order: event.sort_order,
                      })
                    }}>
                      Edit
                    </Btn>
                    <Btn variant="danger" onClick={() => handleDelete(event.id)} className="ml-2">Delete</Btn>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
