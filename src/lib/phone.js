// Shared phone helpers used by both the public RSVP form and the admin tools.
// Kept in src/lib (neutral) rather than admin/lib so the public bundle doesn't
// have to depend on admin code.

// Strip formatting and country code from a phone number, returning the
// 10-digit local form. Country codes handled:
//   - any "+XX..." prefix when total digits > 10  → keep last 10
//   - 12+-digit "91XXXXXXXXXX" (India, no +)       → drop the 91
//   - 12+-digit "44XXXXXXXXXX" (UK, no +)          → drop the 44
//   - 12+-digit "64XXXXXXXXXX" (New Zealand, no +) → drop the 64
//   - 11-digit "1XXXXXXXXXX" (US/Canada, no +)     → drop the 1
export function normalizePhone(raw) {
  const trimmed = (raw ?? '').trim()
  const digits  = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+') && digits.length > 10) return digits.slice(-10)
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length > 10 && digits.startsWith('44')) return digits.slice(2)
  if (digits.length > 10 && digits.startsWith('64')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits
}

// True when the raw input clearly used a tracked international country code
// (India 91 / UK 44 / New Zealand 64, with or without +) and has more than 10
// digits in total. We track these so the hosts know which guests are abroad.
export function isInternationalPhone(raw) {
  if (!raw) return false
  const trimmed = raw.trim()
  const digits  = trimmed.replace(/\D/g, '')
  if (digits.length <= 10) return false
  if (digits.startsWith('91'))   return true
  if (digits.startsWith('44'))   return true
  if (digits.startsWith('64'))   return true
  return false
}
