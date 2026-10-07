import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { groupLabel } from '../lib/utils'
import { Btn } from './ui'

const RSVP_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'responded', label: 'Responded' },
  { key: 'pending',   label: 'Pending' },
]

// Same logic used in GuestsView to figure out which guest_ids have RSVP'd.
function buildRespondedSet(responses) {
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
}

export default function BroadcastSection() {
  const [guests, setGuests]               = useState([])
  const [groups, setGroups]               = useState([])
  const [responses, setResponses]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [loadError, setLoadError]         = useState(null)

  const [selectedGroupIds, setSelectedGroupIds] = useState(() => new Set())
  const [rsvpFilter, setRsvpFilter]       = useState('all')
  const [message, setMessage]             = useState('')

  const [confirming, setConfirming]       = useState(false)
  const [sending, setSending]             = useState(false)
  const [progress, setProgress]           = useState({ sent: 0, failed: 0 })
  const [results, setResults]             = useState(null) // { sent, failed, errors:[{phone,error}] }

  const [quota, setQuota]                 = useState(null) // number | null
  const [quotaError, setQuotaError]       = useState(null)
  const [quotaLoading, setQuotaLoading]   = useState(true)

  async function refreshQuota() {
    setQuotaLoading(true)
    setQuotaError(null)
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-textbelt', {
        body: { action: 'quota' },
      })
      if (error || !data?.ok) {
        setQuotaError(data?.error ?? error?.message ?? 'unknown_error')
        setQuota(null)
      } else {
        setQuota(typeof data.quotaRemaining === 'number' ? data.quotaRemaining : null)
      }
    } catch (err) {
      setQuotaError(err.message ?? 'request_failed')
      setQuota(null)
    } finally {
      setQuotaLoading(false)
    }
  }

  useEffect(() => { refreshQuota() }, [])

  useEffect(() => {
    async function load() {
      const [
        { data: g, error: ge },
        { data: grps, error: groupErr },
        { data: resp, error: respErr },
      ] = await Promise.all([
        supabase
          .from('guests')
          .select('id, name, group_id, phones:guest_phones(phone, is_international)'),
        supabase.from('groups').select('id, name').order('name'),
        supabase.from('rsvp_responses').select('guest_id, member_attendance'),
      ])
      const err = ge || groupErr || respErr
      if (err) setLoadError(err.message)
      setGuests(g ?? [])
      setGroups(grps ?? [])
      setResponses(resp ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const respondedSet = useMemo(() => buildRespondedSet(responses), [responses])

  // Guests matching the current filters.
  const matchedGuests = useMemo(() => {
    return guests.filter(g => {
      if (selectedGroupIds.size > 0 && !selectedGroupIds.has(g.group_id)) return false
      const responded = respondedSet.has(g.id)
      if (rsvpFilter === 'responded' && !responded) return false
      if (rsvpFilter === 'pending'   &&  responded) return false
      return true
    })
  }, [guests, selectedGroupIds, rsvpFilter, respondedSet])

  // Deduped list of US (non-international) phones to actually send to.
  const { phones, skippedIntlGuests, guestsWithoutPhone } = useMemo(() => {
    const seen = new Set()
    const phones = []
    let skippedIntlGuests = 0
    let guestsWithoutPhone = 0
    matchedGuests.forEach(g => {
      const allPhones = g.phones ?? []
      if (allPhones.length === 0) { guestsWithoutPhone += 1; return }
      const usPhones = allPhones.filter(p => !p.is_international)
      if (usPhones.length === 0) { skippedIntlGuests += 1; return }
      usPhones.forEach(p => {
        if (seen.has(p.phone)) return
        seen.add(p.phone)
        phones.push(p.phone)
      })
    })
    return { phones, skippedIntlGuests, guestsWithoutPhone }
  }, [matchedGuests])

  function toggleGroup(id) {
    setSelectedGroupIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function reset() {
    setMessage('')
    setSelectedGroupIds(new Set())
    setRsvpFilter('all')
    setResults(null)
    setProgress({ sent: 0, failed: 0 })
  }

  async function handleSend() {
    setSending(true)
    setConfirming(false)
    setResults(null)
    setProgress({ sent: 0, failed: 0 })
    const errors = []
    let sent = 0
    let failed = 0

    for (const phone of phones) {
      try {
        const { data, error } = await supabase.functions.invoke('send-sms-textbelt', {
          body: { to: phone, body: message },
        })
        if (error || !data?.ok) {
          failed += 1
          errors.push({ phone, error: data?.error ?? error?.message ?? 'unknown_error' })
        } else {
          sent += 1
        }
      } catch (err) {
        failed += 1
        errors.push({ phone, error: err.message ?? 'request_failed' })
      }
      setProgress({ sent, failed })
    }

    setSending(false)
    setResults({ sent, failed, errors })
    refreshQuota()
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-800 mb-1">Broadcast SMS</p>
        <p className="text-xs text-gray-400">Loading guest data…</p>
      </div>
    )
  }

  const messageTrimmed = message.trim()
  const charCount      = message.length
  const overLimit      = charCount > 1600
  const quotaShort     = typeof quota === 'number' && quota < phones.length
  const canSend        = phones.length > 0 && messageTrimmed.length > 0 && !overLimit && !quotaShort

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-sm font-medium text-gray-800 mb-1">Broadcast SMS</p>
      <p className="text-xs text-gray-500 mb-4">
        Send a text to guests matching the filters below. Skips international numbers.
      </p>

      {loadError && <p className="text-xs text-red-500 mb-3">{loadError}</p>}

      {/* Group filter */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Groups</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedGroupIds(new Set())}
            className={`px-3 py-1 rounded text-xs border transition-colors ${
              selectedGroupIds.size === 0
                ? 'border-rose-400 bg-rose-50 text-rose-600'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All groups
          </button>
          {groups.map(grp => {
            const active = selectedGroupIds.has(grp.id)
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => toggleGroup(grp.id)}
                className={`px-3 py-1 rounded text-xs border capitalize transition-colors ${
                  active
                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {groupLabel(grp.name)}
              </button>
            )
          })}
        </div>
      </div>

      {/* RSVP status filter */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">RSVP status</p>
        <div className="flex flex-wrap gap-2">
          {RSVP_FILTERS.map(f => {
            const active = rsvpFilter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setRsvpFilter(f.key)}
                className={`px-3 py-1 rounded text-xs border transition-colors ${
                  active
                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recipient summary */}
      <div className="mb-4 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded p-3 space-y-0.5">
        <p>
          <span className="font-medium text-gray-800">{phones.length}</span>{' '}
          phone{phones.length === 1 ? '' : 's'} will receive this message
          {' '}(<span className="text-gray-500">{matchedGuests.length} guest{matchedGuests.length === 1 ? '' : 's'} matched</span>).
        </p>
        {skippedIntlGuests > 0 && (
          <p className="text-amber-600">
            Skipping {skippedIntlGuests} guest{skippedIntlGuests === 1 ? '' : 's'} with only international numbers.
          </p>
        )}
        {guestsWithoutPhone > 0 && (
          <p className="text-gray-400">
            {guestsWithoutPhone} matched guest{guestsWithoutPhone === 1 ? ' has' : 's have'} no phone on file.
          </p>
        )}
        <p className="flex items-center gap-2 pt-1">
          {quotaLoading ? (
            <span className="text-gray-400">Checking Textbelt quota…</span>
          ) : quotaError ? (
            <span className="text-red-500">Couldn't fetch quota ({quotaError}).</span>
          ) : (
            <span className={quotaShort ? 'text-red-600 font-medium' : 'text-gray-500'}>
              {quota} Textbelt credit{quota === 1 ? '' : 's'} remaining
              {quotaShort && ` — not enough for ${phones.length} sends`}
            </span>
          )}
          <button
            type="button"
            onClick={refreshQuota}
            disabled={quotaLoading || sending}
            className="text-rose-500 hover:text-rose-600 disabled:opacity-50"
          >
            refresh
          </button>
        </p>
      </div>

      {/* Message */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder="Hi! Quick reminder that…"
          disabled={sending}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300 disabled:bg-gray-50"
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount} / 1600 characters
          </span>
          {charCount > 160 && !overLimit && (
            <span className="text-xs text-gray-400">
              {Math.ceil(charCount / 153)} SMS segments
            </span>
          )}
        </div>
      </div>

      {/* Send / confirm / progress / results */}
      {sending ? (
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            Sending… <span className="font-medium">{progress.sent + progress.failed}</span> / {phones.length}
            {progress.failed > 0 && <span className="ml-2 text-red-500">({progress.failed} failed)</span>}
          </p>
          <div className="h-1.5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full bg-rose-400 transition-all"
              style={{ width: `${((progress.sent + progress.failed) / Math.max(phones.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      ) : confirming ? (
        <div className="border border-rose-200 bg-rose-50 rounded p-3 space-y-2">
          <p className="text-xs text-rose-700">
            Send this message to <span className="font-semibold">{phones.length}</span> phone{phones.length === 1 ? '' : 's'}?
          </p>
          <div className="flex gap-2">
            <Btn variant="primary" onClick={handleSend}>Yes, send</Btn>
            <Btn variant="secondary" onClick={() => setConfirming(false)}>Cancel</Btn>
          </div>
        </div>
      ) : results ? (
        <div className="space-y-2">
          <div className={`text-xs p-3 rounded ${results.failed > 0 ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
            <p>
              Sent {results.sent} message{results.sent === 1 ? '' : 's'}.
              {results.failed > 0 && <span className="ml-1 text-red-600">{results.failed} failed.</span>}
            </p>
          </div>
          {results.errors.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">View failures</summary>
              <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-gray-600 max-h-40 overflow-y-auto">
                {results.errors.map((e, i) => (
                  <li key={i}><span className="text-gray-800">{e.phone}</span> — {e.error}</li>
                ))}
              </ul>
            </details>
          )}
          <Btn variant="secondary" onClick={reset}>Start a new broadcast</Btn>
        </div>
      ) : (
        <div className="flex gap-2">
          <Btn
            variant="primary"
            onClick={() => setConfirming(true)}
            disabled={!canSend}
          >
            Send to {phones.length} phone{phones.length === 1 ? '' : 's'}
          </Btn>
          {(message || selectedGroupIds.size > 0 || rsvpFilter !== 'all') && (
            <Btn variant="secondary" onClick={reset}>Reset</Btn>
          )}
        </div>
      )}
    </div>
  )
}
