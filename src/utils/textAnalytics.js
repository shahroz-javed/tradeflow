export const MISTAKE_TAGS = [
  { key: 'fomo', label: 'FOMO', patterns: ['fomo'] },
  { key: 'movedSl', label: 'Moved Stop Loss', patterns: ['moved sl', 'moved stop', 'widened sl', 'widened stop'] },
  { key: 'earlyEntry', label: 'Early Entry', patterns: ['early entry', 'entered early', 'jumped in'] },
  { key: 'lateEntry', label: 'Late Entry', patterns: ['late entry', 'entered late', 'chased'] },
  { key: 'revenge', label: 'Revenge Trading', patterns: ['revenge'] },
  { key: 'oversized', label: 'Oversized Position', patterns: ['oversized', 'too big', 'over-leveraged', 'overleveraged'] },
  { key: 'noConfirmation', label: 'No Confirmation', patterns: ['no confirmation', 'without confirmation', 'no confluence'] },
  { key: 'hesitated', label: 'Hesitated', patterns: ['hesitated', 'hesitation', 'missed entry'] },
  { key: 'overtraded', label: 'Overtraded', patterns: ['overtraded', 'overtrading', 'too many trades'] },
  { key: 'ignoredPlan', label: 'Ignored Plan', patterns: ['ignored plan', 'ignored my plan', 'deviated from plan', 'broke my rules'] },
]

/**
 * Tallies curated mistake tags across trades' free-text `mistakes` field.
 * Returns entries sorted by total $ impact (sum of pnl on losing trades matching the tag), descending.
 */
export function analyzeMistakes(trades) {
  const results = MISTAKE_TAGS.map((tag) => ({ ...tag, count: 0, dollarImpact: 0, tradeIds: [] }))

  for (const trade of trades) {
    const text = (trade.mistakes || '').toLowerCase()
    if (!text.trim()) continue

    for (const entry of results) {
      const matched = entry.patterns.some((p) => text.includes(p))
      if (matched) {
        entry.count += 1
        entry.tradeIds.push(trade.id)
        if (Number(trade.pnl) < 0) {
          entry.dollarImpact += Number(trade.pnl)
        }
      }
    }
  }

  return results
    .filter((e) => e.count > 0)
    .sort((a, b) => a.dollarImpact - b.dollarImpact) // most negative (worst) first
}
