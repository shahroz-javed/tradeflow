import { useCallback, useEffect, useRef, useState } from 'react'
import { useEvents } from './useEvents'

const LS_SOUND = 'tradeflow:alert:sound'
const LS_DESKTOP = 'tradeflow:alert:desktop'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // audio not supported
  }
}

function playTripleBeep() {
  playBeep()
  setTimeout(() => playBeep(), 300)
  setTimeout(() => playBeep(), 600)
}

function sendDesktopNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}

function loadBool(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === 'true'
  } catch {
    return fallback
  }
}

function saveBool(key, val) {
  try {
    localStorage.setItem(key, String(val))
  } catch {
    // storage unavailable
  }
}

const SOUND_THRESHOLDS = [
  { min: 60, key: '60', fn: playBeep, msg: (e) => [`⚠️ ${e.title} in 60 minutes`, `High impact news approaching. ${e.time} ${e.timezone.split('/').pop()}`] },
  { min: 30, key: '30', fn: playBeep, msg: (e) => [`🟠 ${e.title} in 30 minutes`, `Do not open new positions. ${e.time} ${e.timezone.split('/').pop()}`] },
  { min: 10, key: '10', fn: playBeep, msg: (e) => [`🔴 ${e.title} in 10 minutes`, `Get ready. ${e.time} ${e.timezone.split('/').pop()}`] },
  { min: 5, key: '5', fn: playTripleBeep, msg: (e) => [`🚨 ${e.title} in 5 minutes`, `Close all scalps. ${e.time} ${e.timezone.split('/').pop()}`] },
]

export function useAlerts() {
  const [sound, setSound] = useState(() => loadBool(LS_SOUND, false))
  const [desktop, setDesktop] = useState(() => loadBool(LS_DESKTOP, false))
  const announcedRef = useRef(new Set())
  const { sorted } = useEvents()

  const toggleSound = useCallback((v) => { setSound(v); saveBool(LS_SOUND, v) }, [])
  const toggleDesktop = useCallback((v) => {
    setDesktop(v)
    saveBool(LS_DESKTOP, v)
    if (v && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (!sorted.length || !sound) return
    const now = Date.now()

    sorted.forEach((event) => {
      if (event.impact !== 'high' && event.impact !== 'medium') return

      const localMs = new Date(`${event.date}T${event.time}:00`).getTime()
      const parts = new Intl.DateTimeFormat('en', {
        timeZone: event.timezone,
        timeZoneName: 'longOffset',
      }).formatToParts(new Date(localMs))
      const tzStr = parts.find((p) => p.type === 'timeZoneName')?.value || ''
      const m = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/)
      if (!m) return
      const sign = m[1] === '+' ? 1 : -1
      const offsetMin = sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10))
      const utcMs = localMs - offsetMin * 60000
      const diffMin = Math.round((utcMs - now) / 60000)

      if (diffMin < -30) {
        announcedRef.current.add(event.id)
        return
      }

      SOUND_THRESHOLDS.forEach((t) => {
        const key = `${event.id}-${t.key}`
        if (announcedRef.current.has(key)) return
        if (diffMin >= t.min - 2 && diffMin <= t.min + 2) {
          announcedRef.current.add(key)
          t.fn()
          if (desktop) {
            const [title, body] = t.msg(event)
            sendDesktopNotification(title, body)
          }
        }
      })
    })
  }, [sorted, sound, desktop])

  return { sound, toggleSound, desktop, toggleDesktop }
}

export function getSessionProgress(session) {
  if (!session) return 0
  const { openHour, openMin, closeHour, closeMin, tz } = session
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10)
  const currentMin = h * 60 + m
  const openMinTotal = openHour * 60 + openMin
  const closeMinTotal = closeHour * 60 + closeMin
  const total = closeMinTotal - openMinTotal
  const elapsed = currentMin - openMinTotal

  if (!session.isOpen) return 0
  return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100)
}

export function getTodayRedOrangeCount(events) {
  const today = new Date().toISOString().slice(0, 10)
  const red = events.filter((e) => e.date === today && e.impact === 'high').length
  const orange = events.filter((e) => e.date === today && e.impact === 'medium').length
  return { red, orange }
}
