import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { groupLabel } from '../lib/utils'
import { Btn, EventCheckboxes } from '../components/ui'

export default function GroupsView() {
  const [groups, setGroups]         = useState([])
  const [events, setEvents]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [editingId, setEditingId]   = useState(null)
  const [editEvents, setEditEvents] = useState([])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

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
    const { error } = await supabase.from('groups').update({ invited_events: editEvents }).eq('id', id)
    if (error) setError(error.message)
    setEditingId(null)
    setSaving(false)
    load()
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="space-y-3 max-w-2xl">
      {error && <p className="text-xs text-red-500">{error}</p>}
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
              <Btn variant="ghost" onClick={() => { setEditingId(group.id); setEditEvents([...group.invited_events]) }}>
                Edit events
              </Btn>
            )}
          </div>
          {editingId === group.id ? (
            <EventCheckboxes events={events} value={editEvents} onChange={setEditEvents} />
          ) : (
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
          )}
        </div>
      ))}
    </div>
  )
}
