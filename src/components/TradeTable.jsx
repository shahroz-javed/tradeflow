import { useNavigate } from 'react-router-dom'
import { Check, Eye, Pencil, Trash2, X } from 'lucide-react'
import { formatCurrency, formatDate, formatRR, pairLabel, pnlColorClass } from '../utils/formatters'

function DirectionBadge({ direction }) {
  const isLong = direction === 'long'
  return (
    <span
      className={`mono rounded px-1.5 py-0.5 text-[10px] font-bold ${
        isLong ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
      }`}
    >
      {isLong ? 'LONG' : 'SHORT'}
    </span>
  )
}

function ResultBadge({ result }) {
  const styles = {
    win: 'bg-profit/15 text-profit',
    loss: 'bg-loss/15 text-loss',
    breakeven: 'bg-text-dim/15 text-text-dim',
  }
  const labels = { win: 'WIN', loss: 'LOSS', breakeven: 'BE' }
  return (
    <span className={`mono rounded px-1.5 py-0.5 text-[10px] font-bold ${styles[result] || styles.breakeven}`}>
      {labels[result] || '—'}
    </span>
  )
}

export default function TradeTable({ trades, onDelete }) {
  const navigate = useNavigate()

  if (trades.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-1 py-12 text-center">
        <p className="text-sm text-text-dim">No trades yet.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-dim">
            <th className="px-3 py-2.5 font-medium">Date</th>
            <th className="px-3 py-2.5 font-medium">Pair</th>
            <th className="px-3 py-2.5 font-medium">Direction</th>
            <th className="px-3 py-2.5 font-medium">Entry / SL / TP</th>
            <th className="px-3 py-2.5 font-medium">Lot</th>
            <th className="px-3 py-2.5 font-medium">Risk %</th>
            <th className="px-3 py-2.5 font-medium">Result</th>
            <th className="px-3 py-2.5 font-medium">P&amp;L</th>
            <th className="px-3 py-2.5 font-medium">R:R</th>
            <th className="px-3 py-2.5 font-medium">Rules</th>
            <th className="px-3 py-2.5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr
              key={t.id}
              onClick={() => navigate(`/journal/${t.id}`)}
              className="cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-panel-2"
            >
              <td className="mono px-3 py-2.5 text-text-dim">{formatDate(t.date)}</td>
              <td className="mono px-3 py-2.5 font-medium">{pairLabel(t.pair)}</td>
              <td className="px-3 py-2.5">
                <DirectionBadge direction={t.direction} />
              </td>
              <td className="mono px-3 py-2.5 text-xs text-text-dim">
                {t.entry} / {t.stopLoss} / {t.takeProfit || '—'}
              </td>
              <td className="mono px-3 py-2.5">{t.lotSize}</td>
              <td className="mono px-3 py-2.5">{t.riskPercent}%</td>
              <td className="px-3 py-2.5">
                <ResultBadge result={t.result} />
              </td>
              <td className={`mono px-3 py-2.5 font-semibold ${pnlColorClass(t.pnl)}`}>
                {formatCurrency(t.pnl, { showSign: true })}
              </td>
              <td className="mono px-3 py-2.5">{t.actualRR ? formatRR(t.actualRR) : '—'}</td>
              <td className="px-3 py-2.5">
                {t.rulesFollowed ? (
                  <Check size={16} className="text-profit" />
                ) : (
                  <X size={16} className="text-loss" />
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    title="View"
                    onClick={() => navigate(`/journal/${t.id}`)}
                    className="rounded p-1.5 text-text-dim hover:bg-panel-2 hover:text-text"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => navigate(`/journal/${t.id}/edit`)}
                    className="rounded p-1.5 text-text-dim hover:bg-panel-2 hover:text-text"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => onDelete?.(t)}
                    className="rounded p-1.5 text-text-dim hover:bg-loss/15 hover:text-loss"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { DirectionBadge, ResultBadge }
