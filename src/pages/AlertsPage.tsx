import { useMemo } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { useSystems } from '../hooks/useSystems'
import { formatTime } from '../lib/format'
import StatusDot from '../components/StatusDot'

export default function AlertsPage() {
  const { alerts, loading, error } = useAlerts()
  const { systems } = useSystems()

  const systemName = useMemo(() => {
    const m = new Map(systems.map((s) => [s.id, s.name]))
    return (id: string) => m.get(id) ?? id
  }, [systems])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">报警</h1>
        <p className="text-xs text-zinc-500">Beszel 中配置的告警规则及触发状态</p>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-zinc-500">加载中…</div>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-200 dark:border-zinc-800">
          暂无告警
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-500">
              <tr>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">主机</th>
                <th className="px-3 py-2">规则</th>
                <th className="px-3 py-2">当前值</th>
                <th className="px-3 py-2">阈值</th>
                <th className="px-3 py-2">触发时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {alerts.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <StatusDot status={a.active ? 'down' : 'up'} />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {a.active ? 'active' : 'ok'}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{systemName(a.system)}</td>
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{a.name}</td>
                  <td className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-300">
                    {a.value?.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-600 dark:text-zinc-400">
                    {a.min !== undefined ? `≥ ${a.min}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{formatTime(a.triggered)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
