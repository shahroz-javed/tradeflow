import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useGoals } from '../hooks/useGoals'
import { formatCurrency, formatDate } from '../utils/formatters'

function ProgressRow({ label, actual, target }) {
  if (target <= 0) return null
  const pct = Math.max(0, Math.min(100, (actual / target) * 100))
  const hit = actual >= target
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-text-dim">
        <span>{label}</span>
        <span className={`mono ${hit ? 'text-profit' : ''}`}>
          {formatCurrency(actual, { showSign: true })} / {formatCurrency(target)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full rounded-full transition-all ${hit ? 'bg-profit' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

export default function GoalsPanel() {
  const { targets, daily, weekly, monthly, history } = useGoals()
  const [showHistory, setShowHistory] = useState(false)

  const drawdown = monthly.totalPnl < 0 ? Math.abs(monthly.totalPnl) : 0
  const drawdownBreached = targets.maxDrawdownLimit > 0 && drawdown >= targets.maxDrawdownLimit

  const hasGoals =
    targets.dailyTarget > 0 || targets.weeklyTarget > 0 || targets.monthlyTarget > 0 || targets.maxDrawdownLimit > 0

  if (!hasGoals) return null

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Goals</h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs font-medium text-accent hover:underline"
          >
            {showHistory ? 'Hide history' : 'View history'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressRow label="Today's P&L" actual={daily.totalPnl} target={targets.dailyTarget} />
        <ProgressRow label="This Week's P&L" actual={weekly.totalPnl} target={targets.weeklyTarget} />
        <ProgressRow label="This Month's P&L" actual={monthly.totalPnl} target={targets.monthlyTarget} />
        {targets.maxDrawdownLimit > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-text-dim">
              <span>Drawdown Limit (this month)</span>
              <span className={`mono ${drawdownBreached ? 'text-loss' : ''}`}>
                {formatCurrency(drawdown)} / {formatCurrency(targets.maxDrawdownLimit)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
              <div
                className={`h-full rounded-full transition-all ${drawdownBreached ? 'bg-loss' : 'bg-warning'}`}
                style={{ width: `${Math.min(100, (drawdown / targets.maxDrawdownLimit) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="overflow-x-auto border-t border-border pt-3">
          {history.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-dim">No completed periods recorded yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-text-dim">
                  <th className="px-2 py-1.5 font-medium">Period</th>
                  <th className="px-2 py-1.5 font-medium">Ending</th>
                  <th className="px-2 py-1.5 font-medium">Target</th>
                  <th className="px-2 py-1.5 font-medium">Actual</th>
                  <th className="px-2 py-1.5 font-medium">Achieved</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const dateLabel = h.id.replace(/^(daily|weekly|monthly)-/, '')
                  return (
                    <tr key={h.id} className="border-t border-border/60">
                      <td className="px-2 py-2 text-text-dim">{PERIOD_LABELS[h.period] || h.period}</td>
                      <td className="mono px-2 py-2 text-text-dim">
                        {h.period === 'daily' ? formatDate(dateLabel) : dateLabel}
                      </td>
                      <td className="mono px-2 py-2">{formatCurrency(h.target)}</td>
                      <td className={`mono px-2 py-2 ${h.actual >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(h.actual, { showSign: true })}
                      </td>
                      <td className="px-2 py-2">
                        {h.achieved ? (
                          <Check size={15} className="text-profit" />
                        ) : (
                          <X size={15} className="text-loss" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
