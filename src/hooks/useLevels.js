import { useEffect, useRef, useState } from 'react'
import { DEFAULT_LEVELS, saveLevels, subscribeLevels } from '../firebase/levels'
import { fetchLatestLevelHistory, fetchLevelHistoryList, saveLevelHistoryRecord } from '../firebase/levelHistory'
import { useAppStore } from '../store/useAppStore'
import { currentWeekId, todayISO } from '../utils/formatters'

const DEBOUNCE_MS = 500

export function useLevels(pair) {
  const currentUser = useAppStore((s) => s.user)
  const [levels, setLevels] = useState(DEFAULT_LEVELS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [previousDay, setPreviousDay] = useState(null)
  const [previousWeek, setPreviousWeek] = useState(null)
  const debounceRef = useRef(null)
  const isRemoteUpdate = useRef(false)
  const rolloverCheckedRef = useRef('')

  useEffect(() => {
    if (!currentUser || !pair) {
      setLevels(DEFAULT_LEVELS)
      setLoading(false)
      return
    }
    setLoading(true)
    isRemoteUpdate.current = true
    const unsubscribe = subscribeLevels(
      currentUser.uid,
      pair,
      (data) => {
        isRemoteUpdate.current = true
        setLevels(data)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )
    return () => {
      unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [currentUser, pair])

  // Rollover: if the live doc's stamped period differs from the current period,
  // archive the old H/L into levelHistory, then reset the live fields for fresh entry.
  useEffect(() => {
    if (!currentUser || !pair || loading) return
    const checkKey = `${pair}`
    if (rolloverCheckedRef.current === checkKey) return
    rolloverCheckedRef.current = checkKey

    const nowWeekId = currentWeekId()
    const nowDayId = todayISO()

    async function runRollover() {
      const patch = {}

      if (levels.weeklyPeriodId && levels.weeklyPeriodId !== nowWeekId && (levels.weeklyHigh || levels.weeklyLow)) {
        await saveLevelHistoryRecord(currentUser.uid, `${pair}-weekly-${levels.weeklyPeriodId}`, {
          pair,
          period: 'weekly',
          periodId: levels.weeklyPeriodId,
          high: levels.weeklyHigh,
          low: levels.weeklyLow,
          open: levels.weeklyOpen,
          recordedAt: new Date().toISOString(),
        })
        patch.weeklyHigh = ''
        patch.weeklyLow = ''
        patch.weeklyOpen = ''
      }
      if (!levels.weeklyPeriodId || levels.weeklyPeriodId !== nowWeekId) {
        patch.weeklyPeriodId = nowWeekId
      }

      if (levels.dailyPeriodId && levels.dailyPeriodId !== nowDayId && (levels.dailyHigh || levels.dailyLow)) {
        await saveLevelHistoryRecord(currentUser.uid, `${pair}-daily-${levels.dailyPeriodId}`, {
          pair,
          period: 'daily',
          periodId: levels.dailyPeriodId,
          high: levels.dailyHigh,
          low: levels.dailyLow,
          open: levels.dailyOpen,
          recordedAt: new Date().toISOString(),
        })
        patch.dailyHigh = ''
        patch.dailyLow = ''
        patch.dailyOpen = ''
      }
      if (!levels.dailyPeriodId || levels.dailyPeriodId !== nowDayId) {
        patch.dailyPeriodId = nowDayId
      }

      if (Object.keys(patch).length > 0) {
        try {
          await saveLevels(currentUser.uid, pair, patch)
        } catch (err) {
          setError(err.message)
        }
      }

      try {
        const history = await fetchLatestLevelHistory(currentUser.uid, pair)
        setPreviousDay(history.previousDay)
        setPreviousWeek(history.previousWeek)
      } catch (err) {
        setError(err.message)
      }
    }

    runRollover().catch((err) => setError(err.message))
  }, [currentUser, pair, loading, levels])

  function updateLevels(patch) {
    isRemoteUpdate.current = false
    setLevels((prev) => {
      const next = { ...prev, ...patch }
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        if (!currentUser || !pair) return
        try {
          setSaving(true)
          await saveLevels(currentUser.uid, pair, next)
        } catch (err) {
          setError(err.message)
        } finally {
          setSaving(false)
        }
      }, DEBOUNCE_MS)
      return next
    })
  }

  return { levels, loading, error, saving, updateLevels, previousDay, previousWeek }
}
