import { useEffect, useMemo, useState } from 'react'
import { subscribeTrades } from '../firebase/trades'
import { useAppStore } from '../store/useAppStore'

export function computeStats(trades) {
  const total = trades.length
  const wins = trades.filter((t) => t.result === 'win').length
  const losses = trades.filter((t) => t.result === 'loss').length
  const breakevens = trades.filter((t) => t.result === 'breakeven').length
  const decisive = wins + losses
  const winRate = decisive > 0 ? (wins / decisive) * 100 : 0

  const totalPnl = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0)

  const rrTrades = trades.filter((t) => Number(t.actualRR) > 0)
  const avgRR =
    rrTrades.length > 0
      ? rrTrades.reduce((sum, t) => sum + Number(t.actualRR), 0) / rrTrades.length
      : 0

  const rulesFollowedCount = trades.filter((t) => t.rulesFollowed === true).length
  const ruleFollowRate = total > 0 ? (rulesFollowedCount / total) * 100 : 0

  return { total, wins, losses, breakevens, winRate, totalPnl, avgRR, ruleFollowRate }
}

export function useTrades({ scopeToAccountType = true } = {}) {
  const currentUser = useAppStore((s) => s.user)
  const accountType = useAppStore((s) => s.accountType)
  const [allTrades, setAllTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      setAllTrades([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeTrades(
      currentUser.uid,
      (trades) => {
        setAllTrades(trades)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [currentUser])

  const trades = useMemo(() => {
    if (!scopeToAccountType) return allTrades
    return allTrades.filter((t) => t.type === accountType)
  }, [allTrades, accountType, scopeToAccountType])

  const stats = useMemo(() => computeStats(trades), [trades])

  return { trades, allTrades, stats, loading, error }
}
