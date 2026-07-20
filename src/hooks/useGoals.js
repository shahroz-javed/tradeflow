import { useEffect, useMemo, useRef, useState } from 'react'
import { computeStats, useTrades } from './useTrades'
import { useAppStore } from '../store/useAppStore'
import { saveGoalRecord, subscribeGoalHistory } from '../firebase/goals'
import {
  currentMonthId,
  currentWeekId,
  dayRange,
  monthRange,
  todayISO,
  weekRange,
} from '../utils/formatters'

function statsForRange(trades, start, end) {
  const inRange = trades.filter((t) => {
    const d = new Date(t.date)
    return d >= start && d <= end
  })
  return computeStats(inRange)
}

/** Previous calendar day/week/month, so we know what to backfill into history. */
function previousPeriods(now = new Date()) {
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const lastWeekDate = new Date(now)
  lastWeekDate.setDate(now.getDate() - 7)

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  return { yesterday, lastWeekDate, lastMonthDate }
}

export function useGoals() {
  const currentUser = useAppStore((s) => s.user)
  const profile = useAppStore((s) => s.profile)
  const { trades } = useTrades()
  const [history, setHistory] = useState([])
  const backfilledRef = useRef(false)

  useEffect(() => {
    if (!currentUser) return
    const unsubscribe = subscribeGoalHistory(currentUser.uid, setHistory)
    return () => unsubscribe()
  }, [currentUser])

  const dailyTarget = Number(profile?.dailyPnlTarget) || 0
  const weeklyTarget = Number(profile?.weeklyPnlTarget) || 0
  const monthlyTarget = Number(profile?.monthlyPnlTarget) || 0
  const maxDrawdownLimit = Number(profile?.maxDrawdownLimit) || 0

  const daily = useMemo(() => {
    const { start, end } = dayRange()
    return statsForRange(trades, start, end)
  }, [trades])

  const weekly = useMemo(() => {
    const { start, end } = weekRange()
    return statsForRange(trades, start, end)
  }, [trades])

  const monthly = useMemo(() => {
    const { start, end } = monthRange()
    return statsForRange(trades, start, end)
  }, [trades])

  // Lazily backfill yesterday/last-week/last-month snapshots into history once,
  // the first time this hook runs after that period has fully elapsed.
  useEffect(() => {
    if (!currentUser || backfilledRef.current || trades.length === 0) return
    backfilledRef.current = true

    const now = new Date()
    const { yesterday, lastWeekDate, lastMonthDate } = previousPeriods(now)

    const dailyId = `daily-${todayISO(yesterday)}`
    const weeklyId = `weekly-${currentWeekId(lastWeekDate)}`
    const monthlyId = `monthly-${currentMonthId(lastMonthDate)}`

    const existingIds = new Set(history.map((h) => h.id))

    if (!existingIds.has(dailyId) && dailyTarget > 0) {
      const { start, end } = dayRange(yesterday)
      const stats = statsForRange(trades, start, end)
      saveGoalRecord(currentUser.uid, dailyId, {
        period: 'daily',
        target: dailyTarget,
        actual: stats.totalPnl,
        achieved: stats.totalPnl >= dailyTarget,
        trades: stats.total,
      }).catch(() => {})
    }

    if (!existingIds.has(weeklyId) && weeklyTarget > 0) {
      const { start, end } = weekRange(lastWeekDate)
      const stats = statsForRange(trades, start, end)
      saveGoalRecord(currentUser.uid, weeklyId, {
        period: 'weekly',
        target: weeklyTarget,
        actual: stats.totalPnl,
        achieved: stats.totalPnl >= weeklyTarget,
        trades: stats.total,
      }).catch(() => {})
    }

    if (!existingIds.has(monthlyId) && monthlyTarget > 0) {
      const { start, end } = monthRange(lastMonthDate)
      const stats = statsForRange(trades, start, end)
      saveGoalRecord(currentUser.uid, monthlyId, {
        period: 'monthly',
        target: monthlyTarget,
        actual: stats.totalPnl,
        achieved: stats.totalPnl >= monthlyTarget,
        trades: stats.total,
      }).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, trades, history, dailyTarget, weeklyTarget, monthlyTarget])

  return {
    targets: { dailyTarget, weeklyTarget, monthlyTarget, maxDrawdownLimit },
    daily,
    weekly,
    monthly,
    history,
  }
}
