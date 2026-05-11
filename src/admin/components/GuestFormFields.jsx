import { Input, EventCheckboxes } from './ui'
import { groupLabel } from '../lib/utils'

export default function GuestFormFields({ form, onChange, groups, events = [], showPhones = false }) {
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
          <label className="block text-xs text-gray-600 mb-1">Group</label>
          <select
            required
            value={form.group_id}
            onChange={e => onChange({ ...form, group_id: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
          >
            <option value="">Select group</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{groupLabel(g.name)}</option>
            ))}
          </select>
        </div>
      </div>

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
