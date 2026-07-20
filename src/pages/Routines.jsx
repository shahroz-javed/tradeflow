import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import ChecklistItem from '../components/ChecklistItem'
import { ROUTINE_CHECKLIST, useRoutines } from '../hooks/useRoutines'
import { formatDate, formatDateTime } from '../utils/formatters'

export default function Routines() {
  const {
    routine,
    history,
    loading,
    completedCount,
    total,
    toggleItem,
    updateItemNote,
    updateSessionNotes,
    completeSession,
  } = useRoutines()
  const [notes, setNotes] = useState('')
  const [itemNotes, setItemNotes] = useState({})

  useEffect(() => {
    setNotes(routine?.sessionNotes || '')
  }, [routine?.sessionNotes])

  useEffect(() => {
    const next = {}
    ROUTINE_CHECKLIST.forEach((item) => {
      next[item.key] = routine?.preSession?.[item.key]?.note || ''
    })
    setItemNotes(next)
  }, [routine?.preSession])

  const preSession = routine?.preSession || {}
  const allChecked = completedCount === total

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Routines</h1>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Today&apos;s Checklist</h2>
          <span className="mono text-sm font-semibold text-text-dim">
            {completedCount}/{total}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(completedCount / total) * 100}%` }}
          />
        </div>

        {loading ? (
          <div className="py-6 text-center text-sm text-text-dim">Loading…</div>
        ) : (
          <div className="space-y-2">
            {ROUTINE_CHECKLIST.map((item) => (
              <div key={item.key}>
                <ChecklistItem
                  label={item.label}
                  checked={!!preSession[item.key]?.checked}
                  onChange={() => toggleItem(item.key)}
                  sublabel={
                    preSession[item.key]?.checked && preSession[item.key]?.timestamp
                      ? formatDateTime(preSession[item.key].timestamp)
                      : ''
                  }
                />
                {item.hasNote && preSession[item.key]?.checked && (
                  <textarea
                    className="input-base mt-1.5 min-h-[50px] text-xs"
                    placeholder={item.notePlaceholder}
                    value={itemNotes[item.key] || ''}
                    onChange={(e) => setItemNotes((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    onBlur={() => updateItemNote(item.key, itemNotes[item.key] || '')}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="label">Session Notes</label>
          <textarea
            className="input-base min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => updateSessionNotes(notes)}
          />
        </div>

        <button
          type="button"
          disabled={!allChecked || routine?.completed}
          onClick={completeSession}
          className="btn-primary w-full"
        >
          {routine?.completed ? 'Session Completed' : 'Complete Session'}
        </button>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-text">Routine History</h2>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-dim">No routine history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-dim">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Items Completed</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const count = ROUTINE_CHECKLIST.filter((item) => h.preSession?.[item.key]?.checked).length
                  return (
                    <tr key={h.id} className="border-b border-border/60 last:border-b-0">
                      <td className="mono px-3 py-2.5 text-text-dim">{formatDate(h.id)}</td>
                      <td className="px-3 py-2.5">
                        {h.completed ? (
                          <span className="flex items-center gap-1 text-profit">
                            <Check size={14} /> Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-text-dim">
                            <X size={14} /> Incomplete
                          </span>
                        )}
                      </td>
                      <td className="mono px-3 py-2.5">
                        {count}/{ROUTINE_CHECKLIST.length}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
