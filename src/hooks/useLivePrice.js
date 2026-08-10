import { useCallback, useRef, useState } from 'react'

const TWELVEDATA_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY
const ALPHAVANTAGE_KEY = import.meta.env.VITE_ALPHAVANTAGE_API_KEY

function toTwelveDataSymbol(pair) {
  return `${pair.slice(0, 3)}/${pair.slice(3)}`
}

async function fetchTwelveData(pair) {
  if (!TWELVEDATA_KEY) throw new Error('Twelve Data API key not configured')

  const symbol = toTwelveDataSymbol(pair)
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVEDATA_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status}`)

  const data = await res.json()
  if (data.status === 'error' || data.code) {
    throw new Error(data.message || 'Twelve Data error')
  }
  const price = Number(data.price)
  if (!Number.isFinite(price)) throw new Error('Twelve Data returned no price')

  return { price, source: 'Twelve Data', at: Date.now() }
}

async function fetchAlphaVantage(pair) {
  if (!ALPHAVANTAGE_KEY) throw new Error('Alpha Vantage API key not configured')

  const from = pair.slice(0, 3)
  const to = pair.slice(3)
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHAVANTAGE_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}`)

  const data = await res.json()
  const rate = data['Realtime Currency Exchange Rate']?.['5. Exchange Rate']
  const price = Number(rate)
  if (!Number.isFinite(price)) {
    throw new Error(data.Note || data.Information || 'Alpha Vantage returned no price')
  }

  return { price, source: 'Alpha Vantage', at: Date.now() }
}

/** Fetches a live price for `pair` (e.g. "EURUSD") on demand, preferring
 *  Twelve Data and falling back to Alpha Vantage if the primary errors out. */
export function useLivePrice(pair) {
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const prevPriceRef = useRef(null)
  const prevPairRef = useRef(pair)
  const [direction, setDirection] = useState('flat')

  const fetchPrice = useCallback(async () => {
    if (prevPairRef.current !== pair) {
      prevPriceRef.current = null
      prevPairRef.current = pair
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchTwelveData(pair)
      apply(result)
    } catch (primaryErr) {
      try {
        const result = await fetchAlphaVantage(pair)
        apply(result, primaryErr)
      } catch (fallbackErr) {
        setError(`Both providers failed. ${primaryErr.message} / ${fallbackErr.message}`)
        setLoading(false)
      }
    }

    function apply(result, warning) {
      const prev = prevPriceRef.current
      setDirection(prev == null ? 'flat' : result.price > prev ? 'up' : result.price < prev ? 'down' : 'flat')
      prevPriceRef.current = result.price
      setQuote(result)
      setError(warning ? `Using fallback (${result.source}): ${warning.message}` : null)
      setLoading(false)
    }
  }, [pair])

  return { quote, error, loading, direction, fetchPrice }
}
