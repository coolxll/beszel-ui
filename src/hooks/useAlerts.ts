import { useEffect, useState } from 'react'
import { pb } from '../lib/pb'
import type { Alert } from '../lib/types'

export function useAlerts(systemId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
