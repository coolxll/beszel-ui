import { useEffect, useRef, useState } from 'react'
import { NO_AUTH, pb } from '../lib/pb'
import { getMockLive, startMockTicker, subscribeMock } from '../lib/mock'
import type { System, SystemStat } from '../lib/types'

const TRAIL_LEN = 20

function latestMockStats() {
  return new Map<string, SystemStat['stats']>(
    [...getMockLive().stats].flatMap(([id, rows]) => {
      const latest = rows[rows.length - 1]
      return latest ? [[id, latest.stats] as const] : []
    }),
  )
}

export interface SystemMeta {
  alias?: string
  hw?: string
}

export function useSystems() {
  const [systems, setSystems] = useState<System[]>(() =>
    NO_AUTH ? getMockLive().systems : [],
  )
  const [cpuTrail, setCpuTrail] = useState<Map<string, number[]>>(new Map())
  const [latestStats, setLatestStats] = useState<Map<string, SystemStat['stats']>>(
    () => (NO_AUTH ? latestMockStats() : new Map()),
  )
  const [meta, setMeta] = useState<Map<string, SystemMeta>>(() =>
    NO_AUTH ? getMockLive().meta : new Map(),
  )
  const [loading, setLoading] = useState(!NO_AUTH)
  const [error, setError] = useState<string | null>(null)
  const trailRef = useRef(new Map<string, number[]>())

  useEffect(() => {
    if (NO_AUTH) {
      startMockTicker()
      const unsub = subscribeMock(() => {
        const live = getMockLive()
        setSystems([...live.systems])
        setCpuTrail(new Map(live.cpuTrail))
        setLatestStats(latestMockStats())
        setMeta(new Map(live.meta))
      })
      return unsub
    }
    let cancelled = false

    const pushTrail = (id: string, cpu: number | undefined) => {
      if (cpu === undefined) return
      const t = trailRef.current.get(id) ?? []
      t.push(cpu)
      if (t.length > TRAIL_LEN) t.shift()
      trailRef.current.set(id, t)
    }

    const load = async () => {
      try {
        const list = await pb.collection('systems').getFullList<System>({
          sort: 'name',
        })
        if (!cancelled) {
          setSystems(list)
          for (const s of list) pushTrail(s.id, s.info?.cpu)
          setCpuTrail(new Map(trailRef.current))
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

    const loadLatestStats = async () => {
      try {
        const since = new Date(Date.now() - 30 * 60_000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
        const rows = await pb.collection('system_stats').getFullList<SystemStat>({
          filter: `created > "${since}"`,
          sort: '-created',
          fields: 'system,stats,created',
        })
        if (cancelled) return
        const next = new Map<string, SystemStat['stats']>()
        for (const row of rows) {
          if (!next.has(row.system)) next.set(row.system, row.stats)
        }
        setLatestStats(next)
      } catch {
        // Keep system status usable if the stats collection is temporarily unavailable.
      }
    }
    void loadLatestStats()
    const statsTimer = window.setInterval(loadLatestStats, 30_000)

    // Live updates from PocketBase realtime.
    let unsub: (() => void) | undefined
    pb.collection('systems')
      .subscribe<System>('*', (e) => {
        setSystems((prev) => {
          if (e.action === 'delete') {
            trailRef.current.delete(e.record.id)
            setCpuTrail(new Map(trailRef.current))
            return prev.filter((s) => s.id !== e.record.id)
          }
          pushTrail(e.record.id, e.record.info?.cpu)
          setCpuTrail(new Map(trailRef.current))
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
      window.clearInterval(statsTimer)
      unsub?.()
    }
  }, [])

  return { systems, cpuTrail, latestStats, meta, loading, error }
}
