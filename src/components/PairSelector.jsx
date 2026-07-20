import { PAIR_GROUPS } from '../utils/calculations'
import { pairLabel } from '../utils/formatters'

export function PairSelect({ value, onChange, className = '' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`input-base mono ${className}`}>
      {PAIR_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.pairs.map((p) => (
            <option key={p} value={p}>
              {pairLabel(p)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

export function PairTabs({ value, onChange }) {
  const allPairs = PAIR_GROUPS.flatMap((g) => g.pairs)
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
      {allPairs.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`mono rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === p
              ? 'bg-accent text-white'
              : 'bg-panel-2 text-text-dim hover:bg-border hover:text-text'
          }`}
        >
          {pairLabel(p)}
        </button>
      ))}
    </div>
  )
}

export default PairSelect
