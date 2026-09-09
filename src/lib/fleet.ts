import { diskMetrics, networkRates, type StatsPayload } from './metrics'
import type { System } from './types'

/** Beszel `info.os` enum → display metadata. Values from beszel-agent source. */
export const OS_META: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Linux', emoji: '🐧' },
  1: { label: 'Windows', emoji: '🪟' },
  2: { label: 'macOS', emoji: '🍎' },
  3: { label: 'FreeBSD', emoji: '😈' },
  4: { label: 'OpenBSD', emoji: '🐡' },
  5: { label: 'NetBSD', emoji: '🚩' },
  6: { label: 'Solaris', emoji: '☀️' },
}

export function osMeta(os: number | undefined) {
  return OS_META[os ?? -1] ?? { label: 'OS', emoji: '💻' }
}

/** Aggregate top-level stats across all systems for the dashboard header. */
export interface FleetStats {
  total: number
  up: number
  down: number
  paused: number
  /** aggregate current throughput, bytes/s */
  recvBps: number
  sentBps: number
  diskUsedBytes: number
  diskTotalBytes: number
}

export function aggregateFleet(
  systems: System[],
  latestStats: Map<string, StatsPayload>,
): FleetStats {
  let up = 0
  let down = 0
  let paused = 0
  let recvBps = 0
  let sentBps = 0
  let diskUsedBytes = 0
  let diskTotalBytes = 0
  for (const s of systems) {
    if (s.status === 'up') {
      up++
      const rates = networkRates(latestStats.get(s.id))
      recvBps += rates.recvBps ?? 0
      sentBps += rates.sentBps ?? 0
      const disk = diskMetrics(s.info ?? {}, latestStats.get(s.id))
      diskUsedBytes += disk.usedBytes ?? 0
      diskTotalBytes += disk.totalBytes ?? 0
    } else if (s.status === 'paused') {
      paused++
    } else {
      down++
    }
  }
  return {
    total: systems.length,
    up,
    down,
    paused,
    recvBps,
    sentBps,
    diskUsedBytes,
    diskTotalBytes,
  }
}
