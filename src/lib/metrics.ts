import type { SystemInfo, SystemStat } from './types'

const KIB = 1024
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
      recvBps: stats.b[0] * KIB,
      sentBps: stats.b[1] * KIB,
    }
  }

  return {
    recvBps: stats?.nr,
    sentBps: stats?.ns,
  }
}
