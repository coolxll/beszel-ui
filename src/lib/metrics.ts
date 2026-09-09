import type { SystemInfo, SystemStat } from './types'

const GIB = 1024 ** 3

export type StatsPayload = SystemStat['stats']

export function diskMetrics(info: SystemInfo, stats?: StatsPayload) {
  return {
    percent: stats?.dp ?? info.dp,
    usedBytes: stats?.du === undefined ? undefined : stats.du * GIB,
    totalBytes: stats?.d === undefined ? undefined : stats.d * GIB,
  }
}

export function networkRates(stats?: StatsPayload) {
  if (stats?.b) {
    return {
      sentBps: stats.b[0],
      recvBps: stats.b[1],
    }
  }

  return {
    recvBps: stats?.nr,
    sentBps: stats?.ns,
  }
}

export interface NetworkTotals {
  sentBytes: number
  recvBytes: number
}

/**
 * Sum network traffic from Beszel's per-interface cumulative byte counters.
 *
 * A counter smaller than its previous value means the host or interface was
 * reset. In that case the current value is traffic accumulated since reset.
 * Rows before `startMs` are used only as the boundary baseline.
 */
export function networkTotalsBetween(
  rows: SystemStat[],
  startMs: number,
  endMs = Date.now(),
): NetworkTotals {
  const previous = new Map<string, { sent: number; recv: number }>()
  let sentBytes = 0
  let recvBytes = 0

  const sorted = [...rows].sort(
    (a, b) => recordTime(a.created) - recordTime(b.created),
  )

  for (const row of sorted) {
    const time = recordTime(row.created)
    if (!Number.isFinite(time) || time > endMs) continue

    for (const [name, counters] of Object.entries(row.stats.ni ?? {})) {
      const current = { sent: counters[2], recv: counters[3] }
      const prev = previous.get(name)

      if (time >= startMs && prev) {
        sentBytes += counterDelta(prev.sent, current.sent)
        recvBytes += counterDelta(prev.recv, current.recv)
      }

      previous.set(name, current)
    }
  }

  return { sentBytes, recvBytes }
}

function counterDelta(previous: number, current: number) {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return 0
  return current >= previous ? current - previous : current
}

function recordTime(value: string) {
  const normalized = value.replace(' ', 'T')
  const withZone = /(?:Z|[+-]\d\d:\d\d)$/.test(normalized)
    ? normalized
    : `${normalized}Z`
  return Date.parse(withZone)
}
