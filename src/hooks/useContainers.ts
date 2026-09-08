import { useEffect, useState } from 'react'
import { NO_AUTH, pb } from '../lib/pb'
import { getMockLive, startMockTicker, subscribeMock } from '../lib/mock'
import type { Container } from '../lib/types'

export function useContainers(systemId?: string) {
  const [containers, setContainers] = useState<Container[]>(() => {
    if (!NO_AUTH) return []
    const all = getMockLive().containers
    return systemId ? all.filter((c) => c.system === systemId) : all
  })
  const [loading, setLoading] = useState(!NO_AUTH)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (NO_AUTH) {
      startMockTicker()
      const unsub = subscribeMock(() => {
        const all = getMockLive().containers
        setContainers(systemId ? all.filter((c) => c.system === systemId) : all)
      })
      setLoading(false)
      return unsub
    }
    let cancelled = false
    const load = async () => {
      try {
        const filter = systemId ? `system = "${systemId}"` : undefined
        const list = await pb.collection('containers').getFullList<Container>({
          sort: 'name',
          filter,
        })
        if (!cancelled) {
          setContainers(list)
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

    const timer = window.setInterval(load, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [systemId])

  return { containers, loading, error }
}
