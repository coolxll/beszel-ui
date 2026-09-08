import { useEffect, useState } from 'react'
import { NO_AUTH, pb } from '../lib/pb'
import { getMockLive, startMockTicker, subscribeMock } from '../lib/mock'
import type { SystemStat } from '../lib/types'

/**
 * Fetches recent `system_stats` rows for a single system, oldest-first.
 * `minutes` controls the lookback window. Default 60 minutes matches Beszel's
 * default 1-minute stats interval.
 */
export function useSystemStats(systemId: string | undefined, minutes = 60) {
  const [stats, setStats] = useState<SystemStat[]>(() =>
    NO_AUTH && systemId ? (getMockLive().stats.get(systemId) ?? []) : [],
  )
  const [loading, setLoading] = useState(!NO_AUTH)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (NO_AUTH) {
      startMockTicker()
      setStats(systemId ? (getMockLive().stats.get(systemId) ?? []) : [])
      setLoading(false)
      const unsub = subscribeMock(() => {
        if (!systemId) return
        const series = getMockLive().stats.get(systemId)
        if (series) setStats([...series])
      })
      return unsub
    }
    if (!systemId) {
      setStats([])
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const since = new Date(Date.now() - minutes * 60_000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
        const list = await pb.collection('system_stats').getList<SystemStat>(1, 500, {
          filter: `system = "${systemId}" && created > "${since}"`,
          sort: 'created',
        })
        if (!cancelled) {
          setStats(list.items)
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

    // Refresh every 30s so the chart stays live without a WS subscription.
    const timer = window.setInterval(load, 30_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [systemId, minutes])

  return { stats, loading, error }
}
