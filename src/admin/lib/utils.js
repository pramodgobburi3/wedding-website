export function normalizePhone(raw) {
  return raw.replace(/\D/g, '')
}

export function groupLabel(name) {
  return name.replace(/_/g, ' ')
}
