import { useMemo } from 'react'
import { useContainers } from '../hooks/useContainers'
import { useSystems } from '../hooks/useSystems'
import { formatBytes, formatPercent } from '../lib/format'

export default function ContainersPage() {
  const { containers, loading, error } = useContainers()
  const { systems } = useSystems()

  const systemName = useMemo(() => {
    const m = new Map(systems.map((s) => [s.id, s.name]))
    return (id: string) => m.get(id) ?? id
  }, [systems])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">容器</h1>
        <p className="text-xs text-zinc-500">跨主机 Docker 容器（来自 Beszel agent）</p>
      </header>

      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-zinc-500">加载中…</div>
      ) : containers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
          没有容器数据
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-2">主机</th>
                <th className="px-3 py-2">名称</th>
                <th className="px-3 py-2">镜像</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">CPU</th>
                <th className="px-3 py-2">内存</th>
                <th className="px-3 py-2">网络 ↓/↑</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {containers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/40">
                  <td className="px-3 py-2 text-zinc-400">{systemName(c.system)}</td>
                  <td className="px-3 py-2 font-mono text-zinc-200">{c.name}</td>
                  <td className="max-w-[260px] truncate px-3 py-2 text-zinc-400">
                    {c.image ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{c.status ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300">
                    {formatPercent(c.cpu)}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-300">
                    {formatBytes(c.memory)}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-300">
                    {formatBytes(c.net_recv)} / {formatBytes(c.net_sent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
