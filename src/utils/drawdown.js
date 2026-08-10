/**
 * Computes drawdown from a trades array using the cumulative P&L curve.
 * Expects trades ordered date desc (as returned by subscribeTrades) — internally
 * walks oldest -> newest so the equity curve is chronological.
 *
 * Drawdown is measured against the running peak of cumulative P&L, so it holds
 * across month boundaries instead of resetting every calendar month.
 */
export function computeDrawdown(trades) {
  const chronological = [...trades]
    .filter((t) => t.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  let cumulative = 0
  let peak = 0
  let maxDrawdownPct = 0
  let maxDrawdownAmount = 0

  for (const t of chronological) {
    cumulative += Number(t.pnl) || 0
    peak = Math.max(peak, cumulative)
    const drawdownAmount = peak - cumulative
    const drawdownPct = peak > 0 ? (drawdownAmount / peak) * 100 : 0
    if (drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = drawdownPct
      maxDrawdownAmount = drawdownAmount
    }
  }

  const currentDrawdownAmount = peak - cumulative
  const currentDrawdownPct = peak > 0 ? (currentDrawdownAmount / peak) * 100 : 0

  return {
    currentDrawdownPct,
    currentDrawdownAmount,
    maxDrawdownPct,
    maxDrawdownAmount,
    peak,
    cumulative,
  }
}
