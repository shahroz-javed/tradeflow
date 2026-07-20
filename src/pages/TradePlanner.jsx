import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Mic } from 'lucide-react'
import { PairSelect } from '../components/PairSelector'
import RiskMeter from '../components/RiskMeter'
import { useProfile } from '../hooks/useProfile'
import { useVoiceNumberInput, VOICE_SUPPORTED } from '../hooks/useVoiceNumberInput'
import { PAIR_TYPE_LABELS, PAIRS, buildTradeSummary, calculateTradePlan } from '../utils/calculations'
import { formatCurrency, formatRR, pairLabel } from '../utils/formatters'

const QUICK_RR = [1, 2, 3, 4]

export default function TradePlanner() {
  const navigate = useNavigate()
  const { profile, updateProfile } = useProfile()

  const [capital, setCapital] = useState('')
  const [riskPercent, setRiskPercent] = useState(2)
  const [leverage, setLeverage] = useState(500)
  const [pairKey, setPairKey] = useState('EURUSD')
  const [entry, setEntry] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [userEditedPrices, setUserEditedPrices] = useState(false)
  const [copied, setCopied] = useState(false)

  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (profile && !hydrated) {
      setCapital(profile.demoBalance ?? profile.liveBalance ?? '')
      setRiskPercent(profile.riskPercent ?? 2)
      setLeverage(profile.leverage ?? 500)
      if (profile.lastPair) setPairKey(profile.lastPair)
      setHydrated(true)
    }
  }, [profile, hydrated])

  // Apply per-pair default entry/SL until the user starts typing their own prices.
  useEffect(() => {
    if (userEditedPrices) return
    const pair = PAIRS[pairKey]
    if (!pair) return
    setEntry(pair.defEntry.toFixed(pair.decimals))
    setStopLoss(pair.defSL.toFixed(pair.decimals))
    const dist = Math.abs(pair.defEntry - pair.defSL)
    const dir = pair.defSL < pair.defEntry ? 1 : -1
    setTakeProfit((pair.defEntry + dir * dist * 2).toFixed(pair.decimals))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairKey])

  const plan = useMemo(
    () =>
      calculateTradePlan({
        pairKey,
        capital: Number(capital),
        riskPercent: Number(riskPercent),
        leverage: Number(leverage),
        entry: Number(entry),
        stopLoss: Number(stopLoss),
        takeProfit: Number(takeProfit),
      }),
    [pairKey, capital, riskPercent, leverage, entry, stopLoss, takeProfit],
  )

  function applyQuickRR(rr) {
    const entryNum = Number(entry)
    const slNum = Number(stopLoss)
    if (!entryNum || !slNum || entryNum === slNum) return
    const slDistance = Math.abs(entryNum - slNum)
    const dir = slNum < entryNum ? 1 : -1
    const tp = entryNum + dir * slDistance * rr
    setTakeProfit(tp.toFixed(plan.pair?.decimals ?? 5))
    setUserEditedPrices(true)
  }

  async function persistDefaults() {
    try {
      await updateProfile({
        riskPercent: Number(riskPercent),
        leverage: Number(leverage),
        lastPair: pairKey,
      })
    } catch {
      // surfaced via profile hook error state elsewhere; non-blocking here
    }
  }

  async function persistPlannerPrice(overrideEntry) {
    const entryNum = Number(overrideEntry ?? entry)
    if (!entryNum) return
    try {
      await updateProfile({
        lastPlannerPrices: { ...(profile?.lastPlannerPrices || {}), [pairKey]: entryNum },
      })
    } catch {
      // non-blocking; used only as a "last known price" reference on the Levels page
    }
  }

  function handleSaveAsTradePlan() {
    const tradePlan = {
      pair: pairKey,
      direction: plan.direction || 'long',
      entry,
      stopLoss,
      takeProfit,
      lotSize: plan.lotRounded,
      riskAmount: plan.riskAmount,
      riskPercent,
      plannedRR: plan.riskReward,
    }
    sessionStorage.setItem('tradeflow:plannerPrefill', JSON.stringify(tradePlan))
    navigate('/journal/new')
  }

  function handleCopySummary() {
    const summary = buildTradeSummary({ pairKey, capital, riskPercent, entry, stopLoss, takeProfit, plan })
    if (!summary) return
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const { activeField, status: voiceStatus, transcript: voiceTranscript, startListening } = useVoiceNumberInput(
    (fieldKey, value) => {
      const decimals = plan.pair?.decimals ?? 5
      const setters = {
        capital: setCapital,
        leverage: setLeverage,
        entry: setEntry,
        stopLoss: setStopLoss,
        takeProfit: setTakeProfit,
      }
      setters[fieldKey]?.(fieldKey === 'capital' || fieldKey === 'leverage' ? value : value.toFixed(decimals))
      if (['entry', 'stopLoss', 'takeProfit'].includes(fieldKey)) setUserEditedPrices(true)
      if (fieldKey === 'entry') persistPlannerPrice(value)
    },
  )

  const decimals = plan.pair?.decimals ?? 5
  const directionLabel = plan.direction === 'long' ? 'LONG' : plan.direction === 'short' ? 'SHORT' : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">Trade Planner</h1>
          <p className="text-sm text-text-dim">Position size &amp; risk calculator</p>
        </div>
        <span
          className={`mono shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide ${
            plan.direction === 'long'
              ? 'border-profit/40 bg-profit/10 text-profit'
              : plan.direction === 'short'
                ? 'border-loss/40 bg-loss/10 text-loss'
                : 'border-border bg-panel-2 text-text-dim'
          }`}
        >
          {directionLabel}
        </span>
      </div>

      {VOICE_SUPPORTED && activeField && (
        <div className="card space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-dim">🎤 Voice Entry</p>
          <p className="text-sm text-text-dim">{voiceStatus}</p>
          {voiceTranscript && <p className="mono text-sm text-accent">{voiceTranscript}</p>}
        </div>
      )}

      <div className="card">
        <RiskMeter riskPercent={Number(riskPercent) || 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Inputs */}
        <div className="card space-y-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-text">Inputs</h2>

          <VoiceField
            label="Capital ($)"
            value={capital}
            onChange={setCapital}
            onBlur={persistDefaults}
            fieldKey="capital"
            activeField={activeField}
            onMic={startListening}
          />

          <div>
            <label className="label">Risk % ({Number(riskPercent).toFixed(2)}%)</label>
            <input
              type="range"
              min="0.25"
              max="10"
              step="0.25"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              onMouseUp={persistDefaults}
              onTouchEnd={persistDefaults}
              className="w-full accent-accent"
            />
          </div>

          <VoiceField
            label="Leverage"
            value={leverage}
            onChange={setLeverage}
            onBlur={persistDefaults}
            fieldKey="leverage"
            activeField={activeField}
            onMic={startListening}
          />

          <div>
            <label className="label">Pair</label>
            <PairSelect value={pairKey} onChange={setPairKey} />
          </div>

          <VoiceField
            label="Entry Price"
            value={entry}
            onChange={(v) => {
              setEntry(v)
              setUserEditedPrices(true)
            }}
            onBlur={persistPlannerPrice}
            fieldKey="entry"
            activeField={activeField}
            onMic={startListening}
          />

          <VoiceField
            label="Stop Loss"
            value={stopLoss}
            onChange={(v) => {
              setStopLoss(v)
              setUserEditedPrices(true)
            }}
            fieldKey="stopLoss"
            activeField={activeField}
            onMic={startListening}
          />

          <div>
            <VoiceField
              label="Take Profit"
              value={takeProfit}
              onChange={(v) => {
                setTakeProfit(v)
                setUserEditedPrices(true)
              }}
              fieldKey="takeProfit"
              activeField={activeField}
              onMic={startListening}
            />
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {QUICK_RR.map((rr) => (
                <button
                  key={rr}
                  type="button"
                  onClick={() => applyQuickRR(rr)}
                  className="mono rounded-md border border-border bg-panel-2 py-1.5 text-xs font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
                >
                  1:{rr}
                </button>
              ))}
            </div>
          </div>

          {plan.warning && <p className="text-xs text-warning">{plan.warning}</p>}

          <button type="button" onClick={handleSaveAsTradePlan} className="btn-primary w-full">
            Save as Trade Plan
          </button>
        </div>

        {/* Right: Auto-detected + Outputs */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-text">Auto-Detected</h2>
            <div className="grid grid-cols-3 gap-4">
              <InfoStat label="Pair Type" value={PAIR_TYPE_LABELS[plan.pair?.type] ?? '—'} />
              <InfoStat label="Pip Size" value={plan.pipSize} mono />
              <InfoStat label="Value / Std Lot" value={formatCurrency(plan.valuePerLot)} mono />
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Calculated Outputs</h2>
              <button
                type="button"
                onClick={handleCopySummary}
                disabled={!plan.direction}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:text-text-dim disabled:no-underline"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy summary'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoStat label="Risk Amount" value={formatCurrency(plan.riskAmount)} mono highlight />
              <InfoStat label="SL Distance" value={`${plan.slPips.toFixed(1)} pips`} mono />
              <InfoStat label="TP Distance" value={`${plan.tpPips.toFixed(1)} pips`} mono />
              <InfoStat label="Lot Size (exact)" value={plan.lotExact.toFixed(4)} mono />
              <InfoStat label="Lot Size (rounded)" value={plan.lotRounded.toFixed(2)} mono highlight />
              <InfoStat label="Position Size" value={plan.positionUnits.toLocaleString()} mono />
              <InfoStat label="Margin Required" value={formatCurrency(plan.margin)} mono />
              <InfoStat label="Free Margin" value={formatCurrency(plan.freeMargin)} mono />
              <InfoStat label="Actual Risk" value={formatCurrency(plan.actualRisk)} mono />
              <InfoStat
                label="Potential Profit"
                value={formatCurrency(plan.potentialProfit)}
                mono
                className="text-profit"
              />
              <InfoStat
                label="Potential Loss"
                value={formatCurrency(plan.potentialLoss)}
                mono
                className="text-loss"
              />
              <InfoStat label="Risk : Reward" value={formatRR(plan.riskReward)} mono highlight />
              <InfoStat
                label="Breakeven Win Rate"
                value={`${plan.breakEvenWinRate.toFixed(1)}%`}
                mono
              />
              <InfoStat label="Pair" value={pairLabel(pairKey)} mono />
              <InfoStat label="Entry Decimals" value={decimals} mono />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VoiceField({ label, value, onChange, onBlur, fieldKey, activeField, onMic }) {
  const listening = activeField === fieldKey
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-1.5">
        <input
          type="number"
          step="any"
          className="input-base mono flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        {VOICE_SUPPORTED && (
          <button
            type="button"
            onClick={() => onMic(fieldKey)}
            title="Voice input"
            className={`shrink-0 rounded-md border px-2.5 transition-colors ${
              listening
                ? 'animate-pulse border-loss bg-loss/10 text-loss'
                : 'border-border bg-panel-2 text-text-dim hover:border-accent hover:text-text'
            }`}
          >
            <Mic size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

function InfoStat({ label, value, mono = false, highlight = false, className = '' }) {
  return (
    <div>
      <div className="text-xs text-text-dim">{label}</div>
      <div
        className={`${mono ? 'mono' : ''} mt-0.5 text-sm font-semibold ${
          highlight ? 'text-accent' : 'text-text'
        } ${className}`}
      >
        {value}
      </div>
    </div>
  )
}
