export function formatCurrency(value, { showSign = false } = {}) {
  const num = Number(value) || 0
  const sign = showSign && num > 0 ? '+' : ''
  return `${num < 0 ? '-' : sign}$${Math.abs(num).toFixed(2)}`
}

export function formatPercent(value, decimals = 1) {
  const num = Number(value) || 0
  return `${num.toFixed(decimals)}%`
}

export function formatNumber(value, decimals = 2) {
  const num = Number(value) || 0
  return num.toFixed(decimals)
}

export function formatPips(value, decimals = 1) {
  const num = Number(value) || 0
  return `${num.toFixed(decimals)} pips`
}

export function formatRR(rr) {
  const num = Number(rr) || 0
  return `1 : ${num.toFixed(2)}`
}

export function pnlColorClass(value) {
  const num = Number(value) || 0
  if (num > 0) return 'text-profit'
  if (num < 0) return 'text-loss'
  return 'text-text-dim'
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function todayISO(date = new Date()) {
  const d = date
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** ISO 8601 week number, formatted as YYYY-WNN. */
export function currentWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/** Start and end Date objects for the calendar day containing `date`. */
export function dayRange(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/** Start (Mon) and end (Sun) Date objects for the week containing `date`. */
export function weekRange(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() || 7
  const start = new Date(d)
  start.setDate(d.getDate() - day + 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/** Formatted as YYYY-MM. */
export function currentMonthId(date = new Date()) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

export function monthIdLabel(monthId) {
  if (!monthId) return ''
  const [yyyy, mm] = monthId.split('-')
  const d = new Date(Number(yyyy), Number(mm) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Start and end Date objects for the calendar month containing `date`. */
export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function pairLabel(pairKey) {
  if (!pairKey || pairKey.length !== 6) return pairKey
  return `${pairKey.slice(0, 3)}/${pairKey.slice(3)}`
}
