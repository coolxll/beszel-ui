import { useEffect, useMemo, useState } from 'react'
import { NO_AUTH, pb } from '../lib/pb'
import { getMockLive } from '../lib/mock'
import { networkTotalsBetween, type NetworkTotals } from '../lib/metrics'
import type { System, SystemStat } from '../lib/types'

export interface PeriodTraffic {
  today: NetworkTotals
  month: NetworkTotals
  todayComplete: boolean
  monthComplete: boolean
  firstSample?: string
}

const EMPTY: PeriodTraffic = {
  today: { sentBytes: 0, recvBytes: 0 },
  month: { sentBytes: 0, recvBytes: 0 },
  todayComplete: false,
  monthComplete: false,
}

export function useNetworkTraffic(systems: System[]) {
  const [traffic, setTraffic] = useState<Map<string, PeriodTraffic>>(new Map())
  const [loading, setLoading] = useState(!NO_AUTH)
  const [error, setError] = useState<string | null>(null)
  const systemIds = useMemo(() => systems.map((system) => system.id).sort(), [systems])
  const idsKey = systemIds.join(',')

  useEffect(() => {
    if (systemIds.length === 0) {
      setTraffic(new Map())
      setLoading(false)
      return
    }

    if (NO_AUTH) {
      const rowsBySystem = getMockLive().stats
      const periods = periodStarts()
      setTraffic(
        new Map(
          systemIds.map((id) => {
            const rows = rowsBySystem.get(id) ?? []
            return [id, totalsForPeriods(rows, periods)]
          }),
        ),
      )
      setLoading(false)
      return
    }

    let cancelled = false
    let cachedRows: SystemStat[] = []
    let lastCreated: string | null = null

    const load = async () => {
      try {
        const periods = periodStarts()
        const baseline = new Date(periods.month - 6 * 60 * 60_000)
        const timeFilter = lastCreated
          ? `created > "${lastCreated}"`
          : `created >= "${toPocketBaseDate(baseline)}"`
        const filter = `${timeFilter} && (${systemIds.map((id) => `system = "${id}"`).join(' || ')})`
        const rows = await pb.collection('system_stats').getFullList<SystemStat>({
          filter,
          sort: 'created',
          fields: 'system,stats,created',
          batch: 500,
        })

        if (cancelled) return
        if (rows.length > 0) {
          cachedRows.push(...rows)
          lastCreated = rows[rows.length - 1]?.created ?? lastCreated
        }

        const keepAfter = periods.month - 6 * 60 * 60_000
        cachedRows = cachedRows.filter((row) => recordTime(row.created) >= keepAfter)
        const grouped = new Map<string, SystemStat[]>()
        for (const row of cachedRows) {
          const list = grouped.get(row.system) ?? []
          list.push(row)
          grouped.set(row.system, list)
        }
        setTraffic(
          new Map(
            systemIds.map((id) => [
              id,
              totalsForPeriods(grouped.get(id) ?? [], periods),
            ]),
          ),
        )
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '累计流量加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    void load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [idsKey])

  return { traffic, loading, error }
}

export function emptyPeriodTraffic() {
  return EMPTY
}

function totalsForPeriods(
  rows: SystemStat[],
  periods: ReturnType<typeof periodStarts>,
): PeriodTraffic {
  const firstSample = rows.find((row) => Object.keys(row.stats.ni ?? {}).length > 0)
  const firstTime = firstSample ? recordTime(firstSample.created) : Number.POSITIVE_INFINITY
  return {
    today: networkTotalsBetween(rows, periods.today, periods.now),
    month: networkTotalsBetween(rows, periods.month, periods.now),
    todayComplete: firstTime <= periods.today,
    monthComplete: firstTime <= periods.month,
    firstSample: firstSample?.created,
  }
}

function periodStarts() {
  const nowDate = new Date()
  return {
    now: nowDate.getTime(),
    today: new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
    ).getTime(),
    month: new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime(),
  }
}

function toPocketBaseDate(date: Date) {
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

function recordTime(value: string) {
  const normalized = value.replace(' ', 'T')
  const withZone = /(?:Z|[+-]\d\d:\d\d)$/.test(normalized)
    ? normalized
    : `${normalized}Z`
  return Date.parse(withZone)
}
