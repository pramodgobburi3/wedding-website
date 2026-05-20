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

// Accepts +E.164, 10-digit US, or 1XXXXXXXXXX → returns +E.164 or null
function normalizeE164(raw) {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return null
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`
  return null
}

export default function SettingsView() {
  // RSVP deadline
  const [deadline, setDeadline]     = useState('')
  const [deadlineDraft, setDraft]   = useState('')
  const [savingDeadline, setSavingD] = useState(false)
  const [savedDeadline, setSavedD]   = useState(false)

  // Host notification phones
  const [phones, setPhones]         = useState([])   // array of E.164 strings
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState(null)
  const [savingPhones, setSavingP]  = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  async function load() {
    setLoading(true)
    const { data, error: loadErr } = await supabase
      .from('app_settings').select('key, value')
      .in('key', ['rsvp_deadline', 'host_notification_phones'])
    if (loadErr) setError(loadErr.message)
    const byKey = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
    const dl = byKey.rsvp_deadline ?? ''
    setDeadline(dl || '')
    setDraft(dl || '')
    const ph = Array.isArray(byKey.host_notification_phones) ? byKey.host_notification_phones : []
    setPhones(ph)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveDeadline(e) {
    e.preventDefault()
    setSavingD(true)
    setError(null)
    setSavedD(false)
    const value = deadlineDraft ? deadlineDraft : null
    const { error: upErr } = await supabase
      .from('app_settings')
      .upsert({ key: 'rsvp_deadline', value }, { onConflict: 'key' })
    setSavingD(false)
    if (upErr) { setError(upErr.message); return }
    setDeadline(value ?? '')
    setSavedD(true)
    setTimeout(() => setSavedD(false), 2500)
  }

  async function savePhones(next) {
    setSavingP(true)
    setError(null)
    const { error: upErr } = await supabase
      .from('app_settings')
      .upsert({ key: 'host_notification_phones', value: next }, { onConflict: 'key' })
    setSavingP(false)
    if (upErr) { setError(upErr.message); return false }
    setPhones(next)
    return true
  }

  async function addPhone(e) {
    e.preventDefault()
    setPhoneError(null)
    const norm = normalizeE164(phoneInput)
    if (!norm) { setPhoneError('Enter a valid phone number'); return }
    if (phones.includes(norm)) { setPhoneError('That number is already in the list'); return }
    const ok = await savePhones([...phones, norm])
    if (ok) setPhoneInput('')
  }

  async function removePhone(p) {
    await savePhones(phones.filter(x => x !== p))
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  const deadlineDirty  = (deadlineDraft || '') !== (deadline || '')
  const deadlinePassed = deadline && deadline < todayISO()

  return (
    <div className="max-w-xl space-y-6">
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* RSVP deadline */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-800 mb-1">RSVP deadline</p>
        <p className="text-xs text-gray-500 mb-4">
          The last day guests can submit an RSVP. After this date the form
          shows a "RSVPs Are Closed" message and the server refuses new
          submissions. Leave blank to allow RSVPs indefinitely.
        </p>

        <form onSubmit={saveDeadline} className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Deadline date</label>
              <input
                type="date"
                value={deadlineDraft}
                onChange={e => setDraft(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
              />
            </div>
            <Btn type="submit" variant="primary" disabled={savingDeadline || !deadlineDirty}>
              {savingDeadline ? 'Saving…' : 'Save'}
            </Btn>
            {deadlineDraft && (
              <Btn variant="secondary" onClick={() => setDraft('')}>Clear</Btn>
            )}
            {savedDeadline && <span className="text-xs text-emerald-500">Saved.</span>}
          </div>

          {deadline ? (
            <p className="text-xs text-gray-500">
              Currently set to <span className="font-medium text-gray-700">{formatLong(deadline)}</span>
              {deadlinePassed && <span className="ml-2 text-amber-600">· this date has already passed, RSVPs are closed</span>}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No deadline set — RSVPs are open indefinitely.</p>
          )}
        </form>
      </div>

      {/* Host notification phones */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-800 mb-1">Host notification phones</p>
        <p className="text-xs text-gray-500 mb-4">
          Phone numbers that receive an SMS whenever a guest submits a contact
          request from the RSVP form. Add as many as you'd like.
        </p>

        {phones.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-3">No phones added yet — no notifications will be sent.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {phones.map(p => (
              <span key={p} className="inline-flex items-center gap-2 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded px-2 py-1 font-mono">
                {p}
                <button
                  onClick={() => removePhone(p)}
                  disabled={savingPhones}
                  className="text-rose-400 hover:text-red-500 leading-none disabled:opacity-50"
                  aria-label={`Remove ${p}`}
                >×</button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={addPhone} className="flex flex-wrap items-end gap-2">
          <div className="w-56">
            <label className="block text-xs text-gray-600 mb-1">Add a phone</label>
            <input
              type="tel"
              placeholder="+15551234567"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-rose-300"
            />
          </div>
          <Btn type="submit" variant="primary" disabled={savingPhones || !phoneInput.trim()}>
            {savingPhones ? 'Saving…' : 'Add'}
          </Btn>
          {phoneError && <span className="text-xs text-red-500">{phoneError}</span>}
        </form>
      </div>
    </div>
  )
}
