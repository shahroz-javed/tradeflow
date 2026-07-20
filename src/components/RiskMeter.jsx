import { riskMeterLevel } from '../utils/calculations'

const COLORS = {
  green: 'bg-profit',
  amber: 'bg-warning',
  red: 'bg-loss',
}

const TEXT_COLORS = {
  green: 'text-profit',
  amber: 'text-warning',
  red: 'text-loss',
}

export default function RiskMeter({ riskPercent, max = 10 }) {
  const level = riskMeterLevel(riskPercent)
  const pct = Math.min((riskPercent / max) * 100, 100)

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-text-dim">Risk Level</span>
        <span className={`mono text-xs font-semibold ${TEXT_COLORS[level]}`}>
          {riskPercent.toFixed(2)}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full rounded-full transition-all ${COLORS[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-text-dim">
        <span>0%</span>
        <span>2%</span>
        <span>4%</span>
        <span>{max}%</span>
      </div>
    </div>
  )
}
