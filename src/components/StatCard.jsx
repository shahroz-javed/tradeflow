export default function StatCard({ label, value, subValue, valueClassName = '', icon: Icon }) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-dim">{label}</span>
        {Icon && <Icon size={16} className="text-text-dim" />}
      </div>
      <div className={`mono text-2xl font-semibold ${valueClassName}`}>{value}</div>
      {subValue && <div className="mono text-xs text-text-dim">{subValue}</div>}
    </div>
  )
}
