import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth/AuthContext'
import { HAS_SERVICE_ACCOUNT, NO_AUTH } from './lib/pb'
import Layout from './components/Layout'
import LoginPage from './auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ServerDetailPage from './pages/ServerDetailPage'
import ContainersPage from './pages/ContainersPage'
import AlertsPage from './pages/AlertsPage'
import TrafficPage from './pages/TrafficPage'

function RequireAuth() {
  const { isAuthed, isReady } = useAuth()
  const location = useLocation()

  if (NO_AUTH) return <Outlet />

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        加载中…
      </div>
    )
  }
  if (!isAuthed && !HAS_SERVICE_ACCOUNT) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!isAuthed && HAS_SERVICE_ACCOUNT) {
    // Service account failed to authenticate; do not redirect to /login
    // because credentials are baked in and a manual login page would be
    // misleading. Show a clear error instead.
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <h2 className="mb-2 font-semibold">服务账号登录失败</h2>
          <p>
            构建时嵌入的 PocketBase 服务账号无法登录 Beszel Hub。
            请检查 <code>VITE_PB_EMAIL</code> / <code>VITE_PB_PASSWORD</code>
            是否正确、目标账号是否被删除或禁用。
          </p>
        </div>
      </div>
    )
  }
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/servers/:id', element: <ServerDetailPage /> },
          { path: '/containers', element: <ContainersPage /> },
          { path: '/traffic', element: <TrafficPage /> },
          { path: '/alerts', element: <AlertsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
