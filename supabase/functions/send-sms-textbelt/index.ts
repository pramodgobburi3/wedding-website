// Supabase Edge Function — send an SMS via Textbelt's simple HTTP API.
//
// Invocation:
//   POST <project>.functions.supabase.co/send-sms-textbelt
//   Headers: Authorization: Bearer <supabase-jwt-or-service-role>
//   Body:    { "to": "+15551234567", "body": "Hello!" }
//
// Required secrets:
//   TEXTBELT_API_KEY — your Textbelt key. Use "textbelt" for the free
//                      1-per-day test key while developing.
//   INTERNAL_SECRET  — shared secret required in the `x-internal-secret`
//                      header. Lets us turn off Verify JWT so we can lock the
//                      function to internal callers (DB triggers) instead of
//                      anyone holding the public anon key.

const TEXTBELT_API_KEY = Deno.env.get('TEXTBELT_API_KEY')
const INTERNAL_SECRET  = Deno.env.get('INTERNAL_SECRET')

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

function normalizeE164(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed
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

  if (!TEXTBELT_API_KEY || !INTERNAL_SECRET) {
    return json({ error: 'not_configured' }, 500)
  }

  if (req.headers.get('x-internal-secret') !== INTERNAL_SECRET) {
    return json({ error: 'unauthorized' }, 401)
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
  if (!toE164) return json({ error: 'invalid_to' }, 400)
  if (!body || body.length > 1600) return json({ error: 'invalid_body' }, 400)

  const res = await fetch('https://textbelt.com/text', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      phone:   toE164,
      message: body,
      key:     TEXTBELT_API_KEY,
    }),
  })

  const data = await res.json().catch(() => ({} as Record<string, unknown>))

  if (!res.ok || data?.success !== true) {
    return json({
      ok:             false,
      status:         res.status,
      error:          data?.error ?? 'textbelt_error',
      quotaRemaining: data?.quotaRemaining ?? null,
    }, res.ok ? 502 : res.status)
  }

  return json({
    ok:             true,
    textId:         data.textId,
    quotaRemaining: data.quotaRemaining,
  })
})
