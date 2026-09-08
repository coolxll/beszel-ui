import { useMemo, useState } from 'react'
import { useSystems } from '../hooks/useSystems'
import ServerCard from '../components/ServerCard'

export default function DashboardPage() {
  const { systems, loading, error } = useSystems()
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

  const upCount = systems.filter((s) => s.status === 'up').length

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">总览</h1>
          <p className="text-xs text-zinc-500">
            {systems.length} 台主机 · {upCount} 在线 · {systems.length - upCount} 离线
          </p>
        </div>
        <input
          type="search"
          placeholder="搜索主机…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
        />
      </header>

      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-zinc-500">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
          没有匹配的主机
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((s) => (
            <ServerCard key={s.id} system={s} />
          ))}
        </div>
      )}
    </div>
  )
}
