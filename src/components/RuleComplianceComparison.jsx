import { computeStats } from '../hooks/useTrades'
import { formatCurrency, formatPercent, formatRR, pnlColorClass } from '../utils/formatters'

function Column({ title, accentClass, stats }) {
  const avgPnl = stats.total > 0 ? stats.totalPnl / stats.total : 0
  return (
    <div className={`flex-1 rounded-md border px-4 py-3 ${accentClass}`}>
      <div className="mb-3 text-sm font-semibold text-text">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Trades" value={stats.total} />
        <Metric label="Win Rate" value={formatPercent(stats.winRate)} />
        <Metric label="Avg R:R" value={formatRR(stats.avgRR)} />
        <Metric
          label="Total P&L"
          value={formatCurrency(stats.totalPnl, { showSign: true })}
          valueClass={pnlColorClass(stats.totalPnl)}
        />
        <Metric
          label="Avg P&L / Trade"
          value={formatCurrency(avgPnl, { showSign: true })}
          valueClass={pnlColorClass(avgPnl)}
        />
      </div>
    </div>
  )
}

function Metric({ label, value, valueClass = '' }) {
  return (
    <div>
      <div className="text-xs text-text-dim">{label}</div>
      <div className={`mono text-base font-semibold text-text ${valueClass}`}>{value}</div>
    </div>
  )
}

export default function RuleComplianceComparison({ trades }) {
  const followed = trades.filter((t) => t.rulesFollowed === true)
  const broken = trades.filter((t) => t.rulesFollowed !== true)

  const followedStats = computeStats(followed)
  const brokenStats = computeStats(broken)

  if (trades.length === 0) {
    return (
      <div className="card py-8 text-center text-sm text-text-dim">
        No trades yet — this comparison fills in once you have logged trades.
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="mb-1 text-sm font-semibold text-text">Rule Compliance vs. Performance</h2>
      <p className="mb-4 text-xs text-text-dim">
        Does following your pre-trade checklist actually pay off? Compare outcomes when rules were followed vs. broken.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Column title="Rules Followed" accentClass="border-profit/30 bg-profit/5" stats={followedStats} />
        <Column title="Rules Broken" accentClass="border-loss/30 bg-loss/5" stats={brokenStats} />
      </div>
    </div>
  )
}
