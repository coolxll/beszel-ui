import type { Alert, Container, System, SystemStat } from './types'

/**
 * Mock data used when VITE_NO_AUTH=true (visual review only, no backend).
 * Shapes mirror what the real PocketBase API returns.
 *
 * The mock is "live": `startMockTicker` mutates a shared state once per
 * second so the dashboard visibly moves. Numbers are chosen to look like a
 * typical homelab: cpu 5–80%, mem 20–90%, net 100–800 KB/s with occasional
 * MB-class spikes.
 */

export interface MockLive {
  systems: System[]
  /** Per-system time series, oldest first. Each tick appends one row and
   *  drops the oldest, keeping the last `POINTS` minutes. */
  stats: Map<string, SystemStat[]>
  containers: Container[]
  alerts: Alert[]
  version: number // bumped every tick so subscribers can re-render
  /** Per-system recent CPU samples (last ~20s) for card sparklines. */
  cpuTrail: Map<string, number[]>
  /** Mock-only system metadata (alias, hardware description). */
  meta: Map<string, { alias?: string; hw?: string }>
}

const POINTS = 60
const now = Date.now()

// ---------- helpers ----------

function seededRandom(seedRef: { v: number }) {
  return () => {
    seedRef.v = (seedRef.v * 9301 + 49297) % 233280
    return seedRef.v / 233280
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function walk(prev: number, drift: number, lo: number, hi: number, r: () => number) {
  return clamp(prev + (r() - 0.5) * drift, lo, hi)
}

// ---------- initial systems ----------

interface SystemSeed {
  id: string
  name: string
  host: string
  /** Optional human-friendly alias shown next to the name (e.g. homepage's 主控网关). */
  alias?: string
  /** Short hardware description shown on the detail page. */
  hw?: string
  cpuBase: number
  mpBase: number
  dpBase: number
  nrBaseKB: number // KB/s baseline
  nsBaseKB: number
  uptimeSec: number
  status: System['status']
  diskGB: number
  os: number
}

const SEEDS: SystemSeed[] = [
  { id: 's1', name: 'rn-direct', host: 'edge-gw-01', alias: '主控网关', hw: '3 vCPU · 3.8 GB RAM · 62 GB SSD (Ubuntu 22.04)', cpuBase: 15.7, mpBase: 54.6, dpBase: 41, nrBaseKB: 0.08, nsBaseKB: 0.02, uptimeSec: 12 * 86400, status: 'up', diskGB: 62, os: 0 },
  { id: 's2', name: 'corp172-dev', host: 'corp172', alias: '高性能开发机', hw: '12C24T · 62.4 GB RAM · 2.7 TB (CentOS 7)', cpuBase: 0.4, mpBase: 7.2, dpBase: 1.3, nrBaseKB: 0.009, nsBaseKB: 0.003, uptimeSec: 3 * 86400, status: 'up', diskGB: 2765, os: 0 },
  { id: 's3', name: 'wujie', host: 'wujie', alias: '机械革命 无界15X', hw: '8C16T R7-8745HS · 15.3 GB RAM · 1 TB NVMe (Win11 WSL2)', cpuBase: 0.6, mpBase: 18.9, dpBase: 0.9, nrBaseKB: 0.06, nsBaseKB: 0.02, uptimeSec: 40 * 86400, status: 'up', diskGB: 1024, os: 1 },
  { id: 's4', name: 'ddrk', host: 'ddrk', alias: 'DediRock 美西节点', hw: '1 vCPU · 1.9 GB RAM · 29 GB SSD (Debian 13)', cpuBase: 2.2, mpBase: 25.4, dpBase: 19.5, nrBaseKB: 0.012, nsBaseKB: 0.004, uptimeSec: 86 * 86400, status: 'up', diskGB: 29, os: 0 },
  { id: 's5', name: 'jph2', host: 'jph2', alias: '日本 VPS', hw: '1 vCPU · 1.0 GB RAM · 5 GB SSD (Ubuntu 22.04)', cpuBase: 29.1, mpBase: 54.6, dpBase: 66.6, nrBaseKB: 0.007, nsBaseKB: 0.002, uptimeSec: 7 * 86400, status: 'up', diskGB: 5, os: 0 },
  { id: 's6', name: 'la-tri', host: 'la-tri', alias: '洛杉矶 VPS', hw: '1 vCPU · 1.0 GB RAM · 10 GB SSD (Debian 13)', cpuBase: 0.9, mpBase: 63.7, dpBase: 56.2, nrBaseKB: 0.014, nsBaseKB: 0.005, uptimeSec: 0, status: 'down', diskGB: 10, os: 0 },
  { id: 's7', name: 'r9kp-wsl', host: 'r9kp-wsl', alias: 'R9000P 工作站', hw: '8C16T · 15.5 GB RAM · 1 TB NVMe (Win11 WSL2)', cpuBase: 1.8, mpBase: 17.6, dpBase: 0.9, nrBaseKB: 0.06, nsBaseKB: 0.02, uptimeSec: 2 * 86400, status: 'up', diskGB: 1024, os: 1 },
  { id: 's8', name: 'k14', host: 'k14', alias: 'DF-K14 轻量终端', hw: '2 vCPU · 3.7 GB RAM · 1 TB (Arch Linux)', cpuBase: 0.9, mpBase: 30.8, dpBase: 1.4, nrBaseKB: 0.001, nsBaseKB: 0.0005, uptimeSec: 5 * 86400, status: 'up', diskGB: 1024, os: 0 },
]

function makeSystem(seed: SystemSeed, tickOffsetSec: number): System {
  return {
    id: seed.id,
    collectionId: 'sys',
    collectionName: 'systems',
    created: new Date(now - 30 * 86400_000).toISOString(),
    updated: new Date(now - tickOffsetSec * 1000).toISOString(),
    name: seed.name,
    host: seed.host,
    status: seed.status,
    info: {
      h: seed.host,
      k: '6.8.0',
      c: 8,
      t: 16,
      m: 'AMD EPYC 7B13',
      u: seed.uptimeSec + tickOffsetSec,
      cpu: seed.cpuBase,
      mp: seed.mpBase,
      dp: seed.dpBase,
      la: [seed.cpuBase / 25, seed.cpuBase / 30, seed.cpuBase / 35],
      os: seed.os,
    },
  }
}

// ---------- initial live state ----------

function buildInitialLive(): MockLive {
  const systems = SEEDS.map((s) => makeSystem(s, 0))
  const stats = new Map<string, SystemStat[]>()

  for (const seed of SEEDS) {
    if (seed.status !== 'up') {
      stats.set(seed.id, [])
      continue
    }
    const rng = { v: seed.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) }
    const r = seededRandom(rng)
    let cpu = seed.cpuBase
    let mp = seed.mpBase
    let dp = seed.dpBase
    let nrKB = seed.nrBaseKB
    let nsKB = seed.nsBaseKB

    const series: SystemStat[] = []
    for (let i = POINTS - 1; i >= 0; i--) {
      // random walk with occasional spikes
      const spike = r() < 0.04 ? 3 + r() * 5 : 1
      cpu = walk(cpu, 8, 2, 95, r)
      mp = walk(mp, 1.5, 10, 95, r)
      dp = walk(dp, 0.1, 5, 98, r)
      nrKB = walk(nrKB * spike, seed.nrBaseKB * 0.4, 20, seed.nrBaseKB * 6, r)
      nsKB = walk(nsKB * spike, seed.nsBaseKB * 0.4, 10, seed.nsBaseKB * 6, r)

      const ts = new Date(now - i * 60_000).toISOString()
      series.push({
        id: `${seed.id}-st${i}`,
        collectionId: 'ss',
        collectionName: 'system_stats',
        created: ts,
        updated: ts,
        system: seed.id,
        stats: {
          cpu,
          mp,
          dp,
          d: seed.diskGB,
          du: seed.diskGB * dp / 100,
          b: [nrKB, nsKB],
        },
      })
    }
    stats.set(seed.id, series)

    // sync the live system info with the last stat point so cards and charts agree
    const last = series[series.length - 1]
    const sys = systems.find((s) => s.id === seed.id)
    if (sys?.info) {
      sys.info.cpu = last.stats.cpu
      sys.info.mp = last.stats.mp
      sys.info.dp = last.stats.dp
    }
  }

  return {
    systems,
    stats,
    containers: buildContainers(),
    alerts: buildAlerts(),
    version: 0,
    cpuTrail: new Map(
      SEEDS.filter((s) => s.status === 'up').map((s) => [s.id, [s.cpuBase]]),
    ),
    meta: new Map(SEEDS.map((s) => [s.id, { alias: s.alias, hw: s.hw }])),
  }
}

function buildContainers(): Container[] {
  const ts = new Date(now - 60_000).toISOString()
  return [
    {
      id: 'c1', collectionId: 'ct', collectionName: 'containers',
      created: ts, updated: ts, system: 's2', container_id: 'a1b2c3',
      name: 'beszel-agent', image: 'henrygd/beszel-agent:latest',
      status: 'running', cpu: 1.2, memory: 24 * 1024 ** 2,
      net_recv: 120 * 1024 ** 2, net_sent: 84 * 1024 ** 2,
    },
    {
      id: 'c2', collectionId: 'ct', collectionName: 'containers',
      created: ts, updated: ts, system: 's2', container_id: 'd4e5f6',
      name: 'komodo-periphery', image: 'ghcr.io/moghtech/komodo-periphery:2',
      status: 'running', cpu: 0.4, memory: 128 * 1024 ** 2,
      net_recv: 512 * 1024 ** 2, net_sent: 256 * 1024 ** 2,
    },
    {
      id: 'c3', collectionId: 'ct', collectionName: 'containers',
      created: ts, updated: ts, system: 's2', container_id: 'g7h8i9',
      name: 'readeck', image: 'codeberg.org/readeck/readeck:latest',
      status: 'running', cpu: 3.8, memory: 220 * 1024 ** 2,
      net_recv: 1.2 * 1024 ** 3, net_sent: 800 * 1024 ** 2,
    },
    {
      id: 'c4', collectionId: 'ct', collectionName: 'containers',
      created: ts, updated: ts, system: 's1', container_id: 'j0k1l2',
      name: 'homelab-beszel', image: 'henrygd/beszel:latest',
      status: 'running', cpu: 6.4, memory: 380 * 1024 ** 2,
      net_recv: 4.2 * 1024 ** 3, net_sent: 1.8 * 1024 ** 3,
    },
    {
      id: 'c5', collectionId: 'ct', collectionName: 'containers',
      created: ts, updated: ts, system: 's1', container_id: 'm3n4o5',
      name: 'tinyauth', image: 'ghcr.io/steveiliop56/tinyauth:v3',
      status: 'running', cpu: 0.8, memory: 64 * 1024 ** 2,
      net_recv: 200 * 1024 ** 2, net_sent: 140 * 1024 ** 2,
    },
  ]
}

function buildAlerts(): Alert[] {
  return [
    {
      id: 'a1', collectionId: 'al', collectionName: 'alerts',
      created: new Date(now - 2 * 3600_000).toISOString(),
      updated: new Date(now - 2 * 3600_000).toISOString(),
      system: 's4', name: 'CPU 过高', value: 78.4, min: 85,
      active: true, triggered: new Date(now - 25 * 60_000).toISOString(),
    },
    {
      id: 'a2', collectionId: 'al', collectionName: 'alerts',
      created: new Date(now - 86400_000).toISOString(),
      updated: new Date(now - 3600_000).toISOString(),
      system: 's2', name: '内存超过 75%', value: 78.9, min: 75,
      active: true, triggered: new Date(now - 3600_000).toISOString(),
    },
    {
      id: 'a3', collectionId: 'al', collectionName: 'alerts',
      created: new Date(now - 3 * 86400_000).toISOString(),
      updated: new Date(now - 3 * 86400_000).toISOString(),
      system: 's6', name: '主机离线', value: 0,
      active: true, triggered: new Date(now - 2 * 3600_000).toISOString(),
    },
    {
      id: 'a4', collectionId: 'al', collectionName: 'alerts',
      created: new Date(now - 5 * 86400_000).toISOString(),
      updated: new Date(now - 5 * 86400_000).toISOString(),
      system: 's1', name: '磁盘用量', value: 33.5, min: 80,
      active: false, triggered: new Date(now - 5 * 86400_000).toISOString(),
    },
  ]
}

// ---------- live singleton + ticker ----------

let live: MockLive | null = null
let ticker: number | null = null
const listeners = new Set<() => void>()

export function getMockLive(): MockLive {
  if (!live) live = buildInitialLive()
  return live
}

export function subscribeMock(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * Advances every "up" system by one second: cpu/mem walk a tiny bit, network
 * gets a 1-second reading (with rare spikes), and once per simulated minute
 * a new point is appended to the chart series.
 */
export function tickMock() {
  if (!live) return
  const r = Math.random
  live.version++

  for (const sys of live.systems) {
    if (sys.status !== 'up' || !sys.info) continue
    const seed = SEEDS.find((s) => s.id === sys.id)
    if (!seed) continue

    const spike = r() < 0.02 ? 4 + r() * 6 : 1
    sys.info.u = (sys.info.u ?? 0) + 1
    sys.info.cpu = clamp((sys.info.cpu ?? seed.cpuBase) + (r() - 0.5) * 1.6, 1.5, 98)
    sys.info.mp = clamp((sys.info.mp ?? seed.mpBase) + (r() - 0.5) * 0.4, 8, 96)
    sys.info.dp = clamp((sys.info.dp ?? seed.dpBase) + (r() - 0.5) * 0.01, 5, 98)
    const nrTarget = seed.nrBaseKB * spike * (0.6 + r() * 0.8)
    const nsTarget = seed.nsBaseKB * spike * (0.6 + r() * 0.8)
    sys.info.nr = clamp(nrTarget * 1024, 5 * 1024, seed.nrBaseKB * 8 * 1024)
    sys.info.ns = clamp(nsTarget * 1024, 3 * 1024, seed.nsBaseKB * 8 * 1024)
    sys.updated = new Date().toISOString()

    // maintain sparkline trail
    const trail = live.cpuTrail.get(sys.id) ?? []
    trail.push(sys.info.cpu)
    if (trail.length > 20) trail.shift()
    live.cpuTrail.set(sys.id, trail)
  }

  // append one chart point every 5 ticks (~5s real time) to keep the chart visibly scrolling
  if (live.version % 5 === 0) {
    for (const sys of live.systems) {
      if (sys.status !== 'up' || !sys.info) continue
      const seed = SEEDS.find((s) => s.id === sys.id)
      if (!seed) continue
      const series = live.stats.get(sys.id)
      if (!series) continue
      const ts = new Date().toISOString()
      series.push({
        id: `${sys.id}-st${live.version}`,
        collectionId: 'ss',
        collectionName: 'system_stats',
        created: ts,
        updated: ts,
        system: sys.id,
        stats: {
          cpu: sys.info.cpu ?? 0,
          mp: sys.info.mp ?? 0,
          dp: sys.info.dp ?? 0,
          d: seed.diskGB,
          du: seed.diskGB * (sys.info.dp ?? 0) / 100,
          b: [
            (sys.info.nr ?? 0) / 1024,
            (sys.info.ns ?? 0) / 1024,
          ],
        },
      })
      if (series.length > POINTS) series.shift()
    }
  }

  for (const fn of listeners) fn()
}

export function startMockTicker(intervalMs = 1000) {
  if (ticker !== null) return
  ticker = window.setInterval(tickMock, intervalMs)
}

export function stopMockTicker() {
  if (ticker !== null) {
    window.clearInterval(ticker)
    ticker = null
  }
}
