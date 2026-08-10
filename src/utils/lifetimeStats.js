/**
 * Computes lifetime net-deposited and gain/loss for one account type
 * ('demo' | 'live') from a transactions array and the current balance.
 *
 * Net Deposited = deposits - withdrawals (money actually put in, net of what was taken out)
 * Lifetime Gain/Loss = Current Balance - Net Deposited
 * Lifetime Return % = Lifetime Gain/Loss / Net Deposited * 100
 */
export function computeLifetimeStats(transactions, accountType, currentBalance) {
  const scoped = transactions.filter((t) => t.type === accountType)

  const totalDeposited = scoped
    .filter((t) => t.kind === 'deposit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const totalWithdrawn = scoped
    .filter((t) => t.kind === 'withdrawal')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const netDeposited = totalDeposited - totalWithdrawn
  const balance = Number(currentBalance) || 0
  const lifetimeGainLoss = balance - netDeposited
  const lifetimeReturnPct = netDeposited > 0 ? (lifetimeGainLoss / netDeposited) * 100 : 0

  return {
    totalDeposited,
    totalWithdrawn,
    netDeposited,
    balance,
    lifetimeGainLoss,
    lifetimeReturnPct,
  }
}
