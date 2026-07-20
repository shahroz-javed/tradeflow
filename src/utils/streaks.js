/**
 * Computes win/loss streaks from a trades array.
 * Expects trades ordered date desc (as returned by subscribeTrades).
 * Breakeven results break a streak without starting a new one.
 */
export function computeStreaks(trades) {
  const decisive = trades.filter((t) => t.result === 'win' || t.result === 'loss')

  let current = { type: null, count: 0 }
  for (const t of decisive) {
    if (current.type === null) {
      current = { type: t.result, count: 1 }
    } else if (t.result === current.type) {
      current.count += 1
    } else {
      break
    }
  }

  let longestWinStreak = 0
  let longestLossStreak = 0
  let runType = null
  let runCount = 0

  // Walk oldest -> newest for "longest" streaks so runs are chronological.
  const chronological = [...decisive].reverse()
  for (const t of chronological) {
    if (t.result === runType) {
      runCount += 1
    } else {
      runType = t.result
      runCount = 1
    }
    if (runType === 'win') longestWinStreak = Math.max(longestWinStreak, runCount)
    if (runType === 'loss') longestLossStreak = Math.max(longestLossStreak, runCount)
  }

  return { current, longestWinStreak, longestLossStreak }
}
