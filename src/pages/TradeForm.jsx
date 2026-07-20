import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { PairSelect } from '../components/PairSelector'
import DirectionToggle from '../components/DirectionToggle'
import ChecklistItem from '../components/ChecklistItem'
import { PAIRS, priceDistanceInPips } from '../utils/calculations'
import { todayISO } from '../utils/formatters'
import { useAppStore } from '../store/useAppStore'
import { addTrade, subscribeTrade, updateTrade, uploadTradeScreenshot } from '../firebase/trades'

const SESSIONS = [
  { value: 'london', label: 'London' },
  { value: 'newyork', label: 'New York' },
  { value: 'asian', label: 'Asian' },
  { value: 'pacific', label: 'Pacific' },
]

export const PRE_TRADE_CHECKLIST = [
  { key: 'trendIdentified', label: 'Higher timeframe trend identified' },
  { key: 'zoneIdentified', label: 'Valid zone identified (S/R or supply/demand)' },
  { key: 'zoneFresh', label: 'Zone is fresh (first or second touch)' },
  { key: 'confirmationCandle', label: 'Confirmation candle printed at zone' },
  { key: 'lotFromPlanner', label: 'Lot size calculated using trade planner' },
  { key: 'slBeyondStructure', label: 'SL placed beyond structure' },
  { key: 'minRR', label: 'Minimum 1:2 R:R confirmed' },
  { key: 'calm', label: 'I am calm — no fear or excitement' },
  { key: 'notRecovering', label: 'Not trying to recover a loss' },
  { key: 'noNews', label: 'No major news in next 30 minutes' },
]

const emptyForm = {
  date: todayISO(),
  type: 'demo',
  pair: 'EURUSD',
  direction: 'long',
  session: 'london',
  entry: '',
  stopLoss: '',
  takeProfit: '',
  lotSize: '',
  riskAmount: '',
  riskPercent: '',
  result: '',
  pnl: '',
  actualRR: '',
  rulesFollowed: false,
  whyEntered: '',
  emotions: '',
  mistakes: '',
  lessonsLearned: '',
  screenshotUrl: '',
  exitScreenshotUrl: '',
}

export default function TradeForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const currentUser = useAppStore((s) => s.user)
  const accountType = useAppStore((s) => s.accountType)

  const [form, setForm] = useState({ ...emptyForm, type: accountType })
  const [checklist, setChecklist] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [exitScreenshotFile, setExitScreenshotFile] = useState(null)
  const [exitScreenshotPreview, setExitScreenshotPreview] = useState('')

  useEffect(() => {
    if (!isEdit || !currentUser) return
    const unsubscribe = subscribeTrade(
      currentUser.uid,
      id,
      (trade) => {
        if (trade) {
          setForm({ ...emptyForm, ...trade })
          setChecklist(trade.preTradeChecklist || {})
          setScreenshotPreview(trade.screenshotUrl || '')
          setExitScreenshotPreview(trade.exitScreenshotUrl || '')
        }
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [isEdit, currentUser, id])

  useEffect(() => {
    if (isEdit) return
    const raw = sessionStorage.getItem('tradeflow:plannerPrefill')
    if (raw) {
      try {
        const prefill = JSON.parse(raw)
        setForm((f) => ({
          ...f,
          pair: prefill.pair ?? f.pair,
          direction: prefill.direction ?? f.direction,
          entry: prefill.entry ?? f.entry,
          stopLoss: prefill.stopLoss ?? f.stopLoss,
          takeProfit: prefill.takeProfit ?? f.takeProfit,
          lotSize: prefill.lotSize ?? f.lotSize,
          riskAmount: prefill.riskAmount ?? f.riskAmount,
          riskPercent: prefill.riskPercent ?? f.riskPercent,
        }))
        checklist.lotFromPlanner = true
        sessionStorage.removeItem('tradeflow:plannerPrefill')
      } catch {
        // ignore malformed prefill
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit])

  const plannedRR = useMemo(() => {
    const pair = PAIRS[form.pair]
    const entry = Number(form.entry)
    const sl = Number(form.stopLoss)
    const tp = Number(form.takeProfit)
    if (!pair || !entry || !sl || !tp) return 0
    const slPips = priceDistanceInPips(pair, entry, sl)
    const tpPips = priceDistanceInPips(pair, entry, tp)
    return slPips ? tpPips / slPips : 0
  }, [form.pair, form.entry, form.stopLoss, form.takeProfit])

  const allChecked = PRE_TRADE_CHECKLIST.every((item) => checklist[item.key])

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleChecklistItem(key) {
    setChecklist((c) => ({ ...c, [key]: !c[key] }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  function removeScreenshot() {
    setScreenshotFile(null)
    setScreenshotPreview('')
    setForm((f) => ({ ...f, screenshotUrl: '' }))
  }

  function handleExitFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setExitScreenshotFile(file)
    setExitScreenshotPreview(URL.createObjectURL(file))
  }

  function removeExitScreenshot() {
    setExitScreenshotFile(null)
    setExitScreenshotPreview('')
    setForm((f) => ({ ...f, exitScreenshotUrl: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allChecked || !currentUser) return

    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        entry: Number(form.entry),
        stopLoss: Number(form.stopLoss),
        takeProfit: Number(form.takeProfit) || 0,
        lotSize: Number(form.lotSize),
        riskAmount: Number(form.riskAmount),
        riskPercent: Number(form.riskPercent),
        plannedRR,
        actualRR: Number(form.actualRR) || 0,
        pnl: Number(form.pnl) || 0,
        rulesFollowed: true,
        preTradeChecklist: checklist,
      }

      let tradeId = id
      if (isEdit) {
        await updateTrade(currentUser.uid, id, payload)
      } else {
        tradeId = await addTrade(currentUser.uid, payload)
      }

      if (tradeId && (screenshotFile || exitScreenshotFile)) {
        const updates = {}
        if (screenshotFile) {
          updates.screenshotUrl = await uploadTradeScreenshot(currentUser.uid, tradeId, screenshotFile, 'entry')
        }
        if (exitScreenshotFile) {
          updates.exitScreenshotUrl = await uploadTradeScreenshot(currentUser.uid, tradeId, exitScreenshotFile, 'exit')
        }
        await updateTrade(currentUser.uid, tradeId, updates)
      }

      navigate(`/journal/${tradeId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card py-12 text-center text-sm text-text-dim">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">{isEdit ? 'Edit Trade' : 'Add Trade'}</h1>

      {error && (
        <div className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left column: Trade Details */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-text">Trade Details</h2>

            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                className="input-base mono"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['demo', 'live'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateField('type', t)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                      form.type === t
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-border bg-panel-2 text-text-dim hover:text-text'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Pair</label>
              <PairSelect value={form.pair} onChange={(v) => updateField('pair', v)} />
            </div>

            <div>
              <label className="label">Direction</label>
              <DirectionToggle value={form.direction} onChange={(v) => updateField('direction', v)} />
            </div>

            <div>
              <label className="label">Session</label>
              <select
                className="input-base"
                value={form.session}
                onChange={(e) => updateField('session', e.target.value)}
              >
                {SESSIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Entry</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="input-base mono"
                  value={form.entry}
                  onChange={(e) => updateField('entry', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="input-base mono"
                  value={form.stopLoss}
                  onChange={(e) => updateField('stopLoss', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={form.takeProfit}
                  onChange={(e) => updateField('takeProfit', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Lot Size</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="input-base mono"
                  value={form.lotSize}
                  onChange={(e) => updateField('lotSize', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Risk Amount ($)</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={form.riskAmount}
                  onChange={(e) => updateField('riskAmount', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Risk %</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={form.riskPercent}
                  onChange={(e) => updateField('riskPercent', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Planned R:R (auto-calculated)</label>
              <div className="mono input-base bg-panel text-text-dim">
                {plannedRR ? `1 : ${plannedRR.toFixed(2)}` : '—'}
              </div>
            </div>
          </div>

          {/* Right column: Outcome + Review */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-text">Outcome &amp; Review</h2>

            <div>
              <label className="label">Result</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'win', label: 'WIN', cls: 'border-profit bg-profit/15 text-profit' },
                  { value: 'loss', label: 'LOSS', cls: 'border-loss bg-loss/15 text-loss' },
                  { value: 'breakeven', label: 'BE', cls: 'border-text-dim bg-panel-2 text-text-dim' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => updateField('result', r.value)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                      form.result === r.value ? r.cls : 'border-border bg-panel-2 text-text-dim hover:text-text'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Actual P&amp;L ($)</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={form.pnl}
                  onChange={(e) => updateField('pnl', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Actual R:R</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={form.actualRR}
                  onChange={(e) => updateField('actualRR', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Rules Followed</label>
              <div className="rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text-dim">
                {allChecked ? (
                  <span className="font-semibold text-profit">YES — all checklist items confirmed</span>
                ) : (
                  <span>Will be set to YES automatically once the checklist below is complete</span>
                )}
              </div>
            </div>

            <div>
              <label className="label">Why I Entered</label>
              <textarea
                className="input-base min-h-[70px]"
                value={form.whyEntered}
                onChange={(e) => updateField('whyEntered', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Emotions During Trade</label>
              <textarea
                className="input-base min-h-[70px]"
                value={form.emotions}
                onChange={(e) => updateField('emotions', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Mistakes Made</label>
              <textarea
                className="input-base min-h-[70px]"
                value={form.mistakes}
                onChange={(e) => updateField('mistakes', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Lessons Learned</label>
              <textarea
                className="input-base min-h-[70px]"
                value={form.lessonsLearned}
                onChange={(e) => updateField('lessonsLearned', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Entry Screenshot</label>
                {screenshotPreview ? (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Entry screenshot"
                      className="max-h-48 w-full rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-panel-2 py-6 text-text-dim hover:border-accent/50">
                    <ImagePlus size={20} />
                    <span className="text-xs">Click to upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              <div>
                <label className="label">Exit Screenshot</label>
                {exitScreenshotPreview ? (
                  <div className="relative">
                    <img
                      src={exitScreenshotPreview}
                      alt="Exit screenshot"
                      className="max-h-48 w-full rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeExitScreenshot}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-panel-2 py-6 text-text-dim hover:border-accent/50">
                    <ImagePlus size={20} />
                    <span className="text-xs">Click to upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleExitFileChange} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Pre-Trade Checklist</h2>
            <span className="mono text-xs text-text-dim">
              {PRE_TRADE_CHECKLIST.filter((i) => checklist[i.key]).length}/{PRE_TRADE_CHECKLIST.length}
            </span>
          </div>
          <p className="text-xs text-text-dim">
            All items must be confirmed before this trade can be submitted.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRE_TRADE_CHECKLIST.map((item) => (
              <ChecklistItem
                key={item.key}
                label={item.label}
                checked={!!checklist[item.key]}
                onChange={() => toggleChecklistItem(item.key)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={!allChecked || saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>
      </form>
    </div>
  )
}
