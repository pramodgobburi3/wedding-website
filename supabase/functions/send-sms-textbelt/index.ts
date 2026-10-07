// Supabase Edge Function — send an SMS via Textbelt's simple HTTP API.
//
// Two invocation paths are accepted:
//
//   1. DB trigger (server-to-server, via pg_net):
//        Headers: x-internal-secret: <INTERNAL_SECRET>
//        Body:    { "to": "+15551234567", "body": "Hello!" }
//
//   2. Admin browser (broadcast UI):
//        Headers: Authorization: Bearer <supabase-admin-jwt>
//        Body:    { "to": "+15551234567", "body": "Hello!" }
//
//      Any authenticated Supabase user is treated as an admin (the only
//      sign-in path on this site is the admin login).
//
// Required secrets:
//   TEXTBELT_API_KEY — your Textbelt key. Use "textbelt" for the free
//                      1-per-day test key while developing.
//   INTERNAL_SECRET  — shared secret for the DB-trigger path.
//   SUPABASE_URL     — auto-injected by Supabase, used to verify the admin JWT.
//   SUPABASE_ANON_KEY — auto-injected by Supabase, used to verify the admin JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TEXTBELT_API_KEY   = Deno.env.get('TEXTBELT_API_KEY')
const INTERNAL_SECRET    = Deno.env.get('INTERNAL_SECRET')
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY  = Deno.env.get('SUPABASE_ANON_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
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

async function isAdminCaller(req: Request): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  const auth = req.headers.get('authorization') ?? ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return false
  const token = m[1]
  // Reject obvious self-impersonation with the anon key alone.
  if (token === SUPABASE_ANON_KEY) return false
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return false
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  if (!TEXTBELT_API_KEY || !INTERNAL_SECRET) {
    return json({ error: 'not_configured' }, 500)
  }

  const internalOk = req.headers.get('x-internal-secret') === INTERNAL_SECRET
  const adminOk    = internalOk ? false : await isAdminCaller(req)

  if (!internalOk && !adminOk) {
    return json({ error: 'unauthorized' }, 401)
  }

  let payload: { to?: string; body?: string; action?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  // Quota check — returns Textbelt credits remaining for the configured key
  // without spending a send. Used by the Broadcast UI for pre-flight checks.
  if (payload.action === 'quota') {
    const res = await fetch(`https://textbelt.com/quota/${TEXTBELT_API_KEY}`)
    const data = await res.json().catch(() => ({} as Record<string, unknown>))
    if (!res.ok || data?.success !== true) {
      return json({
        ok:    false,
        error: data?.error ?? 'textbelt_error',
      }, res.ok ? 502 : res.status)
    }
    return json({ ok: true, quotaRemaining: data.quotaRemaining })
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
