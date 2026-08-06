import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useSessions } from '../hooks/useSessions'

export default function Layout() {
  const { activeSessionTheme } = useSessions()

  return (
    <div className={`min-h-screen bg-bg pt-[100px] session-${activeSessionTheme}`}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
