export function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  // International format with explicit + → strip country code, keep last 10 digits
  if (raw.trim().startsWith('+') && digits.length > 10) return digits.slice(-10)
  // US/Canada 11-digit with leading 1 (no + prefix)
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits
}

export function groupLabel(name) {
  return name.replace(/_/g, ' ')
}
