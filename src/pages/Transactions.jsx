import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Trash2, Wallet } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatCard from '../components/StatCard'
import { useTransactions } from '../hooks/useTransactions'
import { useAppStore } from '../store/useAppStore'
import { formatCurrency, formatDate, formatPercent, pnlColorClass, todayISO } from '../utils/formatters'
import { computeLifetimeStats } from '../utils/lifetimeStats'

const KIND_OPTIONS = [
  { value: 'deposit', label: 'Deposit', cls: 'border-profit bg-profit/15 text-profit' },
  { value: 'withdrawal', label: 'Withdrawal', cls: 'border-loss bg-loss/15 text-loss' },
]

function TransactionForm({ accountType, onAdd }) {
  const [date, setDate] = useState(todayISO())
  const [kind, setKind] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      await onAdd({ date, kind, amount: Number(amount), note, type: accountType })
      setAmount('')
      setNote('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="text-sm font-semibold text-text">Add Transaction — {accountType.toUpperCase()}</h2>

      <div>
        <label className="label">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {KIND_OPTIONS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                kind === k.value ? k.cls : 'border-border bg-panel-2 text-text-dim hover:text-text'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            required
            className="input-base mono"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Amount ($)</label>
          <input
            type="number"
            step="any"
            min="0"
            required
            className="input-base mono"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Note (optional)</label>
        <input
          type="text"
          className="input-base"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. profit withdrawal, top-up from salary"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Add Transaction'}
      </button>
    </form>
  )
}

export default function Transactions() {
  const accountType = useAppStore((s) => s.accountType)
  const profile = useAppStore((s) => s.profile)
  const { allTransactions, loading, create, remove } = useTransactions()
  const [deleteTarget, setDeleteTarget] = useState(null)

  const transactions = useMemo(
    () => allTransactions.filter((t) => t.type === accountType),
    [allTransactions, accountType],
  )

  const balance = accountType === 'demo' ? profile?.demoBalance : profile?.liveBalance
  const stats = useMemo(
    () => computeLifetimeStats(allTransactions, accountType, balance),
    [allTransactions, accountType, balance],
  )

  async function handleDelete() {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Transactions</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net Deposited"
          value={formatCurrency(stats.netDeposited)}
          subValue={`${formatCurrency(stats.totalDeposited)} in / ${formatCurrency(stats.totalWithdrawn)} out`}
          icon={Wallet}
        />
        <StatCard
          label="Current Balance"
          value={formatCurrency(stats.balance)}
          subValue={accountType.toUpperCase()}
          icon={Wallet}
        />
        <StatCard
          label="Lifetime Gain/Loss"
          value={formatCurrency(stats.lifetimeGainLoss, { showSign: true })}
          valueClassName={pnlColorClass(stats.lifetimeGainLoss)}
          icon={stats.lifetimeGainLoss >= 0 ? ArrowUpCircle : ArrowDownCircle}
        />
        <StatCard
          label="Lifetime Return"
          value={formatPercent(stats.lifetimeReturnPct)}
          subValue="vs. net deposited"
          valueClassName={pnlColorClass(stats.lifetimeReturnPct)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TransactionForm accountType={accountType} onAdd={create} />
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-text">
            History — {accountType.toUpperCase()}
          </h2>
          {loading ? (
            <div className="py-10 text-center text-sm text-text-dim">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-dim">
              No transactions logged yet for this account.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                    t.kind === 'deposit' ? 'border-profit/30 bg-profit/10' : 'border-loss/30 bg-loss/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {t.kind === 'deposit' ? (
                      <ArrowUpCircle size={16} className="shrink-0 text-profit" />
                    ) : (
                      <ArrowDownCircle size={16} className="shrink-0 text-loss" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-text">
                        {t.kind === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        {t.note && <span className="ml-2 text-xs text-text-dim">{t.note}</span>}
                      </div>
                      <div className="text-xs text-text-dim">{formatDate(t.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`mono text-sm font-semibold ${
                        t.kind === 'deposit' ? 'text-profit' : 'text-loss'
                      }`}
                    >
                      {t.kind === 'deposit' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(t)}
                      className="rounded p-1 text-text-dim hover:bg-black/20 hover:text-loss"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete transaction?"
        message="This will permanently remove this transaction from your history."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
