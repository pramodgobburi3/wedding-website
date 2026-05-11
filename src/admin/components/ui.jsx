export function Btn({ onClick, type = 'button', variant = 'primary', disabled, children, className = '' }) {
  const base = 'text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-rose-400 hover:bg-rose-500 text-white',
    secondary: 'text-gray-500 hover:text-gray-700',
    danger:    'text-red-400 hover:text-red-600',
    ghost:     'text-blue-500 hover:text-blue-700',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Input({ label, hint, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-gray-600 mb-1">
          {label} {hint && <span className="text-gray-400">{hint}</span>}
        </label>
      )}
      <input
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
        {...props}
      />
    </div>
  )
}

// events: [{ slug, label }] — driven by the events table, not hardcoded
export function EventCheckboxes({ events = [], value = [], onChange }) {
  function toggle(slug) {
    onChange(value.includes(slug) ? value.filter(s => s !== slug) : [...value, slug])
  }
  return (
    <div className="flex flex-wrap gap-3 mt-1">
      {events.map(event => (
        <label key={event.slug} className="flex items-center gap-1 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.includes(event.slug)}
            onChange={() => toggle(event.slug)}
            className="rounded accent-rose-400"
          />
          {event.label}
        </label>
      ))}
    </div>
  )
}
