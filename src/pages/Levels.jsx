import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { PairTabs } from '../components/PairSelector'
import { useLevels } from '../hooks/useLevels'
import { useAppStore } from '../store/useAppStore'
import { checkBreak, distanceInPips, rangeSize } from '../utils/levelMetrics'
import { PAIRS } from '../utils/calculations'
import { formatNumber } from '../utils/formatters'

const BIAS_OPTIONS = [
  { value: 'bullish', label: 'Bullish', cls: 'border-profit bg-profit/15 text-profit' },
  { value: 'bearish', label: 'Bearish', cls: 'border-loss bg-loss/15 text-loss' },
  { value: 'neutral', label: 'Neutral', cls: 'border-text-dim bg-panel-2 text-text-dim' },
]

function PreviousPeriodPanel({ title, record, pair, referencePrice, referenceLabel, brokeHigh, brokeLow }) {
  if (!record) {
    return (
      <div className="card space-y-2">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        <p className="text-xs text-text-dim">
          No history yet — this fills in automatically after the {title.toLowerCase()} rolls over.
        </p>
      </div>
    )
  }

  const decimals = PAIRS[pair]?.decimals ?? 5
  const range = rangeSize(record.high, record.low)
  const distHigh = distanceInPips(pair, referencePrice, record.high)
  const distLow = distanceInPips(pair, referencePrice, record.low)

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        <div className="flex gap-1.5">
          {brokeHigh && (
            <span className="mono flex items-center gap-1 rounded bg-profit/15 px-1.5 py-0.5 text-[10px] font-bold text-profit">
              <ArrowUp size={10} /> Broke High
            </span>
          )}
          {brokeLow && (
            <span className="mono flex items-center gap-1 rounded bg-loss/15 px-1.5 py-0.5 text-[10px] font-bold text-loss">
              <ArrowDown size={10} /> Broke Low
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-text-dim">High</div>
          <div className="mono text-sm font-semibold text-text">{formatNumber(record.high, decimals)}</div>
          {distHigh !== null && (
            <div className="mono text-[11px] text-text-dim">{distHigh.toFixed(1)} pips {referenceLabel}</div>
          )}
        </div>
        <div>
          <div className="text-xs text-text-dim">Low</div>
          <div className="mono text-sm font-semibold text-text">{formatNumber(record.low, decimals)}</div>
          {distLow !== null && (
            <div className="mono text-[11px] text-text-dim">{distLow.toFixed(1)} pips {referenceLabel}</div>
          )}
        </div>
      </div>
      <div className="border-t border-border pt-2">
        <div className="text-xs text-text-dim">Range</div>
        <div className="mono text-sm font-semibold text-text">{formatNumber(range, decimals)}</div>
      </div>
    </div>
  )
}

function ZoneForm({ onAdd, accent }) {
  const [top, setTop] = useState('')
  const [bottom, setBottom] = useState('')
  const [notes, setNotes] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!top || !bottom) return
    onAdd({ top: Number(top), bottom: Number(bottom), notes })
    setTop('')
    setBottom('')
    setNotes('')
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="w-24">
        <label className="label">Top</label>
        <input type="number" step="any" className="input-base mono" value={top} onChange={(e) => setTop(e.target.value)} />
      </div>
      <div className="w-24">
        <label className="label">Bottom</label>
        <input type="number" step="any" className="input-base mono" value={bottom} onChange={(e) => setBottom(e.target.value)} />
      </div>
      <div className="min-w-[140px] flex-1">
        <label className="label">Notes</label>
        <input type="text" className="input-base" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button type="submit" className={`btn-secondary ${accent}`}>
        <Plus size={15} />
        Add
      </button>
    </form>
  )
}

function ZoneList({ zones, onDelete, tint }) {
  if (!zones?.length) {
    return <p className="text-xs text-text-dim">No zones added yet.</p>
  }
  return (
    <div className="space-y-2">
      {zones.map((zone, i) => (
        <div
          key={`${zone.top}-${zone.bottom}-${i}`}
          className={`flex items-center justify-between rounded-md border px-3 py-2 ${tint}`}
        >
          <div className="text-sm">
            <span className="mono font-semibold">
              {zone.top} — {zone.bottom}
            </span>
            {zone.notes && <span className="ml-2 text-xs text-text-dim">{zone.notes}</span>}
          </div>
          <button
            type="button"
            onClick={() => onDelete(i)}
            className="rounded p-1 text-text-dim hover:bg-black/20 hover:text-loss"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function Levels() {
  const [pair, setPair] = useState('EURUSD')
  const { levels, loading, saving, updateLevels, previousDay, previousWeek } = useLevels(pair)
  const profile = useAppStore((s) => s.profile)

  const lastPlannerPrice = profile?.lastPlannerPrices?.[pair]
  const referencePrice = lastPlannerPrice || Number(levels.dailyOpen) || Number(levels.weeklyOpen) || null
  const referenceLabel = lastPlannerPrice ? 'from last entry' : 'from open'

  const dailyBreak = checkBreak({
    currentHigh: levels.dailyHigh,
    currentLow: levels.dailyLow,
    referenceHigh: previousDay?.high,
    referenceLow: previousDay?.low,
  })
  const weeklyBreak = checkBreak({
    currentHigh: levels.weeklyHigh,
    currentLow: levels.weeklyLow,
    referenceHigh: previousWeek?.high,
    referenceLow: previousWeek?.low,
  })

  function addSupplyZone(zone) {
    updateLevels({ supplyZones: [...(levels.supplyZones || []), zone] })
  }
  function deleteSupplyZone(index) {
    updateLevels({ supplyZones: levels.supplyZones.filter((_, i) => i !== index) })
  }
  function addDemandZone(zone) {
    updateLevels({ demandZones: [...(levels.demandZones || []), zone] })
  }
  function deleteDemandZone(index) {
    updateLevels({ demandZones: levels.demandZones.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Key Levels</h1>
        {saving && <span className="text-xs text-text-dim">Saving…</span>}
      </div>

      <PairTabs value={pair} onChange={setPair} />

      {loading ? (
        <div className="card py-12 text-center text-sm text-text-dim">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PreviousPeriodPanel
              title="Previous Week"
              record={previousWeek}
              pair={pair}
              referencePrice={referencePrice}
              referenceLabel={referenceLabel}
              brokeHigh={weeklyBreak.brokeHigh}
              brokeLow={weeklyBreak.brokeLow}
            />
            <PreviousPeriodPanel
              title="Previous Day"
              record={previousDay}
              pair={pair}
              referencePrice={referencePrice}
              referenceLabel={referenceLabel}
              brokeHigh={dailyBreak.brokeHigh}
              brokeLow={dailyBreak.brokeLow}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-text">Weekly Levels</h2>
              <p className="text-xs text-warning">Remember to update these every Monday.</p>
              <div>
                <label className="label">Weekly High</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={levels.weeklyHigh}
                  onChange={(e) => updateLevels({ weeklyHigh: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Weekly Low</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={levels.weeklyLow}
                  onChange={(e) => updateLevels({ weeklyLow: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Weekly Open</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={levels.weeklyOpen}
                  onChange={(e) => updateLevels({ weeklyOpen: e.target.value })}
                />
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-text">Daily Levels</h2>
              <p className="text-xs text-warning">Remember to update these each day.</p>
              <div>
                <label className="label">Daily High</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={levels.dailyHigh}
                  onChange={(e) => updateLevels({ dailyHigh: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Daily Low</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={levels.dailyLow}
                  onChange={(e) => updateLevels({ dailyLow: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Today&apos;s Open</label>
                <input
                  type="number"
                  step="any"
                  className="input-base mono"
                  value={levels.dailyOpen}
                  onChange={(e) => updateLevels({ dailyOpen: e.target.value })}
                />
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-text">Bias</h2>
              <div className="grid grid-cols-1 gap-2">
                {BIAS_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => updateLevels({ bias: b.value })}
                    className={`rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      levels.bias === b.value ? b.cls : 'border-border bg-panel-2 text-text-dim hover:text-text'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-text">Supply Zones</h2>
              <ZoneForm onAdd={addSupplyZone} />
              <ZoneList
                zones={levels.supplyZones}
                onDelete={deleteSupplyZone}
                tint="border-loss/30 bg-loss/10"
              />
            </div>

            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-text">Demand Zones</h2>
              <ZoneForm onAdd={addDemandZone} />
              <ZoneList
                zones={levels.demandZones}
                onDelete={deleteDemandZone}
                tint="border-profit/30 bg-profit/10"
              />
            </div>
          </div>

          <div className="card space-y-2">
            <h2 className="text-sm font-semibold text-text">Notes</h2>
            <textarea
              className="input-base min-h-[100px]"
              value={levels.notes}
              onChange={(e) => updateLevels({ notes: e.target.value })}
              placeholder="Pair-specific notes…"
            />
          </div>
        </div>
      )}
    </div>
  )
}
