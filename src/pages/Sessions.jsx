import { useSessions, formatCountdown } from '../hooks/useSessions'

export default function Sessions() {
  const { sessions, overlap } = useSessions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Trading Sessions</h1>
        <p className="text-sm text-text-dim">Live market hours — auto-converted to your local time</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>

      <OverlapBanner overlap={overlap} sessions={sessions} />
    </div>
  )
}

function SessionCard({ session }) {
  const { label, tz, openHour, openMin, closeHour, closeMin, isOpen, currentTime, secsToEvent, eventType } = session

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">{label} Session</h2>
        <span
          className={`mono rounded-full px-3 py-1 text-xs font-bold ${
            isOpen
              ? 'bg-profit/15 text-profit'
              : 'bg-loss/15 text-loss'
          }`}
        >
          {isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-text-dim">Timezone</div>
          <div className="mono mt-0.5 text-text">{tz}</div>
        </div>
        <div>
          <div className="text-xs text-text-dim">Current Time</div>
          <div className="mono mt-0.5 text-text">{currentTime}</div>
        </div>
        <div>
          <div className="text-xs text-text-dim">Open</div>
          <div className="mono mt-0.5 text-text">
            {String(openHour).padStart(2, '0')}:{String(openMin).padStart(2, '0')}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-dim">Close</div>
          <div className="mono mt-0.5 text-text">
            {String(closeHour).padStart(2, '0')}:{String(closeMin).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 ${
          isOpen
            ? 'border-profit/20 bg-profit/5'
            : 'border-border bg-panel-2'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-dim">
            {isOpen ? 'Closes in' : 'Opens in'}
          </span>
          <span className="mono text-lg font-bold text-text">
            {formatCountdown(secsToEvent)}
          </span>
        </div>
      </div>
    </div>
  )
}

function OverlapBanner({ overlap, sessions }) {
  if (overlap) {
    const s = sessions.find((x) => x.isOpen)
    const closer = sessions.reduce((a, b) => (a.secsToEvent < b.secsToEvent ? a : b))

    return (
      <div className="card border-warning/30 bg-warning/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div>
              <p className="font-semibold text-text">OVERLAP — Best Trading Time</p>
              <p className="text-sm text-text-dim">
                Both London and New York sessions are open
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-dim">Overlap ends in</div>
            <div className="mono text-lg font-bold text-warning">
              {formatCountdown(closer.secsToEvent)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const next = sessions.find((s) => !s.isOpen)
  if (!next) return null

  return (
    <div className="card border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⏳</span>
          <div>
            <p className="font-semibold text-text">Waiting for Session</p>
            <p className="text-sm text-text-dim">
              {next.label} opens in {formatCountdown(next.secsToEvent)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
