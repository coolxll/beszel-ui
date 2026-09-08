import { useMemo, useState } from 'react'
import { useSystems } from '../hooks/useSystems'
import { aggregateFleet } from '../lib/fleet'
import ServerCard from '../components/ServerCard'
import FleetStatsBar from '../components/FleetStatsBar'

export default function DashboardPage() {
  const { systems, cpuTrail, meta, loading, error } = useSystems()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return systems
    return systems.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.host.toLowerCase().includes(q) ||
        (s.info?.h ?? '').toLowerCase().includes(q),
    )
  }, [systems, query])

  const fleet = useMemo(() => aggregateFleet(systems), [systems])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">总览</h1>
          <p className="text-xs text-zinc-500">
            {fleet.total} 台主机 · {fleet.up} 在线 · {fleet.down} 离线
            {fleet.paused > 0 && ` · ${fleet.paused} 暂停`}
          </p>
        </div>
        <input
          type="search"
          placeholder="搜索主机…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </header>

      <FleetStatsBar stats={fleet} />

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-zinc-500">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
          没有匹配的主机
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((s) => (
            <ServerCard
              key={s.id}
              system={s}
              cpuTrail={cpuTrail.get(s.id)}
              alias={meta.get(s.id)?.alias}
            />
          ))}
        </div>
      )}
    </div>
  )
}
