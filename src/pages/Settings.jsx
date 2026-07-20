import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { changePassword } from '../firebase/auth'

export default function Settings() {
  const { profile, updateProfile } = useProfile()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [demoBalance, setDemoBalance] = useState('')
  const [liveBalance, setLiveBalance] = useState('')
  const [riskPercent, setRiskPercent] = useState('')
  const [leverage, setLeverage] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  const [dailyPnlTarget, setDailyPnlTarget] = useState('')
  const [weeklyPnlTarget, setWeeklyPnlTarget] = useState('')
  const [monthlyPnlTarget, setMonthlyPnlTarget] = useState('')
  const [maxDrawdownLimit, setMaxDrawdownLimit] = useState('')
  const [goalsSaving, setGoalsSaving] = useState(false)
  const [goalsMessage, setGoalsMessage] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName || '')
    setDemoBalance(profile.demoBalance ?? '')
    setLiveBalance(profile.liveBalance ?? '')
    setRiskPercent(profile.riskPercent ?? '')
    setLeverage(profile.leverage ?? '')
    setDailyPnlTarget(profile.dailyPnlTarget ?? '')
    setWeeklyPnlTarget(profile.weeklyPnlTarget ?? '')
    setMonthlyPnlTarget(profile.monthlyPnlTarget ?? '')
    setMaxDrawdownLimit(profile.maxDrawdownLimit ?? '')
  }, [profile])

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')
    try {
      await updateProfile({
        displayName,
        demoBalance: Number(demoBalance),
        liveBalance: Number(liveBalance),
        riskPercent: Number(riskPercent),
        leverage: Number(leverage),
      })
      setProfileMessage('Profile updated.')
    } catch (err) {
      setProfileMessage(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleGoalsSave(e) {
    e.preventDefault()
    setGoalsSaving(true)
    setGoalsMessage('')
    try {
      await updateProfile({
        dailyPnlTarget: Number(dailyPnlTarget) || 0,
        weeklyPnlTarget: Number(weeklyPnlTarget) || 0,
        monthlyPnlTarget: Number(monthlyPnlTarget) || 0,
        maxDrawdownLimit: Number(maxDrawdownLimit) || 0,
      })
      setGoalsMessage('Goals updated.')
    } catch (err) {
      setGoalsMessage(err.message)
    } finally {
      setGoalsSaving(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(newPassword)
      setPasswordMessage('Password updated.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-text">Settings</h1>

      <form onSubmit={handleProfileSave} className="card space-y-4">
        <h2 className="text-sm font-semibold text-text">Profile</h2>

        {profileMessage && <p className="text-xs text-text-dim">{profileMessage}</p>}

        <div>
          <label className="label">Display Name</label>
          <input
            type="text"
            className="input-base"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Demo Balance ($)</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={demoBalance}
              onChange={(e) => setDemoBalance(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Live Balance ($)</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={liveBalance}
              onChange={(e) => setLiveBalance(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Default Risk %</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Default Leverage</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={profileSaving} className="btn-primary w-full">
          {profileSaving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={handleGoalsSave} className="card space-y-4">
        <h2 className="text-sm font-semibold text-text">Goals &amp; Targets</h2>
        <p className="text-xs text-text-dim">
          Tracked against the current account type&apos;s trades. Shown as progress bars on the Dashboard.
        </p>

        {goalsMessage && <p className="text-xs text-text-dim">{goalsMessage}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Daily P&amp;L Target ($)</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={dailyPnlTarget}
              onChange={(e) => setDailyPnlTarget(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
          <div>
            <label className="label">Weekly P&amp;L Target ($)</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={weeklyPnlTarget}
              onChange={(e) => setWeeklyPnlTarget(e.target.value)}
              placeholder="e.g. 250"
            />
          </div>
          <div>
            <label className="label">Monthly P&amp;L Target ($)</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={monthlyPnlTarget}
              onChange={(e) => setMonthlyPnlTarget(e.target.value)}
              placeholder="e.g. 1000"
            />
          </div>
          <div>
            <label className="label">Max Drawdown Limit ($)</label>
            <input
              type="number"
              step="any"
              className="input-base mono"
              value={maxDrawdownLimit}
              onChange={(e) => setMaxDrawdownLimit(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
        </div>

        <button type="submit" disabled={goalsSaving} className="btn-primary w-full">
          {goalsSaving ? 'Saving…' : 'Save Goals'}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="card space-y-4">
        <h2 className="text-sm font-semibold text-text">Change Password</h2>

        {passwordError && (
          <div className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
            {passwordError}
          </div>
        )}
        {passwordMessage && <p className="text-xs text-profit">{passwordMessage}</p>}

        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            className="input-base"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            className="input-base"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={passwordSaving} className="btn-secondary w-full">
          {passwordSaving ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <div className="card">
        <button type="button" onClick={handleLogout} className="btn-danger w-full">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )
}
