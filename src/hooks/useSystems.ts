import { useEffect, useState } from 'react'
import { pb } from '../lib/pb'
import type { System } from '../lib/types'

export function useSystems() {
  const [systems, setSystems] = useState<System[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await pb.collection('systems').getFullList<System>({
          sort: 'name',
        })
        if (!cancelled) {
          setSystems(list)
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

    // Live updates from PocketBase realtime.
    let unsub: (() => void) | undefined
    pb.collection('systems')
      .subscribe<System>('*', (e) => {
        setSystems((prev) => {
          if (e.action === 'delete') {
            return prev.filter((s) => s.id !== e.record.id)
          }
          const idx = prev.findIndex((s) => s.id === e.record.id)
          if (idx === -1) return [...prev, e.record].sort((a, b) => a.name.localeCompare(b.name))
          const next = [...prev]
          next[idx] = e.record
          return next
        })
      })
      .then((u) => {
        unsub = u
      })
      .catch(() => {
        // subscription failed; polling fallback not required for MVP
      })

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [])

  return { systems, loading, error }
}
