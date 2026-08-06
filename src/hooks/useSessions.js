import { useEffect, useState } from 'react'

const SESSION_DEFS = [
  { id: 'asian', label: 'Asian', tz: 'Asia/Tokyo', openHour: 0, openMin: 0, closeHour: 9, closeMin: 0 },
  { id: 'london', label: 'London', tz: 'Europe/London', openHour: 8, openMin: 0, closeHour: 16, closeMin: 0 },
  { id: 'newyork', label: 'New York', tz: 'America/New_York', openHour: 9, openMin: 0, closeHour: 17, closeMin: 0 },
]

function getTimeInZone(tz) {
  const f = new Intl.DateTimeFormat('en', {
    timeZone: tz,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const [h, m, s] = f.format(new Date()).split(':').map(Number)
  return { hour: h, minute: m, second: s, totalMin: h * 60 + m }
}

function computeSession(session) {
  const { tz, openHour, openMin, closeHour, closeMin } = session
  const now = getTimeInZone(tz)
  const openTotal = openHour * 60 + openMin
  const closeTotal = closeHour * 60 + closeMin
  const currentTotal = now.hour * 60 + now.minute

  const isOpen = currentTotal >= openTotal && currentTotal < closeTotal

  let secsToEvent, eventType
  const currentSec = currentTotal * 60 + now.second
  const openSec = openTotal * 60
  const closeSec = closeTotal * 60

  if (isOpen) {
    secsToEvent = closeSec - currentSec
    eventType = 'close'
  } else {
    if (currentSec < openSec) {
      secsToEvent = openSec - currentSec
    } else {
      secsToEvent = 24 * 3600 - currentSec + openSec
    }
    eventType = 'open'
  }

  return {
    ...session,
    isOpen,
    currentTime: `${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`,
    secsToEvent,
    eventType,
    label: `${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')} ${session.tz.split('/')[1]}`,
  }
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function formatCountdown(totalSecs) {
  const neg = totalSecs < 0
  if (neg) totalSecs = -totalSecs
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${neg ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useSessions() {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // eslint-disable-next-line no-unused-vars
  const _ = now // re-compute on tick

  const sessions = SESSION_DEFS.map(computeSession)
  const london = sessions.find((s) => s.id === 'london')
  const newyork = sessions.find((s) => s.id === 'newyork')
  const asian = sessions.find((s) => s.id === 'asian')
  const overlap = london.isOpen && newyork.isOpen

  let activeSessionTheme = 'default'
  if (overlap) {
    activeSessionTheme = 'overlap'
  } else if (london.isOpen) {
    activeSessionTheme = 'london'
  } else if (newyork.isOpen) {
    activeSessionTheme = 'newyork'
  } else if (asian.isOpen) {
    activeSessionTheme = 'asian'
  }

  const nextSession = sessions.find((s) => !s.isOpen)

  return {
    sessions,
    london,
    newyork,
    asian,
    overlap,
    activeSessionTheme,
    nextSession,
    formatDuration,
    formatCountdown,
  }
}

export { SESSION_DEFS, formatDuration, formatCountdown }
