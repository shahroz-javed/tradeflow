import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useAppStore, ALL_INSTRUMENTS } from '../store/useAppStore'
import { addEvent, deleteEvent, updateEvent } from '../firebase/events'
import { useEvents, IMPACT_COLORS, IMPACT_LABELS } from '../hooks/useEvents'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'XAU', 'XAG']
const IMPACTS = ['high', 'medium', 'low', 'holiday']
const TIMEZONES = ['America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland']

const emptyForm = {
  title: '',
  impact: 'high',
  currency: 'USD',
  date: '',
  time: '',
  timezone: 'America/New_York',
  notes: '',
  affected: [],
  actual: '',
  forecast: '',
  previous: '',
}

export default function Events() {
  const user = useAppStore((s) => s.user)
  const { events, sorted, loading, error, getEventTimeInfo } = useEvents()
  const [monthOffset, setMonthOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)

  const today = new Date()
  const cursor = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = new Date(year, month, 1).getDay()

  const weeks = useMemo(() => {
    const cells = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    const w = []
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7))
    return w
  }, [year, month, startDow, daysInMonth])

  const eventsByDay = useMemo(() => {
    const map = {}
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [events])

  const todayStr = today.toISOString().slice(0, 10)

  function openAddForm(dateStr) {
    setForm({ ...emptyForm, date: dateStr })
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(event) {
    setForm({
      title: event.title || '',
      impact: event.impact || 'high',
      currency: event.currency || 'USD',
      date: event.date || '',
      time: event.time || '',
      timezone: event.timezone || 'America/New_York',
      notes: event.notes || '',
      affected: event.affected || [],
      actual: event.actual ?? '',
      forecast: event.forecast ?? '',
      previous: event.previous ?? '',
    })
    setEditingId(event.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!user || !form.title || !form.date || !form.time) return
    setSaving(true)
    try {
      const data = {
        title: form.title.trim(),
        impact: form.impact,
        currency: form.currency,
        date: form.date,
        time: form.time,
        timezone: form.timezone,
        notes: form.notes.trim(),
        affected: form.affected,
        actual: form.actual,
        forecast: form.forecast,
        previous: form.previous,
      }
      if (editingId) {
        await updateEvent(user.uid, editingId, data)
      } else {
        await addEvent(user.uid, data)
      }
      setShowForm(false)
    } catch {
      // error handled by hook
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!user || !id) return
    if (!window.confirm('Delete this event?')) return
    try {
      await deleteEvent(user.uid, id)
    } catch {
      // error
    }
  }

  const dayEvents = selectedDay ? eventsByDay[selectedDay] || [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Critical Events</h1>
          <p className="text-sm text-text-dim">Weekly economic calendar — add events from Forex Factory</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-dim">Impact:</span>
          {IMPACTS.map((k) => (
            <span key={k} className={`text-xs ${IMPACT_COLORS[k].text}`}>
              {IMPACT_COLORS[k].dot} {IMPACT_LABELS[k]}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="btn-ghost p-1">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-text">{monthLabel}</span>
          <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="btn-ghost p-1">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-text-dim">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1.5">{d}</div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((d, di) => {
              if (d === null) return <div key={di} />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const dayEvents = eventsByDay[dateStr] || []
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDay

              return (
                <button
                  key={di}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={`relative border border-border p-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-accent/20 ring-1 ring-accent'
                      : isToday
                        ? 'bg-accent/10'
                        : 'hover:bg-panel-2'
                  }`}
                >
                  <span className={`mono ${isToday ? 'font-bold text-accent' : 'text-text-dim'}`}>{d}</span>
                  {dayEvents.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((e) => {
                        const c = IMPACT_COLORS[e.impact] || IMPACT_COLORS.high
                        return (
                          <div
                            key={e.id}
                            className={`truncate rounded px-0.5 text-[9px] font-semibold ${c.bg} ${c.text}`}
                          >
                            {c.dot} {e.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-text-dim">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </h2>
            <button type="button" onClick={() => openAddForm(selectedDay)} className="btn-primary text-xs">
              <Plus size={14} /> Add Event
            </button>
          </div>

          {dayEvents.length === 0 && (
            <p className="text-sm text-text-dim">No events on this day.</p>
          )}

          <div className="space-y-2">
            {dayEvents.map((e) => {
              const c = IMPACT_COLORS[e.impact] || IMPACT_COLORS.high
              const info = getEventTimeInfo(e)
              return (
                <div key={e.id} className={`flex items-center gap-3 rounded-lg border ${c.border} ${c.bg} px-3 py-2`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${c.text}`}>{c.dot} {e.title}</span>
                      <span className={`mono rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text}`}>
                        {IMPACT_LABELS[e.impact]} Impact
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-3 text-[11px] text-text-dim">
                      <span className="mono">{e.time} {e.timezone.split('/').pop()}</span>
                      <span>Affects: {(e.affected && e.affected.length > 0 ? e.affected : [e.currency]).join(', ')}</span>
                      {!info.ended && info.minsUntil > 0 && (
                        <span className={info.inWindow ? 'text-loss font-semibold' : ''}>
                          {info.minsUntil <= 60
                            ? `${info.minsUntil}m away`
                            : `${Math.round(info.minsUntil / 60)}h ${info.minsUntil % 60}m away`}
                        </span>
                      )}
                      {info.inWindow && info.started && !info.ended && (
                        <span className="text-loss font-semibold">IN PROGRESS</span>
                      )}
                      {info.ended && (
                        <span className="text-profit font-semibold">✔ Finished</span>
                      )}
                    </div>
                    {info.ended && e.actual !== '' && (
                      <div className="mt-1 flex gap-3 text-[11px]">
                        <span className="font-semibold text-text">Actual: {e.actual}</span>
                        <span className="text-text-dim">Forecast: {e.forecast || '—'}</span>
                        <span className="text-text-dim">Previous: {e.previous || '—'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(e)} className="btn-ghost p-1 text-text-dim hover:text-text">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(e.id)} className="btn-ghost p-1 text-text-dim hover:text-loss">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Event form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-panel p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-semibold text-text">
              {editingId ? 'Edit Event' : 'New Event'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="label">Title</label>
                <input className="input-base w-full" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="USD CPI" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Impact</label>
                  <div className="flex gap-1">
                    {IMPACTS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, impact: k }))}
                        className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          form.impact === k
                            ? `${IMPACT_COLORS[k].border} ${IMPACT_COLORS[k].bg} ${IMPACT_COLORS[k].text}`
                            : 'border-border text-text-dim hover:text-text'
                        }`}
                      >
                        {IMPACT_COLORS[k].dot} {IMPACT_LABELS[k]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select
                    className="input-base w-full"
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input-base w-full" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Time</label>
                  <input type="time" className="input-base w-full" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Timezone</label>
                <select
                  className="input-base w-full"
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <p className="mt-0.5 text-xs text-text-dim">Stored as original timezone — auto-converted</p>
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  className="input-base w-full resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Affected Markets</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {ALL_INSTRUMENTS.map((m) => {
                    const selected = form.affected.includes(m)
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            affected: selected ? f.affected.filter((a) => a !== m) : [...f.affected, m],
                          }))
                        }
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                          selected
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-border text-text-dim hover:border-text-dim/30 hover:text-text'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>

              {editingId && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label">Actual</label>
                    <input className="input-base w-full" value={form.actual} onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))} placeholder="3.4%" />
                  </div>
                  <div>
                    <label className="label">Forecast</label>
                    <input className="input-base w-full" value={form.forecast} onChange={(e) => setForm((f) => ({ ...f, forecast: e.target.value }))} placeholder="3.1%" />
                  </div>
                  <div>
                    <label className="label">Previous</label>
                    <input className="input-base w-full" value={form.previous} onChange={(e) => setForm((f) => ({ ...f, previous: e.target.value }))} placeholder="3.0%" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.title || !form.date || !form.time}
                className="btn-primary px-4 py-1.5 text-sm"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              const nextWeek = new Date(today)
              nextWeek.setDate(nextWeek.getDate() + (nextWeek.getDay() <= 1 ? 0 : 7 - nextWeek.getDay() + 1))
              const dateStr = nextWeek.toISOString().slice(0, 10)
              openAddForm(dateStr)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>
      )}
    </div>
  )
}
