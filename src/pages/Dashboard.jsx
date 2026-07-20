import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Percent, ShieldCheck, TrendingUp, Wallet } from 'lucide-react'
import StatCard from '../components/StatCard'
import TradeTable from '../components/TradeTable'
import ChecklistItem from '../components/ChecklistItem'
import { useAppStore } from '../store/useAppStore'
import { useTrades, computeStats } from '../hooks/useTrades'
import { useRoutines, ROUTINE_CHECKLIST } from '../hooks/useRoutines'
import { formatCurrency, formatPercent, pairLabel, pnlColorClass, weekRange } from '../utils/formatters'
import { computeStreaks } from '../utils/streaks'
import { deleteTrade } from '../firebase/trades'
import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import GoalsPanel from '../components/GoalsPanel'

const PIE_COLORS = ['#4D8DF7', '#22C58B', '#F4B860', '#F0555F', '#8B96AC', '#7C5CFC', '#2CB1BC', '#D866C9', '#B08968']

export default function Dashboard() {
  const accountType = useAppStore((s) => s.accountType)
  const profile = useAppStore((s) => s.profile)
  const currentUser = useAppStore((s) => s.user)
  const { trades, loading } = useTrades()
  const { routine, completedCount, total } = useRoutines()
  const [deleteTarget, setDeleteTarget] = useState(null)

  const balance = accountType === 'demo' ? profile?.demoBalance : profile?.liveBalance

  const weekStats = useMemo(() => {
    const { start, end } = weekRange()
    const weekTrades = trades.filter((t) => {
      const d = new Date(t.date)
      return d >= start && d <= end
    })
    return computeStats(weekTrades)
  }, [trades])

  const weekPnlPercent = balance ? (weekStats.totalPnl / balance) * 100 : 0

  const streaks = useMemo(() => computeStreaks(trades), [trades])
  const showLossStreakWarning = streaks.current.type === 'loss' && streaks.current.count >= 2

  const recentTrades = trades.slice(0, 5)

  const last30Chart = useMemo(() => {
    const days = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push(d)
    }
    let running = 0
    const dayTotals = days.map((d) => {
      const next = new Date(d)
      next.setDate(d.getDate() + 1)
      const dayPnl = trades
        .filter((t) => {
          const td = new Date(t.date)
          return td >= d && td < next
        })
        .reduce((sum, t) => sum + (Number(t.pnl) || 0), 0)
      running += dayPnl
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: Number(running.toFixed(2)),
      }
    })
    return dayTotals
  }, [trades])

  const pairBreakdown = useMemo(() => {
    const counts = {}
    trades.forEach((t) => {
      counts[t.pair] = (counts[t.pair] || 0) + 1
    })
    return Object.entries(counts)
      .map(([pair, count]) => ({ name: pairLabel(pair), value: count }))
      .sort((a, b) => b.value - a.value)
  }, [trades])

  async function handleDelete() {
    if (!deleteTarget || !currentUser) return
    await deleteTrade(currentUser.uid, deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
      </div>

      {showLossStreakWarning && (
        <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <div className="text-sm text-text">
            <span className="font-semibold text-warning">
              {streaks.current.count} losses in a row.
            </span>{' '}
            Before the next trade, revisit the checklist item &quot;Not trying to recover a loss.&quot; See{' '}
            <Link to="/analytics" className="font-medium text-accent hover:underline">
              Analytics
            </Link>{' '}
            for the full breakdown.
          </div>
        </div>
      )}

      <GoalsPanel />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Account Balance"
          value={balance != null ? formatCurrency(balance) : '—'}
          subValue={accountType.toUpperCase()}
          icon={Wallet}
        />
        <StatCard
          label="This Week P&L"
          value={formatCurrency(weekStats.totalPnl, { showSign: true })}
          subValue={formatPercent(weekPnlPercent)}
          valueClassName={pnlColorClass(weekStats.totalPnl)}
          icon={TrendingUp}
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(weekStats.winRate)}
          subValue={`${weekStats.wins}W / ${weekStats.losses}L / ${weekStats.breakevens}BE`}
          icon={Percent}
        />
        <StatCard
          label="Rule Follow Rate"
          value={formatPercent(weekStats.ruleFollowRate)}
          subValue="This week"
          valueClassName={weekStats.ruleFollowRate >= 80 ? 'text-profit' : 'text-warning'}
          icon={ShieldCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Recent Trades</h2>
            <Link to="/journal" className="text-xs font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="card py-10 text-center text-sm text-text-dim">Loading…</div>
          ) : (
            <TradeTable trades={recentTrades} onDelete={setDeleteTarget} />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Today&apos;s Routine</h2>
            <Link to="/routines" className="text-xs font-medium text-accent hover:underline">
              Open
            </Link>
          </div>
          <div className="card space-y-2">
            <div className="mb-1 flex items-center justify-between text-xs text-text-dim">
              <span>Progress</span>
              <span className="mono">{completedCount}/{total}</span>
            </div>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(completedCount / total) * 100}%` }}
              />
            </div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {ROUTINE_CHECKLIST.map((item) => (
                <div key={item.key} className="text-xs">
                  <ChecklistItem
                    label={item.label}
                    checked={!!routine?.preSession?.[item.key]?.checked}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-text">P&amp;L — Last 30 Days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last30Chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262C38" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8B96AC', fontSize: 11 }}
                  axisLine={{ stroke: '#262C38' }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: '#8B96AC', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1A1F28',
                    border: '1px solid #262C38',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#8B96AC' }}
                  formatter={(value) => [formatCurrency(value), 'Cumulative P&L']}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#4D8DF7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-text">Pair Breakdown</h2>
          {pairBreakdown.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-text-dim">
              No trades yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pairBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {pairBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#12161D" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1A1F28',
                      border: '1px solid #262C38',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {pairBreakdown.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-dim">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {entry.name}
                <span className="mono">({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
