// Strip formatting and country code from a phone number, returning the
// 10-digit local form. Country codes handled:
//   - any "+XX..." prefix when total digits > 10  → keep last 10
//   - 11-digit "1XXXXXXXXXX" (US/Canada, no +)    → drop the 1
//   - 12+-digit "91XXXXXXXXXX" (India, no +)       → drop the 91
export function normalizePhone(raw) {
  const trimmed = (raw ?? '').trim()
  const digits  = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+') && digits.length > 10) return digits.slice(-10)
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length > 10 && digits.startsWith('44')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits
}

// True when the raw input clearly used India's country code (91 / +91) and
// has more than 10 digits in total. We track these as international so the
// hosts know which guests are abroad.
export function isInternationalPhone(raw) {
  if (!raw) return false
  const trimmed = raw.trim()
  const digits  = trimmed.replace(/\D/g, '')
  if (digits.length <= 10) return false
  if (trimmed.startsWith('+91')) return true
  if (digits.startsWith('91'))   return true
  if (digits.startsWith('44')) return true
  return false
}

export function groupLabel(name) {
  return name.replace(/_/g, ' ')
}
