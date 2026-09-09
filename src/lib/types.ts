/**
 * Beszel data shapes (subset that the UI consumes).
 *
 * Beszel is built on PocketBase; `systems` carries a JSON blob with the most
 * recent metrics, and `system_stats` / `container_stats` are time-series
 * collections used for charts.
 */

export interface PBRecord {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
}

/** `systems.info` JSON blob (live snapshot pushed by agent). */
export interface SystemInfo {
  h?: string // hostname
  k?: string // kernel
  c?: number // cpu cores
  t?: number // threads
  m?: string // cpu model
  u?: number // uptime (seconds)
  b?: number // legacy bandwidth field (not a monthly counter in Beszel 0.19)
  bb?: number // aggregate current bandwidth, KiB/s (directionless)
  cpu?: number // cpu percent 0-100
  mp?: number // memory percent
  dp?: number // disk percent
  du?: number // legacy field; current disk values live in system_stats
  dt?: number // legacy field; not total disk capacity in Beszel 0.19
  ns?: number // legacy network sent bytes/s
  nr?: number // legacy network received bytes/s
  tmax?: number // max temp
  la?: [number, number, number] // loadavg
  os?: number // os enum
}

export interface System extends PBRecord {
  name: string
  host: string
  port?: string
  status: 'up' | 'down' | 'paused' | string
  info?: SystemInfo
  users?: string[]
}

/** `system_stats` records (one row per minute per system). */
export interface SystemStat extends PBRecord {
  system: string // system id
  stats: {
    cpu?: number
    mp?: number
    dp?: number
    d?: number // disk total, GiB
    du?: number // disk used, GiB
    b?: [number, number] // aggregate [received, sent], KiB/s
    ni?: Record<string, [number, number, number, number]> // per-interface rates + totals, KiB units
    // Legacy fields kept for older Beszel/mock payload compatibility.
    ns?: number
    nr?: number
    tmax?: number
    la?: [number, number, number]
  }
}

export interface Container extends PBRecord {
  system: string
  container_id: string
  name: string
  image?: string
  status?: string
  health?: number
  cpu?: number
  memory?: number
  net_sent?: number
  net_recv?: number
  started?: string
}

export interface Alert extends PBRecord {
  system: string
  name: string
  value: number
  min?: number
  active: boolean
  triggered?: string
}

export interface AlertHistory extends PBRecord {
  alert: string
  system: string
  name: string
  value: number
  min?: number
  resolved?: string | null
}
