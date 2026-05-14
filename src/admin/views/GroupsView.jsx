import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { groupLabel } from '../lib/utils'
import { Btn, Input, EventCheckboxes } from '../components/ui'

function normalizeGroupName(raw) {
  return raw.toLowerCase().trim().replace(/\s+/g, '_')
}

export default function GroupsView() {
  const [groups, setGroups]         = useState([])
  const [events, setEvents]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [editingId, setEditingId]   = useState(null)
  const [editEvents, setEditEvents] = useState([])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)
  const [editTravel, setEditTravel] = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [addName, setAddName]       = useState('')
  const [addEvents, setAddEvents]   = useState([])
  const [addTravel, setAddTravel]   = useState(false)
  const [creating, setCreating]     = useState(false)

  async function load() {
    const [{ data: grps, error: ge }, { data: evts }] = await Promise.all([
      supabase.from('groups').select('*').order('name'),
      supabase.from('events').select('slug, label').order('sort_order'),
    ])
    if (ge) setError(ge.message)
    setGroups(grps ?? [])
    setEvents(evts ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(id) {
    setSaving(true)
    const { error } = await supabase
      .from('groups')
      .update({ invited_events: editEvents, travel_accommodations: editTravel })
      .eq('id', id)
    if (error) setError(error.message)
    setEditingId(null)
    setSaving(false)
    load()
  }

  async function handleDelete(group) {
    if (!window.confirm(`Delete group "${groupLabel(group.name)}"? This can't be undone.`)) return
    setError(null)
    const { error: deleteErr } = await supabase.from('groups').delete().eq('id', group.id)
    if (deleteErr) {
      const msg = deleteErr.message
      setError(/still referenced|foreign key/i.test(msg)
        ? `Cannot delete "${groupLabel(group.name)}" — there are still guests assigned to it. Reassign or delete those guests first.`
        : msg)
      return
    }
    if (editingId === group.id) setEditingId(null)
    load()
  }

  async function handleCreate(e) {
    e.preventDefault()
    const name = normalizeGroupName(addName)
    if (!name) { setError('Group name is required'); return }
    setCreating(true)
    setError(null)
    const { error: insertErr } = await supabase
      .from('groups')
      .insert({ name, invited_events: addEvents, travel_accommodations: addTravel })
    setCreating(false)
    if (insertErr) {
      setError(insertErr.message.includes('duplicate') ? `Group "${name}" already exists` : insertErr.message)
      return
    }
    setShowAdd(false)
    setAddName('')
    setAddEvents([])
    setAddTravel(false)
    load()
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        <Btn variant="primary" onClick={() => { setShowAdd(v => !v); setError(null) }}>+ Add group</Btn>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-800">New group</p>
          <Input
            label="Name"
            hint="(spaces will become underscores, e.g. 'Family Friends' → family_friends)"
            type="text"
            placeholder="e.g. family"
            value={addName}
            onChange={e => setAddName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs text-gray-600 mb-1">Invited events</label>
            <EventCheckboxes events={events} value={addEvents} onChange={setAddEvents} />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
            <input
              type="checkbox"
              checked={addTravel}
              onChange={e => setAddTravel(e.target.checked)}
              className="rounded accent-rose-400"
            />
            Eligible for travel accommodations
          </label>
          <div className="flex gap-2">
            <Btn type="submit" variant="primary" disabled={creating || !addName.trim()}>
              {creating ? 'Creating…' : 'Create group'}
            </Btn>
            <Btn variant="secondary" onClick={() => { setShowAdd(false); setAddName(''); setAddEvents([]); setAddTravel(false) }}>
              Cancel
            </Btn>
          </div>
        </form>
      )}

      {groups.map(group => (
        <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 capitalize">{groupLabel(group.name)}</h3>
            {editingId === group.id ? (
              <div className="flex gap-2">
                <Btn variant="primary" onClick={() => handleSave(group.id)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Btn>
                <Btn variant="secondary" onClick={() => setEditingId(null)}>Cancel</Btn>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => {
                  setEditingId(group.id)
                  setEditEvents([...group.invited_events])
                  setEditTravel(!!group.travel_accommodations)
                }}>
                  Edit events
                </Btn>
                <Btn variant="danger" onClick={() => handleDelete(group)}>Delete</Btn>
              </div>
            )}
          </div>
          {editingId === group.id ? (
            <div className="space-y-3">
              <EventCheckboxes events={events} value={editEvents} onChange={setEditEvents} />
              <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={editTravel}
                  onChange={e => setEditTravel(e.target.checked)}
                  className="rounded accent-rose-400"
                />
                Eligible for travel accommodations
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {events.map(event => (
                  <span
                    key={event.slug}
                    className={`text-xs px-2 py-0.5 rounded ${
                      group.invited_events.includes(event.slug)
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {event.label}
                  </span>
                ))}
              </div>
              {group.travel_accommodations && (
                <span className="inline-block text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                  Travel accommodations
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
