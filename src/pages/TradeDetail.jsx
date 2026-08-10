import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Pencil, Trash2, X } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { DirectionBadge, ResultBadge } from '../components/TradeTable'
import { POST_ENTRY_DEVIATIONS, PRE_TRADE_CHECKLIST } from './TradeForm'
import { useAppStore } from '../store/useAppStore'
import { deleteTrade, subscribeTrade } from '../firebase/trades'
import { formatCurrency, formatDate, formatRR, pairLabel, pnlColorClass } from '../utils/formatters'

export default function TradeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.user)
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const unsubscribe = subscribeTrade(
      currentUser.uid,
      id,
      (data) => {
        setTrade(data)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [currentUser, id])

  async function handleDelete() {
    if (!currentUser) return
    await deleteTrade(currentUser.uid, id)
    navigate('/journal')
  }

  if (loading) {
    return <div className="card py-12 text-center text-sm text-text-dim">Loading…</div>
  }

  if (error || !trade) {
    return (
      <div className="card py-12 text-center text-sm text-loss">{error || 'Trade not found.'}</div>
    )
  }

  const checklist = trade.preTradeChecklist || {}
  const deviations = trade.postEntryDeviations || {}
  const brokenDeviations = POST_ENTRY_DEVIATIONS.filter((item) => deviations[item.key])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/journal" className="flex items-center gap-1.5 text-sm text-text-dim hover:text-text">
          <ArrowLeft size={16} />
          Back to Journal
        </Link>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/journal/${id}/edit`)}>
            <Pencil size={15} />
            Edit
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="mono text-2xl font-semibold text-text">{pairLabel(trade.pair)}</h1>
            <DirectionBadge direction={trade.direction} />
            <ResultBadge result={trade.result} />
            <span className="mono rounded bg-panel-2 px-2 py-0.5 text-xs text-text-dim">
              {trade.type?.toUpperCase()}
            </span>
          </div>
          <div className={`mono text-3xl font-bold ${pnlColorClass(trade.pnl)}`}>
            {formatCurrency(trade.pnl, { showSign: true })}
          </div>
        </div>
        <div className="mt-1 text-sm text-text-dim">
          {formatDate(trade.date)} · {trade.session}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text">Trade Details</h2>
          <DetailRow label="Entry" value={trade.entry} mono />
          <DetailRow label="Stop Loss" value={trade.stopLoss} mono />
          <DetailRow label="Take Profit" value={trade.takeProfit || '—'} mono />
          <DetailRow label="Lot Size" value={trade.lotSize} mono />
          <DetailRow label="Risk Amount" value={formatCurrency(trade.riskAmount)} mono />
          <DetailRow label="Risk %" value={`${trade.riskPercent}%`} mono />
          <DetailRow label="Planned R:R" value={trade.plannedRR ? formatRR(trade.plannedRR) : '—'} mono />
          <DetailRow label="Actual R:R" value={trade.actualRR ? formatRR(trade.actualRR) : '—'} mono />
          <DetailRow
            label="Rules Followed"
            value={
              trade.rulesFollowed ? (
                <span className="flex items-center gap-1 text-profit">
                  <Check size={14} /> Yes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-loss">
                  <X size={14} /> No
                </span>
              )
            }
          />
        </div>

        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text">Review</h2>
          <ReviewBlock label="Why I Entered" value={trade.whyEntered} />
          <ReviewBlock label="Emotions During Trade" value={trade.emotions} />
          <ReviewBlock label="Mistakes Made" value={trade.mistakes} />
          <ReviewBlock label="Lessons Learned" value={trade.lessonsLearned} />
        </div>
      </div>

      {(trade.screenshotUrl || trade.exitScreenshotUrl) && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-text">Screenshots</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trade.screenshotUrl && (
              <div>
                <div className="mb-1.5 text-xs font-medium text-text-dim">Entry</div>
                <img
                  src={trade.screenshotUrl}
                  alt="Entry screenshot"
                  className="w-full rounded-md border border-border"
                />
              </div>
            )}
            {trade.exitScreenshotUrl && (
              <div>
                <div className="mb-1.5 text-xs font-medium text-text-dim">Exit</div>
                <img
                  src={trade.exitScreenshotUrl}
                  alt="Exit screenshot"
                  className="w-full rounded-md border border-border"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-text">Pre-Trade Checklist</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRE_TRADE_CHECKLIST.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              {checklist[item.key] ? (
                <Check size={15} className="shrink-0 text-profit" />
              ) : (
                <X size={15} className="shrink-0 text-loss" />
              )}
              <span className="text-text-dim">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-text">Post-Entry Deviation</h2>
        {brokenDeviations.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-profit">
            <Check size={15} className="shrink-0" />
            None reported — plan followed through to close.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {brokenDeviations.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                <X size={15} className="shrink-0 text-loss" />
                <span className="text-text-dim">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete trade?"
        message="This will permanently remove this trade from your journal."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
      <span className="text-sm text-text-dim">{label}</span>
      <span className={`${mono ? 'mono' : ''} text-sm font-medium text-text`}>{value}</span>
    </div>
  )
}

function ReviewBlock({ label, value }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-text-dim">{label}</div>
      <p className="text-sm text-text">{value || <span className="text-text-dim">—</span>}</p>
    </div>
  )
}
