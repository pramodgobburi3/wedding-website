// Phone helpers live in src/lib/phone.js (shared with the public RSVP form).
// Re-exported here so existing admin imports keep working.
export { normalizePhone, isInternationalPhone } from '../../lib/phone'

export function groupLabel(name) {
  return name.replace(/_/g, ' ')
}
