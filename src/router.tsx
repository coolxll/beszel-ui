import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import LoginPage from './auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ServerDetailPage from './pages/ServerDetailPage'
import ContainersPage from './pages/ContainersPage'
import AlertsPage from './pages/AlertsPage'

function RequireAuth() {
  const { isAuthed, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        加载中…
      </div>
    )
  }
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
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
          { path: '/alerts', element: <AlertsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
