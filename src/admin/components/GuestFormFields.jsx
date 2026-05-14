import { useEffect } from 'react'
import { Input, EventCheckboxes } from './ui'
import { groupLabel } from '../lib/utils'

// partyGroupMap: { [party_name]: group_id } built from existing guests so that
// when the admin types a party_name that already exists, we lock the group to
// match the rest of the party. Pass an empty object {} to disable the behavior.
export default function GuestFormFields({ form, onChange, groups, events = [], showPhones = false, partyGroupMap = {} }) {
  const partyKey       = form.party_name?.trim() ?? ''
  const lockedGroupId  = partyKey ? partyGroupMap[partyKey] : null
  const partyLocked    = !!lockedGroupId
  const lockedGroup    = partyLocked ? groups.find(g => g.id === lockedGroupId) : null

  // When the typed party_name matches an existing party, force the group to
  // match — admins can't accidentally split a party across groups.
  useEffect(() => {
    if (lockedGroupId && form.group_id !== lockedGroupId) {
      onChange({ ...form, group_id: lockedGroupId })
    }
  }, [lockedGroupId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Name"
          type="text"
          required
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
        />
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Group {partyLocked && <span className="text-gray-400">(locked to party)</span>}
          </label>
          <select
            required
            disabled={partyLocked}
            value={form.group_id}
            onChange={e => onChange({ ...form, group_id: e.target.value })}
            className={`w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300 ${partyLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
          >
            <option value="">Select group</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{groupLabel(g.name)}</option>
            ))}
          </select>
          {partyLocked && lockedGroup && (
            <p className="text-[10px] text-gray-400 mt-1">
              Other members of <span className="font-medium">{partyKey}</span> are in {groupLabel(lockedGroup.name)}.
            </p>
          )}
        </div>
      </div>

      <Input
        label="Party name"
        hint="(optional — guests sharing a party name RSVP together)"
        type="text"
        placeholder="e.g. Smith Family"
        value={form.party_name ?? ''}
        onChange={e => onChange({ ...form, party_name: e.target.value })}
      />

      {showPhones && (
        <Input
          label="Phone numbers"
          hint="(comma-separated)"
          type="text"
          placeholder="14155551234, 14155559876"
          value={form.phones}
          onChange={e => onChange({ ...form, phones: e.target.value })}
        />
      )}

      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Event override <span className="text-gray-400">(leave all unchecked to inherit from group)</span>
        </label>
        <EventCheckboxes
          events={events}
          value={form.events_override ?? []}
          onChange={v => onChange({ ...form, events_override: v })}
        />
      </div>
    </div>
  )
}
