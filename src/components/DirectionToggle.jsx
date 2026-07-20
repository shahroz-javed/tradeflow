export default function DirectionToggle({ value, onChange, disabled = false }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('long')}
        className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          value === 'long'
            ? 'border-profit bg-profit/15 text-profit'
            : 'border-border bg-panel-2 text-text-dim hover:text-text'
        }`}
      >
        LONG
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('short')}
        className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          value === 'short'
            ? 'border-loss bg-loss/15 text-loss'
            : 'border-border bg-panel-2 text-text-dim hover:text-text'
        }`}
      >
        SHORT
      </button>
    </div>
  )
}
