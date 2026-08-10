import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Gauge,
  Layers,
  LayoutDashboard,
  LineChart,
  LogOut,
  NotebookText,
  Radio,
  Settings as SettingsIcon,
  WalletCards,
  X,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useTrades } from '../hooks/useTrades'
import { useRoutines } from '../hooks/useRoutines'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner', label: 'Trade Planner', icon: Calculator },
  { to: '/journal', label: 'Journal', icon: ClipboardCheck, badge: 'trades' },
  { to: '/live-price', label: 'Live Price', icon: Radio },
  { to: '/transactions', label: 'Transactions', icon: WalletCards },
  { to: '/sessions', label: 'Sessions', icon: Clock },
  { to: '/events', label: 'Critical Events', icon: AlertTriangle },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/levels', label: 'Key Levels', icon: Layers },
  { to: '/routines', label: 'Routines', icon: Gauge, badge: 'routine' },
  { to: '/review', label: 'Weekly Review', icon: LineChart },
  { to: '/review/monthly', label: 'Monthly Review', icon: CalendarDays },
  { to: '/docs', label: 'Docs', icon: NotebookText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const accountType = useAppStore((s) => s.accountType)
  const setAccountType = useAppStore((s) => s.setAccountType)
  const profile = useAppStore((s) => s.profile)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const { logout } = useAuth()
  const { allTrades } = useTrades()
  const { completedCount, total } = useRoutines()

  const tradeCount = allTrades.filter((t) => t.type === accountType).length
  const balance = accountType === 'demo' ? profile?.demoBalance : profile?.liveBalance

  const content = (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
            T
          </div>
          <span className="text-base font-semibold text-text">TradeFlow</span>
        </div>
        <button
          type="button"
          className="rounded p-1 text-text-dim hover:text-text"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-dim hover:bg-panel-2 hover:text-text'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <item.icon size={17} />
              {item.label}
            </span>
            {item.badge === 'trades' && tradeCount > 0 && (
              <span className="mono rounded-full bg-panel-2 px-2 py-0.5 text-[10px] text-text-dim">
                {tradeCount}
              </span>
            )}
            {item.badge === 'routine' && (
              <span className="mono rounded-full bg-panel-2 px-2 py-0.5 text-[10px] text-text-dim">
                {completedCount}/{total}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="mono text-sm font-semibold text-text">
            {balance != null ? formatCurrency(balance) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="truncate text-sm text-text-dim">{profile?.displayName || 'Trader'}</span>
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="rounded p-1.5 text-text-dim hover:bg-loss/15 hover:text-loss"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">{content}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border">{content}</aside>
        </div>
      )}
    </>
  )
}
