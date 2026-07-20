import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, pairLabel } from '../utils/formatters'

const SESSION_LABELS = {
  london: 'London',
  newyork: 'New York',
  asian: 'Asian',
  pacific: 'Pacific',
}

function groupTrades(trades, groupBy) {
  const groups = {}
  for (const t of trades) {
    const key = t[groupBy]
    if (!key) continue
    if (!groups[key]) groups[key] = { key, pnl: 0, wins: 0, losses: 0, count: 0 }
    groups[key].pnl += Number(t.pnl) || 0
    groups[key].count += 1
    if (t.result === 'win') groups[key].wins += 1
    if (t.result === 'loss') groups[key].losses += 1
  }
  return Object.values(groups)
    .map((g) => ({
      ...g,
      name: groupBy === 'session' ? SESSION_LABELS[g.key] || g.key : pairLabel(g.key),
      pnl: Number(g.pnl.toFixed(2)),
      winRate: g.wins + g.losses > 0 ? (g.wins / (g.wins + g.losses)) * 100 : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl)
}

export default function PerformanceBreakdown({ trades, groupBy, title, description }) {
  const data = groupTrades(trades, groupBy)

  return (
    <div className="card">
      <h2 className="mb-1 text-sm font-semibold text-text">{title}</h2>
      <p className="mb-4 text-xs text-text-dim">{description}</p>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-text-dim">No trades yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262C38" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#8B96AC', fontSize: 11 }}
                axisLine={{ stroke: '#262C38' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8B96AC', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                cursor={{ fill: '#1A1F28' }}
                contentStyle={{
                  background: '#1A1F28',
                  border: '1px solid #262C38',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#8B96AC' }}
                formatter={(value, name, props) => [
                  formatCurrency(value, { showSign: true }),
                  `P&L (${props.payload.count} trades, ${props.payload.winRate.toFixed(0)}% WR)`,
                ]}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.pnl >= 0 ? '#22C58B' : '#F0555F'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
