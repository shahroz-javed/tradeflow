import { Flame, TrendingDown, TrendingUp } from 'lucide-react'
import { useTrades } from '../hooks/useTrades'
import { computeStreaks } from '../utils/streaks'
import RuleComplianceComparison from '../components/RuleComplianceComparison'
import MistakeBreakdown from '../components/MistakeBreakdown'
import PerformanceBreakdown from '../components/PerformanceBreakdown'
import StatCard from '../components/StatCard'

export default function Analytics() {
  const { trades, loading } = useTrades()
  const streaks = computeStreaks(trades)

  const currentStreakLabel = streaks.current.type
    ? `${streaks.current.count}${streaks.current.type === 'win' ? 'W' : 'L'}`
    : '—'
  const currentStreakColor =
    streaks.current.type === 'win'
      ? 'text-profit'
      : streaks.current.type === 'loss'
        ? 'text-loss'
        : 'text-text'

  if (loading) {
    return <div className="card py-12 text-center text-sm text-text-dim">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Current Streak"
          value={currentStreakLabel}
          valueClassName={currentStreakColor}
          icon={Flame}
        />
        <StatCard
          label="Longest Win Streak"
          value={streaks.longestWinStreak}
          valueClassName="text-profit"
          icon={TrendingUp}
        />
        <StatCard
          label="Longest Loss Streak"
          value={streaks.longestLossStreak}
          valueClassName="text-loss"
          icon={TrendingDown}
        />
      </div>

      <RuleComplianceComparison trades={trades} />

      <MistakeBreakdown trades={trades} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PerformanceBreakdown
          trades={trades}
          groupBy="session"
          title="P&L by Session"
          description="Where your edge actually shows up during the trading day."
        />
        <PerformanceBreakdown
          trades={trades}
          groupBy="pair"
          title="P&L by Pair"
          description="Which pairs are working for you and which aren't."
        />
      </div>
    </div>
  )
}
