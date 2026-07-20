import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { loading } = useAuth()
  const user = useAppStore((s) => s.user)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-sm text-text-dim">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
