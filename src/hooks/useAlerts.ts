import { useEffect, useState } from 'react'
import { NO_AUTH, pb } from '../lib/pb'
import { getMockLive, startMockTicker, subscribeMock } from '../lib/mock'
import type { Alert } from '../lib/types'

export function useAlerts(systemId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    if (!NO_AUTH) return []
    const all = getMockLive().alerts
    return systemId ? all.filter((a) => a.system === systemId) : all
  })
  const [loading, setLoading] = useState(!NO_AUTH)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (NO_AUTH) {
      startMockTicker()
      const unsub = subscribeMock(() => {
        const all = getMockLive().alerts
        setAlerts(systemId ? all.filter((a) => a.system === systemId) : all)
      })
      setLoading(false)
      return unsub
    }
    let cancelled = false
    const load = async () => {
      try {
        const filter = systemId ? `system = "${systemId}"` : undefined
        const list = await pb.collection('alerts').getFullList<Alert>({
          sort: '-triggered',
          filter,
        })
        if (!cancelled) {
          setAlerts(list)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(load, 30_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [systemId])

  return { alerts, loading, error }
}
