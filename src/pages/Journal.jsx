import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus, Search } from 'lucide-react'
import TradeTable from '../components/TradeTable'
import StatCard from '../components/StatCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { PAIR_GROUPS } from '../utils/calculations'
import { pairLabel, formatCurrency, formatPercent, formatRR, todayISO } from '../utils/formatters'
import { computeStats, useTrades } from '../hooks/useTrades'
import { useAppStore } from '../store/useAppStore'
import { deleteTrade } from '../firebase/trades'
import { exportTradesToCsv } from '../utils/csvExport'

const SESSIONS = ['london', 'newyork', 'asian', 'pacific']
const RESULTS = ['win', 'loss', 'breakeven']
const ALL_PAIRS = PAIR_GROUPS.flatMap((g) => g.pairs)

export default function Journal() {
  const currentUser = useAppStore((s) => s.user)
  const { trades, loading } = useTrades()

  const [search, setSearch] = useState('')
  const [pairFilter, setPairFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (pairFilter && t.pair !== pairFilter) return false
      if (resultFilter && t.result !== resultFilter) return false
      if (sessionFilter && t.session !== sessionFilter) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      if (search) {
        const s = search.toLowerCase()
        const haystack = `${t.pair} ${t.whyEntered || ''} ${t.emotions || ''} ${t.mistakes || ''} ${t.lessonsLearned || ''}`.toLowerCase()
        if (!haystack.includes(s)) return false
      }
      return true
    })
  }, [trades, pairFilter, resultFilter, sessionFilter, dateFrom, dateTo, search])

  const stats = useMemo(() => computeStats(filtered), [filtered])

  async function handleDelete() {
    if (!deleteTarget || !currentUser) return
    await deleteTrade(currentUser.uid, deleteTarget.id)
    setDeleteTarget(null)
  }

  function handleExport() {
    exportTradesToCsv(filtered, `tradeflow-trades-${todayISO()}.csv`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">Journal</h1>
        <div className="flex gap-2">
          <button type="button" onClick={handleExport} disabled={filtered.length === 0} className="btn-secondary">
            <Download size={16} />
            Export CSV
          </button>
          <Link to="/journal/new" className="btn-primary">
            <Plus size={16} />
            Add Trade
          </Link>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Search pair or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          <select value={pairFilter} onChange={(e) => setPairFilter(e.target.value)} className="input-base mono w-auto">
            <option value="">All Pairs</option>
            {ALL_PAIRS.map((p) => (
              <option key={p} value={p}>
                {pairLabel(p)}
              </option>
            ))}
          </select>

          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="input-base w-auto">
            <option value="">All Results</option>
            {RESULTS.map((r) => (
              <option key={r} value={r}>
                {r === 'breakeven' ? 'Breakeven' : r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>

          <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="input-base w-auto">
            <option value="">All Sessions</option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'newyork' ? 'New York' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-base mono w-auto"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-base mono w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Wins" value={stats.wins} valueClassName="text-profit" />
        <StatCard label="Losses" value={stats.losses} valueClassName="text-loss" />
        <StatCard label="Win Rate" value={formatPercent(stats.winRate)} />
        <StatCard
          label="Total P&L"
          value={formatCurrency(stats.totalPnl, { showSign: true })}
          valueClassName={stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}
        />
        <StatCard label="Avg R:R" value={formatRR(stats.avgRR)} />
        <StatCard label="Rule Follow" value={formatPercent(stats.ruleFollowRate)} />
      </div>

      {loading ? (
        <div className="card py-12 text-center text-sm text-text-dim">Loading…</div>
      ) : (
        <TradeTable trades={filtered} onDelete={setDeleteTarget} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete trade?"
        message="This will permanently remove this trade from your journal."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
