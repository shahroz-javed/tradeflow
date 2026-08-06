export const PAIRS = {
  EURUSD: { label: 'EUR/USD', type: 'USD_QUOTE', pipSize: 0.0001, contractSize: 100000, decimals: 5, unit: 'EUR', defEntry: 1.085, defSL: 1.083 },
  GBPUSD: { label: 'GBP/USD', type: 'USD_QUOTE', pipSize: 0.0001, contractSize: 100000, decimals: 5, unit: 'GBP', defEntry: 1.27, defSL: 1.268 },
  AUDUSD: { label: 'AUD/USD', type: 'USD_QUOTE', pipSize: 0.0001, contractSize: 100000, decimals: 5, unit: 'AUD', defEntry: 0.665, defSL: 0.663 },
  NZDUSD: { label: 'NZD/USD', type: 'USD_QUOTE', pipSize: 0.0001, contractSize: 100000, decimals: 5, unit: 'NZD', defEntry: 0.61, defSL: 0.608 },
  USDJPY: { label: 'USD/JPY', type: 'USD_BASE_JPY', pipSize: 0.01, contractSize: 100000, decimals: 3, unit: 'USD', defEntry: 160.02, defSL: 159.82 },
  USDCAD: { label: 'USD/CAD', type: 'USD_BASE', pipSize: 0.0001, contractSize: 100000, decimals: 5, unit: 'USD', defEntry: 1.365, defSL: 1.363 },
  USDCHF: { label: 'USD/CHF', type: 'USD_BASE', pipSize: 0.0001, contractSize: 100000, decimals: 5, unit: 'USD', defEntry: 0.895, defSL: 0.893 },
  XAUUSD: { label: 'XAU/USD (Gold)', type: 'COMMODITY', pipSize: 1, contractSize: 100, decimals: 2, unit: 'oz', defEntry: 4012.03, defSL: 4004.03 },
  XAGUSD: { label: 'XAG/USD (Silver)', type: 'COMMODITY', pipSize: 1, contractSize: 5000, decimals: 2, unit: 'oz', defEntry: 28.5, defSL: 28.3 },
}

export const PAIR_TYPE_LABELS = {
  USD_QUOTE: 'USD Quote',
  USD_BASE_JPY: 'USD Base (JPY)',
  USD_BASE: 'USD Base',
  COMMODITY: 'Commodity',
}

export const PAIR_GROUPS = [
  { label: 'USD Quote', pairs: ['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD'] },
  { label: 'USD Base', pairs: ['USDJPY', 'USDCAD', 'USDCHF'] },
  { label: 'Commodities', pairs: ['XAUUSD', 'XAGUSD'] },
]

/** Value in USD of a 1-pip move for one standard lot, at the given entry price. */
export function valuePerStdLot(pair, price) {
  if (pair.type === 'USD_QUOTE') return 10
  if (pair.type === 'COMMODITY') return pair.contractSize
  return (pair.pipSize / price) * pair.contractSize
}

/** Distance between two prices expressed in pips (or, for commodities, dollar units). */
export function priceDistanceInPips(pair, priceA, priceB) {
  return Math.abs(priceA - priceB) / pair.pipSize
}

export function calculateLotSize(riskAmount, slPips, pipValuePerLot) {
  if (!riskAmount || !slPips || !pipValuePerLot) {
    return { exact: 0, rounded: 0 }
  }
  const exact = riskAmount / (slPips * pipValuePerLot)
  const rounded = Math.floor(exact * 100) / 100 // always floor, never round up
  return { exact, rounded }
}

export function breakEvenWinRate(rr) {
  if (!rr || rr <= 0) return 0
  return (1 / (1 + rr)) * 100
}

export function positionSizeUnits(pair, lots) {
  return lots * pair.contractSize
}

export function marginRequired(pair, lots, price, leverage) {
  if (!leverage) return 0
  const notional = positionSizeUnits(pair, lots) * price
  return notional / leverage
}

/** Direction is derived from prices, never chosen manually — SL below entry is always LONG. */
export function deriveDirection(entry, stopLoss) {
  if (!entry || !stopLoss || entry === stopLoss) return null
  return stopLoss < entry ? 'long' : 'short'
}

/**
 * Full trade-planner calculation given raw form inputs.
 * Direction is derived from entry/stopLoss, not passed in.
 * `spreadPips` accounts for the bid/ask spread — it reduces effective SL distance
 * and increases effective TP distance, so the real R:R is worse than the raw one.
 */
export function calculateTradePlan({ pairKey, capital, riskPercent, leverage, entry, stopLoss, takeProfit, spreadPips = 0 }) {
  const pair = PAIRS[pairKey]
  const empty = {
    pair,
    pipSize: pair?.pipSize ?? 0,
    valuePerLot: 0,
    riskAmount: 0,
    slPips: 0,
    tpPips: 0,
    effectiveSlPips: 0,
    effectiveTpPips: 0,
    riskReward: 0,
    effectiveRR: 0,
    lotExact: 0,
    lotRounded: 0,
    positionUnits: 0,
    margin: 0,
    freeMargin: capital || 0,
    actualRisk: 0,
    potentialProfit: 0,
    potentialLoss: 0,
    breakEvenWinRate: 0,
    direction: null,
    spreadPips,
    warning: '',
  }

  if (!pair || !capital) return empty

  if (isFinite(entry) && isFinite(stopLoss) && entry === stopLoss) {
    return { ...empty, warning: "Entry and stop-loss can't be the same price." }
  }

  if (!entry || !stopLoss) return empty

  const direction = deriveDirection(entry, stopLoss)
  const riskAmount = capital * (riskPercent / 100)
  const valuePerLot = valuePerStdLot(pair, entry)
  const slPips = priceDistanceInPips(pair, entry, stopLoss)
  const tpPips = takeProfit && takeProfit !== entry ? priceDistanceInPips(pair, entry, takeProfit) : 0

  const effectiveSlPips = Math.max(slPips - spreadPips, 0)
  const effectiveTpPips = tpPips + spreadPips

  const { exact: lotExact, rounded: lotRounded } = calculateLotSize(riskAmount, slPips, valuePerLot)

  const positionUnits = positionSizeUnits(pair, lotRounded)
  const margin = marginRequired(pair, lotRounded, entry, leverage)
  const freeMargin = capital - margin

  const actualRisk = lotRounded * slPips * valuePerLot
  const potentialLoss = actualRisk
  const potentialProfit = tpPips ? lotRounded * tpPips * valuePerLot : 0
  const riskReward = tpPips && slPips ? tpPips / slPips : 0
  const effectiveRR = effectiveTpPips && effectiveSlPips ? effectiveTpPips / effectiveSlPips : 0

  let warning = ''
  if (lotRounded === 0 && slPips > 0) {
    warning =
      "Position size rounds to 0 — increase risk %, tighten stop, or this trade isn't viable at current account size."
  } else if (effectiveSlPips <= 0 && slPips > 0) {
    warning =
      `Spread (${spreadPips} pip${spreadPips !== 1 ? 's' : ''}) is wider than your stop — this trade is not viable.`
  }

  return {
    pair,
    pipSize: pair.pipSize,
    valuePerLot,
    riskAmount,
    slPips,
    tpPips,
    effectiveSlPips,
    effectiveTpPips,
    lotExact,
    lotRounded,
    positionUnits,
    margin,
    freeMargin,
    actualRisk,
    potentialProfit,
    potentialLoss,
    riskReward,
    effectiveRR,
    breakEvenWinRate: breakEvenWinRate(riskReward),
    direction,
    spreadPips,
    warning,
  }
}

function formatDistanceForSummary(pair, pips) {
  if (!isFinite(pips)) return '—'
  return pair.type === 'COMMODITY' ? `$${pips.toFixed(2)}` : `${pips.toFixed(1)} pips`
}

/** Formatted plain-text trade summary for clipboard copy, matching the original planner's output. */
export function buildTradeSummary({ pairKey, capital, riskPercent, entry, stopLoss, takeProfit, plan }) {
  const pair = PAIRS[pairKey]
  if (!pair || !plan || !plan.direction) return ''

  const dirLabel = plan.direction === 'long' ? 'LONG' : 'SHORT'
  const slText = formatDistanceForSummary(pair, plan.slPips)
  const tpText = plan.tpPips ? formatDistanceForSummary(pair, plan.tpPips) : '—'
  const rrText = plan.riskReward ? `1:${plan.riskReward.toFixed(2)}` : '—'
  const beText = plan.breakEvenWinRate ? `${plan.breakEvenWinRate.toFixed(1)}%` : '—'

  let spreadLine = ''
  if (plan.spreadPips) {
    const effSlText = formatDistanceForSummary(pair, plan.effectiveSlPips)
    const effTpText = plan.tpPips ? formatDistanceForSummary(pair, plan.effectiveTpPips) : '—'
    const effRrText = plan.effectiveRR ? `1:${plan.effectiveRR.toFixed(2)}` : '—'
    spreadLine = `\nSpread:    ${plan.spreadPips.toFixed(1)} pips  |  Eff. SL: ${effSlText}  |  Eff. TP: ${effTpText}  |  Eff. R:R = ${effRrText}`
  }

  return `TRADE PLAN — ${pair.label} (${dirLabel})
Entry:      ${Number(entry).toFixed(pair.decimals)}
Stop Loss:  ${Number(stopLoss).toFixed(pair.decimals)}  (${slText})
Take Profit:${takeProfit ? Number(takeProfit).toFixed(pair.decimals) : '—'}  (${tpText})
R:R = ${rrText}  |  Breakeven win rate: ${beText}${spreadLine}

Account: $${Number(capital).toFixed(2)}  |  Risk: ${Number(riskPercent).toFixed(2)}% ($${plan.riskAmount.toFixed(2)})
Lot size: ${plan.lotRounded.toFixed(2)} (${plan.positionUnits.toLocaleString()} ${pair.unit})
Margin: $${plan.margin.toFixed(2)}  |  Free margin: $${plan.freeMargin.toFixed(2)}
Potential profit: ${formatCurrencyPlain(plan.potentialProfit)}  |  Potential loss: ${formatCurrencyPlain(plan.potentialLoss)}`
}

function formatCurrencyPlain(n) {
  if (!isFinite(n)) return '—'
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function riskMeterLevel(riskPercent) {
  if (riskPercent <= 2) return 'green'
  if (riskPercent <= 4) return 'amber'
  return 'red'
}
