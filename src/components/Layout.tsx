import { NavLink, Outlet, useNavigate } from 'react-router'
import { Activity, Bell, Boxes, LayoutDashboard, LogOut, Moon, Server, Sun } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme'
import { NO_AUTH } from '../lib/pb'

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

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Server size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Beszel UI</div>
            <div className="text-[10px] text-zinc-500">nezha style</div>
          </div>
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
      <main className="ml-56 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
