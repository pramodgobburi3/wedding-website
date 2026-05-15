// Supabase Edge Function — send an SMS via Twilio.
//
// Invocation:
//   POST <project>.functions.supabase.co/send-sms
//   Headers: Authorization: Bearer <supabase-jwt-or-service-role>
//   Body:    { "to": "+15551234567", "body": "Hello!" }
//
// Required secrets (set with: `supabase secrets set KEY=value`):
//   TWILIO_ACCOUNT_SID    — starts with "AC..."
//   TWILIO_AUTH_TOKEN     — Twilio auth token
//   TWILIO_FROM_NUMBER    — E.164 sender, e.g. "+15551234567"  (or a messaging service SID via TWILIO_MESSAGING_SERVICE_SID)
//   TWILIO_MESSAGING_SERVICE_SID — optional, used if TWILIO_FROM_NUMBER is not set
//
// JWT verification is left ON (default). Callers must send a valid Supabase
// JWT — the anon key, an authenticated user session, or the service-role key
// (used by DB triggers via pg_net).

/// <reference lib="deno.ns" />

const TWILIO_ACCOUNT_SID  = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN   = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_FROM_NUMBER  = Deno.env.get('TWILIO_FROM_NUMBER')
const TWILIO_MSG_SVC_SID  = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

function normalizeE164(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Already E.164
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed
  // Bare digits — assume US if 10 digits, prefix '+' otherwise
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`
  return null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || (!TWILIO_FROM_NUMBER && !TWILIO_MSG_SVC_SID)) {
    return json({ error: 'twilio_not_configured' }, 500)
  }

  let payload: { to?: string; body?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const to   = payload.to?.toString() ?? ''
  const body = payload.body?.toString() ?? ''

  const toE164 = normalizeE164(to)
  if (!toE164) {
    return json({ error: 'invalid_to' }, 400)
  }
  if (!body || body.length > 1600) {
    return json({ error: 'invalid_body' }, 400)
  }

  const form = new URLSearchParams()
  form.set('To', toE164)
  form.set('Body', body)
  if (TWILIO_MSG_SVC_SID) {
    form.set('MessagingServiceSid', TWILIO_MSG_SVC_SID)
  } else {
    form.set('From', TWILIO_FROM_NUMBER!)
  }

  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
  const url  = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return json({
      ok:      false,
      status:  res.status,
      code:    data?.code ?? null,
      message: data?.message ?? 'twilio_error',
    }, res.status)
  }

  return json({
    ok:     true,
    sid:    data.sid,
    status: data.status,
    to:     data.to,
  })
})
