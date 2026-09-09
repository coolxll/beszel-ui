import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Activity,
  Bell,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Server,
  Sun,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme'
import { NO_AUTH } from '../lib/pb'
import { SystemsProvider } from '../hooks/SystemsContext'
import ErrorBoundary from './ErrorBoundary'

const nav = [
  { to: '/', label: '总览', icon: LayoutDashboard, end: true },
  { to: '/traffic', label: '流量', icon: Activity },
  { to: '/containers', label: '容器', icon: Boxes },
  { to: '/alerts', label: '报警', icon: Bell },
]

export default function Layout() {
  const { email, logout, isServiceAccount } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <div className="fixed top-0 right-0 left-0 z-10 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-900/40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Menu size={20} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Server size={16} />
        </div>
        <span className="text-sm font-semibold">Beszel UI</span>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900/40',
          'md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Server size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Beszel UI</div>
              <div className="text-[10px] text-zinc-500">nezha style</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100',
                )
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <button
            onClick={toggle}
            className="mb-2 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            {theme === 'dark' ? '亮色模式' : '暗色模式'}
          </button>
          <div className="mb-2 truncate px-1 text-xs text-zinc-500">
            {NO_AUTH
              ? 'demo (no-auth)'
              : isServiceAccount
                ? `${email ?? 'service'} (api)`
                : (email ?? '未登录')}
          </div>
          {!NO_AUTH && !isServiceAccount && (
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
            >
              <LogOut size={12} />
              登出
            </button>
          )}
        </div>
      </aside>
      <main className="mt-14 flex-1 p-6 md:mt-0 md:ml-56">
        <SystemsProvider>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </SystemsProvider>
      </main>
    </div>
  )
}
