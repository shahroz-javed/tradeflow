import { analyzeMistakes } from '../utils/textAnalytics'
import { formatCurrency } from '../utils/formatters'

export default function MistakeBreakdown({ trades }) {
  const tags = analyzeMistakes(trades)
  const maxImpact = Math.max(1, ...tags.map((t) => Math.abs(t.dollarImpact)))

  return (
    <div className="card">
      <h2 className="mb-1 text-sm font-semibold text-text">Mistake Impact</h2>
      <p className="mb-4 text-xs text-text-dim">
        Recurring mistakes detected in your trade notes, ranked by how much they&apos;ve cost you.
      </p>

      {tags.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-dim">
          No recurring mistakes detected yet. Keep logging &quot;Mistakes Made&quot; on your trades.
        </p>
      ) : (
        <div className="space-y-3">
          {tags.map((tag) => (
            <div key={tag.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-text">{tag.label}</span>
                <span className="mono text-xs text-text-dim">
                  {tag.count}x · <span className="text-loss">{formatCurrency(tag.dollarImpact)}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full bg-loss transition-all"
                  style={{ width: `${(Math.abs(tag.dollarImpact) / maxImpact) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
