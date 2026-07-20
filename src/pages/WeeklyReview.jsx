import { useEffect, useMemo, useState } from 'react'
import { computeStats, useTrades } from '../hooks/useTrades'
import { subscribeReview, subscribeReviews, saveReview } from '../firebase/reviews'
import { useAppStore } from '../store/useAppStore'
import { currentWeekId, formatCurrency, formatPercent, formatRR, weekRange } from '../utils/formatters'

export default function WeeklyReview() {
  const currentUser = useAppStore((s) => s.user)
  const { trades } = useTrades()
  const [weekId, setWeekId] = useState(currentWeekId())
  const [saved, setSaved] = useState(null)
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)

  const [disciplineScore, setDisciplineScore] = useState(5)
  const [bestTrade, setBestTrade] = useState('')
  const [worstTrade, setWorstTrade] = useState('')
  const [focusNextWeek, setFocusNextWeek] = useState('')
  const [notes, setNotes] = useState('')

  const isCurrentWeek = weekId === currentWeekId()

  const weekTrades = useMemo(() => {
    if (!isCurrentWeek) return []
    const { start, end } = weekRange()
    return trades.filter((t) => {
      const d = new Date(t.date)
      return d >= start && d <= end
    })
  }, [trades, isCurrentWeek])

  const autoStats = useMemo(() => computeStats(weekTrades), [weekTrades])

  useEffect(() => {
    if (!currentUser) return
    const unsubscribe = subscribeReview(currentUser.uid, weekId, (data) => {
      setSaved(data)
      setDisciplineScore(data?.disciplineScore ?? 5)
      setBestTrade(data?.bestTrade ?? '')
      setWorstTrade(data?.worstTrade ?? '')
      setFocusNextWeek(data?.focusNextWeek ?? '')
      setNotes(data?.notes ?? '')
    })
    return () => unsubscribe()
  }, [currentUser, weekId])

  useEffect(() => {
    if (!currentUser) return
    const unsubscribe = subscribeReviews(currentUser.uid, setHistory)
    return () => unsubscribe()
  }, [currentUser])

  async function handleSave() {
    if (!currentUser) return
    setSaving(true)
    try {
      await saveReview(currentUser.uid, weekId, {
        totalTrades: autoStats.total,
        wins: autoStats.wins,
        losses: autoStats.losses,
        breakevens: autoStats.breakevens,
        winRate: autoStats.winRate,
        totalPnl: autoStats.totalPnl,
        avgRR: autoStats.avgRR,
        ruleFollowRate: autoStats.ruleFollowRate,
        disciplineScore: Number(disciplineScore),
        bestTrade,
        worstTrade,
        focusNextWeek,
        notes,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Weekly Review</h1>
        <span className="mono rounded-md bg-panel-2 px-3 py-1.5 text-sm text-text-dim">{weekId}</span>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-text">Auto-Populated Stats</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total Trades" value={autoStats.total} />
          <Stat label="Wins / Losses" value={`${autoStats.wins} / ${autoStats.losses}`} />
          <Stat label="Win Rate" value={formatPercent(autoStats.winRate)} />
          <Stat
            label="Total P&L"
            value={formatCurrency(autoStats.totalPnl, { showSign: true })}
            className={autoStats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}
          />
          <Stat label="Avg R:R" value={formatRR(autoStats.avgRR)} />
          <Stat label="Rule Follow Rate" value={formatPercent(autoStats.ruleFollowRate)} />
        </div>
        {!isCurrentWeek && (
          <p className="mt-3 text-xs text-text-dim">
            Viewing a past week — auto-stats only recompute for the current week; saved values are shown below.
          </p>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-text">Your Review</h2>

        <div>
          <label className="label">Discipline Score ({disciplineScore}/10)</label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={disciplineScore}
            onChange={(e) => setDisciplineScore(e.target.value)}
            className="w-full accent-accent"
          />
        </div>

        <div>
          <label className="label">Best Trade This Week</label>
          <textarea className="input-base min-h-[70px]" value={bestTrade} onChange={(e) => setBestTrade(e.target.value)} />
        </div>

        <div>
          <label className="label">Worst Trade This Week</label>
          <textarea className="input-base min-h-[70px]" value={worstTrade} onChange={(e) => setWorstTrade(e.target.value)} />
        </div>

        <div>
          <label className="label">Focus / Improvement for Next Week</label>
          <textarea
            className="input-base min-h-[70px]"
            value={focusNextWeek}
            onChange={(e) => setFocusNextWeek(e.target.value)}
          />
        </div>

        <div>
          <label className="label">General Notes</label>
          <textarea className="input-base min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : saved ? 'Update Review' : 'Save Review'}
        </button>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-text">Past Reviews</h2>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-dim">No reviews yet.</p>
        ) : (
          <div className="space-y-1">
            {history.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setWeekId(r.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  r.id === weekId ? 'bg-accent/15 text-accent' : 'text-text-dim hover:bg-panel-2 hover:text-text'
                }`}
              >
                <span className="mono">{r.id}</span>
                <span className="mono">
                  {formatCurrency(r.totalPnl, { showSign: true })} · {formatPercent(r.winRate)} WR
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, className = '' }) {
  return (
    <div>
      <div className="text-xs text-text-dim">{label}</div>
      <div className={`mono mt-0.5 text-lg font-semibold text-text ${className}`}>{value}</div>
    </div>
  )
}
