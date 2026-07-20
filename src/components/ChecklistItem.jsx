import { Check } from 'lucide-react'

export default function ChecklistItem({ label, checked, onChange, disabled = false, sublabel }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-md border border-border bg-panel-2 px-3 py-2.5 transition-colors ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-accent/50'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-border bg-panel'
        }`}
      >
        {checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span className="flex-1 text-sm text-text">
        {label}
        {sublabel && <span className="mono ml-2 text-xs text-text-dim">{sublabel}</span>}
      </span>
    </label>
  )
}
