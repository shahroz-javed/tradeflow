import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TradePlanner from './pages/TradePlanner'
import Journal from './pages/Journal'
import Analytics from './pages/Analytics'
import TradeForm from './pages/TradeForm'
import TradeDetail from './pages/TradeDetail'
import Levels from './pages/Levels'
import Sessions from './pages/Sessions'
import Events from './pages/Events'
import Routines from './pages/Routines'
import WeeklyReview from './pages/WeeklyReview'
import MonthlyReview from './pages/MonthlyReview'
import Settings from './pages/Settings'
import { useAppStore } from './store/useAppStore'



export default function App() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    root.classList.remove('theme-dark', 'theme-light')
    if (theme === 'dark') {
      root.classList.add('theme-dark')
    } else if (theme === 'light') {
      root.classList.add('theme-light')
    } else {
      root.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
    }
  }, [theme])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/planner" element={<TradePlanner />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/new" element={<TradeForm />} />
        <Route path="/journal/:id/edit" element={<TradeForm />} />
        <Route path="/journal/:id" element={<TradeDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/levels" element={<Levels />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/events" element={<Events />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/review" element={<WeeklyReview />} />
        <Route path="/review/monthly" element={<MonthlyReview />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
