import { useState } from 'react'
import { Check, Menu, Moon, SunDim } from 'lucide-react'
import { useAppStore, ALL_INSTRUMENTS } from '../store/useAppStore'
import { useSessions, formatDuration, formatCountdown } from '../hooks/useSessions'
import { useEvents, getEventStage, getEventTimeInfo } from '../hooks/useEvents'

const THEME_OPTIONS = [
  { key: 'default', label: 'Auto', icon: SunDim },
  { key: 'light', label: 'Light', icon: SunDim },
  { key: 'dark', label: 'Dark', icon: Moon },
]

export default function Navbar() {
  const accountType = useAppStore((s) => s.accountType)
  const setAccountType = useAppStore((s) => s.setAccountType)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const [themeOpen, setThemeOpen] = useState(false)
  const { london, newyork, asian, overlap } = useSessions()
  const { activeAlert, nextEvent } = useEvents()
  const favoriteInstruments = useAppStore((s) => s.favoriteInstruments)

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[100px] items-center border-b border-border bg-panel px-4 md:px-6">
      <div className="flex w-full items-center justify-between gap-4">
        {/* Left: Hamburger + Brand + Toggle */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md border border-border bg-panel-2 p-2 text-text-dim hover:text-text md:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
              T
            </div>
            <span className="hidden text-base font-semibold text-text sm:inline">TradeFlow</span>
          </div>
          <div className="grid grid-cols-2 gap-0.5 rounded-md bg-panel-2 p-0.5">
            <button
              type="button"
              onClick={() => setAccountType('demo')}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                accountType === 'demo' ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
              }`}
            >
              DEMO
            </button>
            <button
              type="button"
              onClick={() => setAccountType('live')}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                accountType === 'live' ? 'bg-loss text-white' : 'text-text-dim hover:text-text'
              }`}
            >
              LIVE
            </button>
          </div>
        </div>

        {/* Center: Sessions */}
        <div className="flex items-center gap-3">
          <SessionBadge session={asian} />
          <SessionBadge session={london} />
          <SessionBadge session={newyork} />
          {overlap && (
            <div className="flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1.5">
              <span className="text-xs">⭐</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-warning">Overlap</span>
              <span className="mono text-[11px] text-warning">
                {formatCountdown(Math.min(london.secsToEvent, newyork.secsToEvent))}
              </span>
            </div>
          )}
          <WeekendWarning />
        </div>

        {/* Right: Theme + Event Alert */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen((o) => !o)}
              className="rounded-md border border-border bg-panel-2 p-2 text-text-dim hover:text-text transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' ? <Moon size={16} /> : <SunDim size={16} />}
            </button>
            {themeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-28 rounded-md border border-border bg-panel shadow-lg">
                  {THEME_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setTheme(opt.key); setThemeOpen(false) }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                        theme === opt.key
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-dim hover:text-text hover:bg-panel-2'
                      } ${i === 0 ? 'rounded-t-md' : ''} ${
                        i === THEME_OPTIONS.length - 1 ? 'rounded-b-md' : ''
                      }`}
                    >
                      {theme === opt.key ? <Check size={14} /> : <opt.icon size={14} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {activeAlert ? (
            (() => {
              const info = getEventTimeInfo(activeAlert)
              const s = info.stage
              const minsUntil = info.minsUntil
              const absMins = Math.abs(minsUntil)
              const timeLabel = minsUntil > 0 ? `in ${Math.floor(minsUntil/60) > 0 ? `${Math.floor(minsUntil/60)}h ` : ''}${minsUntil%60}m` : `${absMins}m ago`
              const affected = activeAlert.affected && activeAlert.affected.length > 0 ? activeAlert.affected : [activeAlert.currency]
              const favMatch = affected.filter((a) => favoriteInstruments.includes(a))
              return (
                <div className={`flex items-center gap-3 rounded-md border ${s.border} ${s.bg} px-4 py-2 ${s.blink ? 'animate-pulse' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{s.icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.label}</span>
                  </div>
                  <div className={`h-6 w-px ${s.border}`} />
                  <div>
                    <p className="mono text-xs font-bold text-text">{activeAlert.title}</p>
                    <p className={`text-[10px] ${s.text}`}>
                      {activeAlert.time} {activeAlert.timezone.split('/').pop()} — {s.action} {timeLabel}
                    </p>
                    <p className="text-[9px] text-text-dim">
                      {favMatch.length > 0
                        ? `⚠️ ${favMatch.join(', ')}`
                        : `Affects: ${affected.join(', ')}`}
                    </p>
                  </div>
                </div>
              )
            })()
          ) : nextEvent ? (
            (() => {
              const info = getEventTimeInfo(nextEvent)
              const minsUntil = info.minsUntil
              const s = info.stage
              const h = Math.floor(minsUntil / 60)
              const m = minsUntil % 60
              const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`
              const dot = nextEvent.impact === 'high' ? '🔴' : nextEvent.impact === 'medium' ? '🟠' : '🟡'
              const stageStyle = s || { bg: 'bg-panel-2', border: 'border-border', text: 'text-text-dim' }
              const affected = nextEvent.affected && nextEvent.affected.length > 0 ? nextEvent.affected : [nextEvent.currency]
              const favMatch = affected.filter((a) => favoriteInstruments.includes(a))
              return (
                <div className={`flex items-center gap-3 rounded-md border ${stageStyle.border} ${stageStyle.bg} px-4 py-2`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{dot}</span>
                    <span className={`text-[10px] font-medium ${s ? s.text : 'text-text-dim'}`}>
                      {s ? s.label : 'Next'}
                    </span>
                  </div>
                  <div className={`h-6 w-px ${stageStyle.border}`} />
                  <div>
                    <p className="mono text-xs font-semibold text-text">{nextEvent.title}</p>
                    <p className="text-[10px] text-text-dim">
                      {nextEvent.time} {nextEvent.timezone.split('/').pop()} — starts in {timeStr}
                    </p>
                    <p className="text-[9px] text-text-dim">
                      {favMatch.length > 0
                        ? `⚠️ ${favMatch.join(', ')}`
                        : `Affects: ${affected.join(', ')}`}
                    </p>
                  </div>
                </div>
              )
            })()
          ) : null}
        </div>
      </div>
    </header>
  )
}

function SessionBadge({ session }) {
  if (!session) return null
  const dot = session.isOpen ? '🟢' : '🔴'
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-panel-2 px-3 py-1.5">
      <span className="text-xs">{dot}</span>
      <div>
        <p className="text-[10px] font-medium text-text">{session.label}</p>
        <p className={`mono text-[10px] ${session.isOpen ? 'text-profit' : 'text-text-dim'}`}>
          {session.isOpen
            ? `Closes in ${formatCountdown(session.secsToEvent)}`
            : `Opens in ${formatCountdown(session.secsToEvent)}`}
        </p>
      </div>
    </div>
  )
}

function WeekendWarning() {
  const ny = new Intl.DateTimeFormat('en', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const day = ny.find((p) => p.type === 'weekday')?.value
  const hour = parseInt(ny.find((p) => p.type === 'hour')?.value || '0', 10)
  const minute = parseInt(ny.find((p) => p.type === 'minute')?.value || '0', 10)
  const second = parseInt(ny.find((p) => p.type === 'second')?.value || '0', 10)
  if (day !== 'Fri' || hour < 13) return null
  const secsToClose = 17 * 3600 - (hour * 3600 + minute * 60 + second)
  if (secsToClose <= 0) return (
    <div className="flex items-center gap-1.5 rounded-md border border-loss/40 bg-loss/10 px-3 py-1.5">
      <span className="text-xs">⚠️</span>
      <span className="text-[10px] font-bold text-loss">Market Closed</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-loss/30 bg-loss/10 px-3 py-1.5">
      <span className="text-xs">⚠️</span>
      <div>
        <p className="text-[10px] font-bold text-loss">Weekend Risk</p>
        <p className="mono text-[9px] text-loss/80">Closes in {formatCountdown(secsToClose)}</p>
      </div>
    </div>
  )
}

function getEventUtcMs(event) {
  try {
    const localMs = new Date(`${event.date}T${event.time}:00`).getTime()
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: event.timezone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date(localMs))
    const tzStr = parts.find((p) => p.type === 'timeZoneName')?.value || ''
    const m = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (m) {
      const sign = m[1] === '+' ? 1 : -1
      const offsetMin = sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10))
      return localMs - offsetMin * 60000
    }
  } catch {
    // fall through
  }
  return Infinity
}
