const TRADE_COLUMNS = [
  'date',
  'pair',
  'direction',
  'type',
  'session',
  'entry',
  'stopLoss',
  'takeProfit',
  'lotSize',
  'riskAmount',
  'riskPercent',
  'plannedRR',
  'actualRR',
  'result',
  'pnl',
  'rulesFollowed',
  'whyEntered',
  'emotions',
  'mistakes',
  'lessonsLearned',
]

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function tradesToCsv(trades) {
  const header = TRADE_COLUMNS.join(',')
  const rows = trades.map((t) => TRADE_COLUMNS.map((col) => escapeCsvValue(t[col])).join(','))
  return [header, ...rows].join('\n')
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportTradesToCsv(trades, filename = 'tradeflow-export.csv') {
  downloadCsv(filename, tradesToCsv(trades))
}
