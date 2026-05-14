export function parseCSVLine(line) {
  const fields = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(field.trim())
      field = ''
    } else {
      field += ch
    }
  }
  fields.push(field.trim())
  return fields
}

function escapeField(value) {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// columns: [{ label, value: row => string | string }] (string key = pluck row[key])
export function toCSV(columns, rows) {
  const cols = columns.map(c => typeof c === 'string' ? { label: c, value: r => r[c] } : c)
  const header = cols.map(c => escapeField(c.label)).join(',')
  const body = rows.map(row =>
    cols.map(c => escapeField(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(',')
  ).join('\n')
  return rows.length === 0 ? header + '\n' : header + '\n' + body + '\n'
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseCSVLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}
