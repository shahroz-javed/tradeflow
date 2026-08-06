import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { subscribeEvents } from '../firebase/events'

const IMPACT_ORDER = { high: 3, medium: 2, low: 1, holiday: 0 }

function getTzOffsetMinutes(timeZone, date) {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(date)
    const tzStr = parts.find((p) => p.type === 'timeZoneName')?.value || ''
    const m = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (m) {
      const sign = m[1] === '+' ? 1 : -1
      return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10))
    }
  } catch {
    // fall through
  }
  return 0
}

export function getEventUtcMs(event) {
  const localMs = new Date(`${event.date}T${event.time}:00`).getTime()
  const offsetMin = getTzOffsetMinutes(event.timezone, new Date(localMs))
  return localMs - offsetMin * 60000
}

export const EVENT_STAGES = [
  { minFrom: 60, label: 'Upcoming', action: 'High impact news approaching', icon: '🟡', bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', dot: '🟡' },
  { minFrom: 30, label: 'Warning', action: 'Do not open new positions', icon: '🟠', bg: 'bg-warning/20', border: 'border-warning/40', text: 'text-warning', dot: '🟠' },
  { minFrom: 10, label: 'Prepare', action: 'Get ready', icon: '🔴', bg: 'bg-loss/10', border: 'border-loss/30', text: 'text-loss', dot: '🔴' },
  { minFrom: 5, label: 'Close scalps', action: 'Close all scalps', icon: '🔴', bg: 'bg-loss/20', border: 'border-loss/50', text: 'text-loss', dot: '🔴' },
  { minFrom: -30, label: 'DO NOT TRADE', action: 'News window — stay out', icon: '🚫', bg: 'bg-loss/15', border: 'border-loss/50', text: 'text-loss', dot: '🚫', blink: true },
]

export function getEventStage(minsUntil) {
  if (minsUntil < -30) return null
  for (const stage of EVENT_STAGES) {
    if (minsUntil >= stage.minFrom) return stage
  }
  return null
}

export function getEventTimeInfo(event) {
  const now = Date.now()
  const utcMs = getEventUtcMs(event)
  const diffMs = utcMs - now
  const minsUntil = Math.round(diffMs / 60000)
  const started = minsUntil <= 0
  const ended = minsUntil < -30
  const stage = getEventStage(minsUntil)
  return { minsUntil, started, ended, stage }
}

export function useEvents() {
  const user = useAppStore((s) => s.user)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!user) {
      setEvents([])
      setLoading(false)
      return
    }
    const unsub = subscribeEvents(
      user.uid,
      (data) => {
        setEvents(data)
        setLoading(false)
      },
      (msg) => {
        setError(msg)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [user])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(id)
  }, [])

  // eslint-disable-next-line no-unused-vars
  const _ = now

  const sorted = [...events].sort((a, b) => getEventUtcMs(a) - getEventUtcMs(b))

  const activeAlert = sorted.find((e) => {
    const info = getEventTimeInfo(e)
    return info.stage && info.stage.minFrom <= 30
  })

  const nextEvent = sorted.find((e) => {
    const info = getEventTimeInfo(e)
    return !info.ended && e !== activeAlert
  })

  const nextEvents = sorted
    .filter((e) => {
      const info = getEventTimeInfo(e)
      return !info.ended
    })
    .slice(0, 3)

  return {
    events,
    sorted,
    activeAlert,
    nextEvent,
    nextEvents,
    loading,
    error,
    getEventTimeInfo,
    getEventStage,
  }
}

export const IMPACT_COLORS = {
  high: { bg: 'bg-loss/15', text: 'text-loss', border: 'border-loss/30', dot: '🔴' },
  medium: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30', dot: '🟠' },
  low: { bg: 'bg-accent/15', text: 'text-accent', border: 'border-accent/30', dot: '🟡' },
  holiday: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', dot: '🔵' },
}

export const IMPACT_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  holiday: 'Holiday',
}
