import { useEffect, useState } from 'react'
import { saveRoutine, subscribeRoutine, subscribeRoutineHistory } from '../firebase/routines'
import { useAppStore } from '../store/useAppStore'
import { todayISO } from '../utils/formatters'

export const ROUTINE_CHECKLIST = [
  {
    key: 'economicCalendar',
    label: 'Checked economic calendar for high-impact news',
    hasNote: true,
    notePlaceholder: 'What did you find? e.g. "USD CPI at 8:30am, NFP Friday"',
  },
  { key: 'weeklyLevels', label: 'Marked weekly levels on all watchlist pairs' },
  { key: 'dailyLevels', label: "Marked daily levels (yesterday's H/L)" },
  { key: 'h4Structure', label: 'Identified H4 market structure per pair' },
  { key: 'biasNoted', label: 'Noted bias per pair (bullish/bearish/neutral)' },
  { key: 'noNews', label: 'No major news in next 2 hours' },
  { key: 'calmState', label: 'I am in a calm mental state' },
  { key: 'priceAlerts', label: 'Set price alerts at key zones' },
]

export function useRoutines() {
  const currentUser = useAppStore((s) => s.user)
  const date = todayISO()
  const [routine, setRoutine] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      setRoutine(null)
      setHistory([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubToday = subscribeRoutine(
      currentUser.uid,
      date,
      (data) => {
        setRoutine(data)
        setLoading(false)
      },
      (message) => setError(message),
    )
    const unsubHistory = subscribeRoutineHistory(currentUser.uid, setHistory, (message) =>
      setError(message),
    )
    return () => {
      unsubToday()
      unsubHistory()
    }
  }, [currentUser, date])

  const preSession = routine?.preSession || {}
  const completedCount = ROUTINE_CHECKLIST.filter((item) => preSession[item.key]?.checked).length

  async function toggleItem(key) {
    if (!currentUser) return
    const current = preSession[key]?.checked || false
    const nextPreSession = {
      ...preSession,
      [key]: { checked: !current, timestamp: !current ? new Date().toISOString() : null },
    }
    const allChecked = ROUTINE_CHECKLIST.every((item) => nextPreSession[item.key]?.checked)
    try {
      await saveRoutine(currentUser.uid, date, {
        preSession: nextPreSession,
        completed: allChecked,
        sessionNotes: routine?.sessionNotes || '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateItemNote(key, note) {
    if (!currentUser) return
    const nextPreSession = {
      ...preSession,
      [key]: { ...preSession[key], note },
    }
    try {
      await saveRoutine(currentUser.uid, date, {
        preSession: nextPreSession,
        completed: routine?.completed || false,
        sessionNotes: routine?.sessionNotes || '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateSessionNotes(sessionNotes) {
    if (!currentUser) return
    try {
      await saveRoutine(currentUser.uid, date, {
        preSession,
        completed: routine?.completed || false,
        sessionNotes,
      })
    } catch (err) {
      setError(err.message)
    }
  }

  async function completeSession() {
    if (!currentUser) return
    try {
      await saveRoutine(currentUser.uid, date, {
        preSession,
        completed: true,
        sessionNotes: routine?.sessionNotes || '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  return {
    date,
    routine,
    history,
    loading,
    error,
    completedCount,
    total: ROUTINE_CHECKLIST.length,
    toggleItem,
    updateItemNote,
    updateSessionNotes,
    completeSession,
  }
}
