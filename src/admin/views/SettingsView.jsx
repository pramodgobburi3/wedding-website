import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Btn } from '../components/ui'

function formatLong(iso) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SettingsView() {
  const [deadline, setDeadline] = useState('')   // current saved value
  const [draft, setDraft]       = useState('')   // editor value
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [savedNotice, setSavedNotice] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error: loadErr } = await supabase
      .from('app_settings').select('value').eq('key', 'rsvp_deadline').maybeSingle()
    if (loadErr) setError(loadErr.message)
    const val = data?.value ?? ''
    setDeadline(val || '')
    setDraft(val || '')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSavedNotice(false)
    const value = draft ? draft : null
    const { error: upErr } = await supabase
      .from('app_settings')
      .upsert({ key: 'rsvp_deadline', value }, { onConflict: 'key' })
    setSaving(false)
    if (upErr) { setError(upErr.message); return }
    setDeadline(value ?? '')
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2500)
  }

  function clearDeadline() {
    setDraft('')
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  const dirty = (draft || '') !== (deadline || '')
  const passed = deadline && deadline < todayISO()

  return (
    <div className="max-w-xl space-y-6">
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-800 mb-1">RSVP deadline</p>
        <p className="text-xs text-gray-500 mb-4">
          The last day guests can submit an RSVP. After this date the form
          shows a "RSVPs Are Closed" message and the server refuses new
          submissions. Leave blank to allow RSVPs indefinitely.
        </p>

        <form onSubmit={save} className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Deadline date</label>
              <input
                type="date"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
              />
            </div>
            <Btn type="submit" variant="primary" disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save'}
            </Btn>
            {draft && (
              <Btn variant="secondary" onClick={clearDeadline}>Clear</Btn>
            )}
            {savedNotice && (
              <span className="text-xs text-emerald-500">Saved.</span>
            )}
          </div>

          {deadline ? (
            <p className="text-xs text-gray-500">
              Currently set to <span className="font-medium text-gray-700">{formatLong(deadline)}</span>
              {passed && <span className="ml-2 text-amber-600">· this date has already passed, RSVPs are closed</span>}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No deadline set — RSVPs are open indefinitely.</p>
          )}
        </form>
      </div>
    </div>
  )
}
