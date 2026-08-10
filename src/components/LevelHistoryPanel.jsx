import { useEffect, useState } from 'react'
import { History, X } from 'lucide-react'
import { fetchLevelHistoryList } from '../firebase/levelHistory'
import { useAppStore } from '../store/useAppStore'
import { PAIRS } from '../utils/calculations'
import { formatDate, formatNumber } from '../utils/formatters'
import { rangeSize } from '../utils/levelMetrics'

function HistoryTable({ records, pair, period }) {
  const decimals = PAIRS[pair]?.decimals ?? 5

  if (!records.length) {
    return <p className="text-xs text-text-dim">No {period} history recorded yet for this pair.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-dim">
            <th className="pb-2 pr-3 font-medium">{period === 'daily' ? 'Date' : 'Week'}</th>
            <th className="pb-2 pr-3 font-medium">Open</th>
            <th className="pb-2 pr-3 font-medium">High</th>
            <th className="pb-2 pr-3 font-medium">Low</th>
            <th className="pb-2 font-medium">Range</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="mono border-b border-border/50 text-text">
              <td className="py-2 pr-3 text-xs text-text-dim">
                {period === 'daily' ? formatDate(r.periodId) : r.periodId}
              </td>
              <td className="py-2 pr-3">{r.open ? formatNumber(r.open, decimals) : '—'}</td>
              <td className="py-2 pr-3 text-profit">{formatNumber(r.high, decimals)}</td>
              <td className="py-2 pr-3 text-loss">{formatNumber(r.low, decimals)}</td>
              <td className="py-2">{formatNumber(rangeSize(r.high, r.low), decimals)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LevelHistoryPanel({ pair, onClose }) {
  const currentUser = useAppStore((s) => s.user)
  const [dailyRecords, setDailyRecords] = useState([])
  const [weeklyRecords, setWeeklyRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser || !pair) return
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      fetchLevelHistoryList(currentUser.uid, pair, 'daily', 14),
      fetchLevelHistoryList(currentUser.uid, pair, 'weekly', 12),
    ])
      .then(([daily, weekly]) => {
        if (cancelled) return
        setDailyRecords(daily)
        setWeeklyRecords(weekly)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentUser, pair])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-text">
              {PAIRS[pair]?.label || pair} — Level History
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-text-dim hover:text-text">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-text-dim">Loading…</div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-loss">{error}</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">
                Daily (last {dailyRecords.length || 0})
              </h3>
              <HistoryTable records={dailyRecords} pair={pair} period="daily" />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">
                Weekly (last {weeklyRecords.length || 0})
              </h3>
              <HistoryTable records={weeklyRecords} pair={pair} period="weekly" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
