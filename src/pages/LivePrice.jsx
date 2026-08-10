import { useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, Minus, RefreshCw } from 'lucide-react'
import { PairTabs } from '../components/PairSelector'
import { useLivePrice } from '../hooks/useLivePrice'
import { PAIRS } from '../utils/calculations'
import { formatNumber, pairLabel } from '../utils/formatters'

const DIRECTION_STYLE = {
  up: { icon: ArrowUp, cls: 'text-profit' },
  down: { icon: ArrowDown, cls: 'text-loss' },
  flat: { icon: Minus, cls: 'text-text-dim' },
}

export default function LivePrice() {
  const [pair, setPair] = useState('EURUSD')
  const { quote, error, loading, direction, fetchPrice } = useLivePrice(pair)
  const pairMeta = PAIRS[pair]
  const decimals = pairMeta?.decimals ?? 5
  const dirInfo = DIRECTION_STYLE[direction]
  const DirIcon = dirInfo.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Live Price</h1>
        {quote && (
          <span className="text-xs text-text-dim">
            {quote.source} · {new Date(quote.at).toLocaleTimeString()}
          </span>
        )}
      </div>

      <PairTabs value={pair} onChange={setPair} />

      <div className="card flex flex-col items-center justify-center gap-5 py-16">
        <span className="text-sm font-medium text-text-dim">{pairMeta?.label || pairLabel(pair)}</span>

        {quote ? (
          <div className={`mono flex items-center gap-3 text-5xl font-bold ${dirInfo.cls}`}>
            <DirIcon size={36} />
            {formatNumber(quote.price, decimals)}
          </div>
        ) : (
          <div className="text-sm text-text-dim">No price fetched yet.</div>
        )}

        <button type="button" onClick={fetchPrice} disabled={loading} className="btn-primary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Fetching…' : quote ? 'Refresh Price' : 'Fetch Price'}
        </button>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <AlertTriangle size={13} />
            {error}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-text-dim">
        Fetches on demand only — click the button to pull the latest quote (Twelve Data, falling back to Alpha Vantage).
      </p>
    </div>
  )
}
