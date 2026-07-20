import { PAIRS, priceDistanceInPips } from './calculations'

export function rangeSize(high, low) {
  const h = Number(high)
  const l = Number(low)
  if (!h || !l) return 0
  return h - l
}

/** Distance in pips (or $ for commodities) between a reference price and a level. */
export function distanceInPips(pairKey, referencePrice, level) {
  const pair = PAIRS[pairKey]
  const ref = Number(referencePrice)
  const lvl = Number(level)
  if (!pair || !ref || !lvl) return null
  return priceDistanceInPips(pair, ref, lvl)
}

/**
 * Whether current H/L has broken through a reference (previous-period) H/L.
 * brokeHigh: current high exceeded the reference high (bullish break)
 * brokeLow: current low fell below the reference low (bearish break)
 */
export function checkBreak({ currentHigh, currentLow, referenceHigh, referenceLow }) {
  const ch = Number(currentHigh)
  const cl = Number(currentLow)
  const rh = Number(referenceHigh)
  const rl = Number(referenceLow)

  return {
    brokeHigh: !!ch && !!rh && ch > rh,
    brokeLow: !!cl && !!rl && cl < rl,
  }
}
