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
import { useAppStore, ALL_INSTRUMENTS } from '../store/useAppStore'
import { useTrades, computeStats } from '../hooks/useTrades'
import { useRoutines, ROUTINE_CHECKLIST } from '../hooks/useRoutines'
import { formatCurrency, formatPercent, pairLabel, pnlColorClass, weekRange } from '../utils/formatters'
import { computeStreaks } from '../utils/streaks'
import { deleteTrade } from '../firebase/trades'
import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import GoalsPanel from '../components/GoalsPanel'
import { useSessions, formatDuration, formatCountdown } from '../hooks/useSessions'
import { useEvents } from '../hooks/useEvents'
import { useAlerts, getSessionProgress, getTodayRedOrangeCount } from '../hooks/useAlerts'

const SESSION_ACCENT = {
  default: { label: 'Default', border: 'border-accent/20', dot: '🔵' },
  asian: { label: 'Asian', border: 'border-accent/40', dot: '🔵' },
  london: { label: 'London', border: 'border-profit/40', dot: '🟢' },
  newyork: { label: 'New York', border: 'border-warning/40', dot: '🟠' },
  overlap: { label: 'Overlap', border: 'border-warning/50', dot: '⭐' },
}

const PIE_COLORS = ['#4D8DF7', '#22C58B', '#F4B860', '#F0555F', '#8B96AC', '#7C5CFC', '#2CB1BC', '#D866C9', '#B08968']

export default function Dashboard() {
  const accountType = useAppStore((s) => s.accountType)
  const profile = useAppStore((s) => s.profile)
  const currentUser = useAppStore((s) => s.user)
  const { trades, loading } = useTrades()
  const { routine, completedCount, total } = useRoutines()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { london, newyork, asian, overlap, sessions, activeSessionTheme } = useSessions()
  const { activeAlert, nextEvent, nextEvents, events } = useEvents()
  const { sound, toggleSound, desktop, toggleDesktop } = useAlerts()
  const londonProgress = getSessionProgress(london)
  const nyProgress = getSessionProgress(newyork)
  const { red: todayRed, orange: todayOrange } = getTodayRedOrangeCount(events)
  const todayHoliday = events.some((e) => e.date === new Date().toISOString().slice(0, 10) && e.impact === 'holiday')
  const favoriteInstruments = useAppStore((s) => s.favoriteInstruments)
  const toggleFavoriteInstrument = useAppStore((s) => s.toggleFavoriteInstrument)

  const finishedEvents = useMemo(() => {
    const now = Date.now()
    return events
      .filter((e) => {
        const localMs = new Date(`${e.date}T${e.time}:00`).getTime()
        const parts = new Intl.DateTimeFormat('en', {
          timeZone: e.timezone,
          timeZoneName: 'longOffset',
        }).formatToParts(new Date(localMs))
        const tzStr = parts.find((p) => p.type === 'timeZoneName')?.value || ''
        const m = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/)
        if (!m) return false
        const sign = m[1] === '+' ? 1 : -1
        const offsetMin = sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10))
        const utcMs = localMs - offsetMin * 60000
        return now - utcMs > 30 * 60000
      })
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date)
        if (dateCmp !== 0) return dateCmp
        return b.time.localeCompare(a.time)
      })
      .slice(0, 5)
  }, [events])

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
    <div className={`space-y-6 rounded-lg border-t-2 ${SESSION_ACCENT[activeSessionTheme]?.border}`}>
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

      {/* Today's Summary */}
      <div className={`card flex flex-wrap items-center gap-4 ${SESSION_ACCENT[activeSessionTheme]?.border} border-t-2`}>
        <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
          {SESSION_ACCENT[activeSessionTheme]?.dot} {SESSION_ACCENT[activeSessionTheme]?.label}
        </span>
        <span className={`flex items-center gap-1.5 text-xs ${asian?.isOpen ? 'text-accent' : 'text-text-dim'}`}>
          {asian?.isOpen ? '🟢' : '🔴'} Asian
        </span>
        <span className={`flex items-center gap-1.5 text-xs ${london?.isOpen ? 'text-profit' : 'text-text-dim'}`}>
          {london?.isOpen ? '🟢' : '🔴'} London
        </span>
        <span className={`flex items-center gap-1.5 text-xs ${newyork?.isOpen ? 'text-warning' : 'text-text-dim'}`}>
          {newyork?.isOpen ? '🟢' : '🔴'} NY
        </span>
        {overlap && (
          <span className="flex items-center gap-1.5 text-xs text-warning">
            ⭐ Overlap {formatCountdown(Math.min(london.secsToEvent, newyork.secsToEvent))}
          </span>
        )}
        <span className="h-4 w-px bg-border" />
        {todayRed > 0 && <span className="text-xs text-loss">🔴 {todayRed}</span>}
        {todayOrange > 0 && <span className="text-xs text-warning">🟠 {todayOrange}</span>}
        {!todayRed && !todayOrange && <span className="text-xs text-text-dim">No high-impact news today</span>}
      </div>

      {todayHoliday && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <span className="text-lg">🎉</span>
          <div>
            <p className="text-sm font-bold text-warning">US Holiday — Low Liquidity</p>
            <p className="text-xs text-text-dim">Trade carefully. Spreads may widen and price action may be unpredictable.</p>
          </div>
        </div>
      )}

      {/* Sessions + News + Alerts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SessionCard session={london} label="London" progress={londonProgress} />
        <SessionCard session={newyork} label="New York" progress={nyProgress} />
        <OverlapCard overlap={overlap} london={london} newyork={newyork} />
        <NextEventsList nextEvents={nextEvents} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SoundAlertCard sound={sound} toggleSound={toggleSound} />
        <DesktopNotifCard desktop={desktop} toggleDesktop={toggleDesktop} activeAlert={activeAlert} />
        <NextSessionCard sessions={sessions} />
        <VolatilityMeter />
      </div>

      <EventHistory events={finishedEvents} />

      <FavoritesCard instruments={favoriteInstruments} toggle={toggleFavoriteInstrument} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeeklyOutlook events={events} />
        <SymbolContext events={events} sessions={{ london, newyork, asian, overlap }} />
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

function SoundAlertCard({ sound, toggleSound }) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Sound Alerts</h3>
        <input
          type="checkbox"
          checked={sound}
          onChange={(e) => toggleSound(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
      </div>
      <div className="space-y-1.5">
        {[
          { time: '60 min', desc: 'High impact news', color: 'text-warning', dot: '🟡' },
          { time: '30 min', desc: 'Do not open new positions', color: 'text-warning', dot: '🟠' },
          { time: '10 min', desc: 'Prepare', color: 'text-loss', dot: '🔴' },
          { time: '5 min', desc: 'Close scalps', color: 'text-loss', dot: '🔴' },
          { time: '0-30 min', desc: 'DO NOT TRADE', color: 'text-loss', dot: '🚫' },
        ].map((s) => (
          <div key={s.time} className="flex items-center gap-2 text-[11px]">
            <span>{s.dot}</span>
            <span className={`font-semibold ${s.color}`}>{s.time}</span>
            <span className="text-text-dim">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DesktopNotifCard({ desktop, toggleDesktop, activeAlert }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-text">Desktop Notifications</h3>
      <label className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-2">
          <span className="text-xs">🔔</span>
          <div>
            <p className="text-xs font-medium text-text">Browser notification</p>
            {activeAlert && (
              <p className="text-[10px] text-text-dim">{activeAlert.title} begins in...</p>
            )}
          </div>
        </div>
        <input
          type="checkbox"
          checked={desktop}
          onChange={(e) => toggleDesktop(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
      </label>
    </div>
  )
}

function NextSessionCard({ sessions }) {
  const next = sessions?.find((s) => !s.isOpen)
  if (!next) return null
  return (
    <div className="card">
      <h3 className="mb-2 text-sm font-semibold text-text">Next Session</h3>
      <p className="text-sm font-medium text-text">{next.label}</p>
      <p className="mono mt-1 text-lg font-bold text-accent">
        Opens in {formatCountdown(next.secsToEvent)}
      </p>
    </div>
  )
}

function SessionCard({ session, label, progress }) {
  if (!session) return null
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">{label}</span>
        <span className={`mono text-xs font-bold ${session.isOpen ? 'text-profit' : 'text-text-dim'}`}>
          {session.isOpen ? '🟢 Open' : '🔴 Closed'}
        </span>
      </div>
      <p className={`mono mt-2 text-lg font-bold ${session.isOpen ? 'text-profit' : 'text-text-dim'}`}>
        {session.isOpen
          ? `${formatCountdown(session.secsToEvent)} until close`
          : `Opens in ${formatCountdown(session.secsToEvent)}`}
      </p>
      {session.isOpen && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mono mt-1 text-xs text-text-dim">{progress}% elapsed</p>
        </div>
      )}
    </div>
  )
}

function OverlapCard({ overlap, london, newyork }) {
  if (!london || !newyork) return null
  return (
    <div className={`card ${overlap ? 'border-warning/30 bg-warning/5' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">Overlap</span>
        <span className={`mono text-xs font-bold ${overlap ? 'text-warning' : 'text-text-dim'}`}>
          {overlap ? '⭐ YES' : '—'}
        </span>
      </div>
      <p className={`mt-2 text-lg font-bold ${overlap ? 'text-warning' : 'text-text-dim'}`}>
        {overlap
          ? `Ends in ${formatCountdown(Math.min(london.secsToEvent, newyork.secsToEvent))}`
          : 'Waiting for overlap'}
      </p>
      <p className="text-xs text-text-dim">
        {overlap ? 'Best Trading Time' : 'Both sessions must be open'}
      </p>
    </div>
  )
}

function NextEventsList({ nextEvents }) {
  if (!nextEvents || nextEvents.length === 0) return null
  const favs = useAppStore((s) => s.favoriteInstruments)

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-text">Next Events</h3>
      <div className="space-y-3">
        {nextEvents.map((event, i) => {
          const diffMs = (() => {
            try {
              const localMs = new Date(`${event.date}T${event.time}:00`).getTime()
              const parts = new Intl.DateTimeFormat('en', {
                timeZone: event.timezone,
                timeZoneName: 'longOffset',
              }).formatToParts(new Date(localMs))
              const tzStr = parts.find((p) => p.type === 'timeZoneName')?.value || ''
              const m = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/)
              if (m) {
                const sign = m[1] === '+' ? 1 : -1
                const offsetMin = sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10))
                return localMs - offsetMin * 60000
              }
            } catch {}
            return Infinity
          })()
          const minsUntil = Math.round((diffMs - Date.now()) / 60000)
          const h = Math.floor(Math.abs(minsUntil) / 60)
          const m = Math.abs(minsUntil) % 60
          const withinWindow = minsUntil >= -30 && minsUntil <= 30
          const c = IMPACT_COLORS[event.impact] || IMPACT_COLORS.high
          const dot = c.dot
          const isToday = event.date === new Date().toISOString().slice(0, 10)
          const isTomorrow = event.date === new Date(Date.now() + 86400000).toISOString().slice(0, 10)
          const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : event.date

          return (
            <div key={event.id || i} className={`rounded-md border ${c.border} ${c.bg} px-3 py-2`}>
              <div className="flex items-center justify-between">
                <span className={`mono text-xs font-bold ${c.text}`}>{dot} {event.title}</span>
                <span className={`mono text-xs font-bold ${withinWindow ? 'text-loss' : 'text-text'}`}>
                  {minsUntil > 0
                    ? `${h > 0 ? `${h}h ` : ''}${m}m`
                    : withinWindow
                      ? 'LIVE'
                      : 'Ended'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-text-dim">
                {dateLabel}
                {' — '}{(event.affected && event.affected.length > 0 ? event.affected : [event.currency]).some((a) => favs.includes(a))
                  ? `⚠️ ${(event.affected && event.affected.length > 0 ? event.affected : [event.currency]).filter((a) => favs.includes(a)).join(', ')}`
                  : `Affects: ${(event.affected && event.affected.length > 0 ? event.affected : [event.currency]).join(', ')}`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const VOLATILITY_LEVELS = ['low', 'medium', 'high', 'very-high']
const VOLATILITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', 'very-high': 'Very High' }
const VOLATILITY_COLORS = { low: 'text-text-dim', medium: 'text-warning', high: 'text-loss', 'very-high': 'text-loss font-bold' }
const VOLATILITY_DOTS = { low: '🟢', medium: '🟡', high: '🟠', 'very-high': '🔴' }

function VolatilityMeter() {
  const sessions = ['asian', 'london', 'newyork']
  const [levels, setLevels] = useState(() => {
    try {
      const stored = localStorage.getItem('tradeflow:volatility')
      return stored ? JSON.parse(stored) : {}
    } catch { return {} }
  })

  function cycleLevel(sessionId) {
    const current = levels[sessionId] || 'medium'
    const idx = VOLATILITY_LEVELS.indexOf(current)
    const next = VOLATILITY_LEVELS[(idx + 1) % VOLATILITY_LEVELS.length]
    const updated = { ...levels, [sessionId]: next }
    setLevels(updated)
    try { localStorage.setItem('tradeflow:volatility', JSON.stringify(updated)) } catch {}
  }

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-text">Session Volatility</h3>
      <div className="space-y-2">
        {sessions.map((id) => {
          const level = levels[id] || 'medium'
          const label = { asian: 'Asian', london: 'London', newyork: 'New York' }[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => cycleLevel(id)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-panel-2 px-3 py-1.5 text-left hover:bg-panel-3 transition-colors"
            >
              <span className="text-xs font-medium text-text">{label}</span>
              <span className={`text-xs ${VOLATILITY_COLORS[level]}`}>
                {VOLATILITY_DOTS[level]} {VOLATILITY_LABELS[level]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function EventHistory({ events }) {
  if (!events || events.length === 0) return null

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-text">Event History</h3>
      <div className="space-y-2">
        {events.map((e) => {
          const c = IMPACT_COLORS[e.impact] || IMPACT_COLORS.high
          const hasData = e.actual !== '' && e.actual !== undefined
          return (
            <div key={e.id} className={`flex items-center gap-3 rounded-lg border ${c.border} ${c.bg} px-3 py-2`}>
              <span className="text-xs text-profit">✔</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${c.text}`}>{c.dot} {e.title}</span>
                </div>
                <p className="text-[10px] text-text-dim">{e.date} — {e.time}</p>
              </div>
              {hasData ? (
                <div className="flex gap-2 text-[11px]">
                  <span className="font-semibold text-text">{e.actual}</span>
                  <span className="text-text-dim">F: {e.forecast || '—'}</span>
                  <span className="text-text-dim">P: {e.previous || '—'}</span>
                </div>
              ) : (
                <span className="text-[11px] text-text-dim">No data</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FavoritesCard({ instruments, toggle }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-text">Favorite Instruments</h3>
      <p className="mb-2 text-[11px] text-text-dim">Select what you trade — alerts will highlight affected pairs</p>
      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
        {ALL_INSTRUMENTS.map((inst) => {
          const selected = instruments.includes(inst)
          return (
            <button
              key={inst}
              type="button"
              onClick={() => toggle(inst)}
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                selected
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border text-text-dim hover:border-text-dim/30 hover:text-text'
              }`}
            >
              {selected ? '✓ ' : ''}{inst}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyOutlook({ events }) {
  const { start, end } = weekRange()
  const weekEvents = events.filter((e) => {
    const d = new Date(e.date + 'T12:00:00')
    return d >= start && d <= end
  })
  const redCount = weekEvents.filter((e) => e.impact === 'high').length
  const orangeCount = weekEvents.filter((e) => e.impact === 'medium').length
  const special = weekEvents.filter((e) => {
    const t = e.title.toLowerCase()
    return t.includes('nfp') || t.includes('nonfarm') || t.includes('fomc') || t.includes('cpi') || t.includes('ppI')
  })
  if (redCount === 0 && orangeCount === 0 && special.length === 0) return null

  const monday = new Date(start)
  const isMonday = new Date().toDateString() === monday.toDateString()

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-text">Weekly Outlook</h3>
      <p className="mb-2 text-[11px] text-text-dim">{isMonday ? 'This Week' : `Week of ${monday.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`}</p>
      <div className="flex flex-wrap gap-2">
        {redCount > 0 && <span className="rounded-md border border-loss/30 bg-loss/10 px-2.5 py-1 text-xs font-semibold text-loss">🔴 {redCount} Red</span>}
        {orangeCount > 0 && <span className="rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">🟠 {orangeCount} Orange</span>}
        {special.map((e) => {
          const c = IMPACT_COLORS[e.impact] || IMPACT_COLORS.high
          return (
            <span key={e.id} className={`rounded-md border ${c.border} ${c.bg} px-2.5 py-1 text-xs font-semibold ${c.text}`}>
              {c.dot} {e.title}
            </span>
          )
        })}
        {redCount === 0 && orangeCount === 0 && <span className="text-xs text-text-dim">No high-impact news this week</span>}
      </div>
    </div>
  )
}

function SymbolContext({ events, sessions }) {
  const [symbol, setSymbol] = useState('')
  const favs = useAppStore((s) => s.favoriteInstruments)
  const { london, newyork, asian, overlap } = sessions

  const matched = events.filter((e) => {
    if (!symbol) return false
    const affected = e.affected && e.affected.length > 0 ? e.affected : [e.currency]
    return affected.some((a) => a.toUpperCase() === symbol.toUpperCase()) && e.impact !== 'holiday'
  })
  const nextRelevant = matched
    .map((e) => {
      const localMs = new Date(`${e.date}T${e.time}:00`).getTime()
      const parts = new Intl.DateTimeFormat('en', { timeZone: e.timezone, timeZoneName: 'longOffset' }).formatToParts(new Date(localMs))
      const tzStr = parts.find((p) => p.type === 'timeZoneName')?.value || ''
      const mm = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/)
      if (!mm) return { ...e, minsUntil: Infinity }
      const sign = mm[1] === '+' ? 1 : -1
      const offsetMin = sign * (parseInt(mm[2], 10) * 60 + parseInt(mm[3], 10))
      const utcMs = localMs - offsetMin * 60000
      return { ...e, minsUntil: Math.round((utcMs - Date.now()) / 60000) }
    })
    .filter((e) => e.minsUntil > -30)
    .sort((a, b) => a.minsUntil - b.minsUntil)
    .slice(0, 2)

  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-text">Symbol Context</h3>
        <input
          className="input-base ml-auto w-28 text-xs"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="XAUUSD"
        />
      </div>
      {symbol ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-text">{symbol}</span>
            <span className={`text-xs ${favs.includes(symbol) ? 'text-accent' : 'text-text-dim'}`}>
              {favs.includes(symbol) ? '✓ Favorite' : ''}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`rounded border ${asian?.isOpen ? 'border-accent/30 bg-accent/10' : 'border-border bg-panel-2'} px-2 py-1`}>
              <span className="text-text-dim">Asian</span>
              <span className={`ml-1 font-semibold ${asian?.isOpen ? 'text-accent' : 'text-text-dim'}`}>
                {asian?.isOpen ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
            <div className={`rounded border ${london?.isOpen ? 'border-profit/30 bg-profit/10' : 'border-border bg-panel-2'} px-2 py-1`}>
              <span className="text-text-dim">London</span>
              <span className={`ml-1 font-semibold ${london?.isOpen ? 'text-profit' : 'text-text-dim'}`}>
                {london?.isOpen ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
            <div className={`rounded border ${newyork?.isOpen ? 'border-warning/30 bg-warning/10' : 'border-border bg-panel-2'} px-2 py-1`}>
              <span className="text-text-dim">New York</span>
              <span className={`ml-1 font-semibold ${newyork?.isOpen ? 'text-warning' : 'text-text-dim'}`}>
                {newyork?.isOpen ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
            <div className={`rounded border ${overlap ? 'border-warning/40 bg-warning/15' : 'border-border bg-panel-2'} px-2 py-1`}>
              <span className="text-text-dim">Overlap</span>
              <span className={`ml-1 font-semibold ${overlap ? 'text-warning' : 'text-text-dim'}`}>
                {overlap ? '⭐ Yes' : '—'}
              </span>
            </div>
          </div>
          <div className="rounded border border-border bg-panel-2 px-2 py-1.5 text-[11px]">
            <span className="text-text-dim">Affected by news</span>
            <span className={`ml-1 font-semibold ${nextRelevant.length > 0 ? 'text-loss' : 'text-profit'}`}>
              {nextRelevant.length > 0 ? `⚠️ YES` : '✅ NO'}
            </span>
            {nextRelevant.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {nextRelevant.map((e) => {
                  const c = IMPACT_COLORS[e.impact] || IMPACT_COLORS.high
                  const h = Math.floor(Math.abs(e.minsUntil) / 60)
                  const m = Math.abs(e.minsUntil) % 60
                  return (
                    <div key={e.id} className={c.text}>
                      {c.dot} {e.title} — {h > 0 ? `${h}h ` : ''}{m}m
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-text-dim">Type a symbol above to see session context and relevant news</p>
      )}
    </div>
  )
}
