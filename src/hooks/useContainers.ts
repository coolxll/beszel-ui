import { useEffect, useState } from 'react'
import { pb } from '../lib/pb'
import type { Container } from '../lib/types'

export function useContainers(systemId?: string) {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
