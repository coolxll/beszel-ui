import { useMemo } from 'react'
import { Link } from 'react-router'
import { useNetworkTraffic } from '../hooks/useNetworkTraffic'
import { useSystems } from '../hooks/useSystems'
import { formatBytes } from '../lib/format'
import type { NetworkTotals } from '../lib/metrics'

export default function TrafficPage() {
  const { systems, loading: systemsLoading } = useSystems()
  const { traffic, loading, error } = useNetworkTraffic(systems)
  const totals = useMemo(() => {
    const today = { sentBytes: 0, recvBytes: 0 }
    const month = { sentBytes: 0, recvBytes: 0 }
    let todayComplete = systems.length > 0 && traffic.size === systems.length
    let monthComplete = systems.length > 0 && traffic.size === systems.length
    for (const value of traffic.values()) {
      today.sentBytes += value.today.sentBytes
      today.recvBytes += value.today.recvBytes
      month.sentBytes += value.month.sentBytes
      month.recvBytes += value.month.recvBytes
      todayComplete &&= value.todayComplete
      monthComplete &&= value.monthComplete
    }
    return { today, month, todayComplete, monthComplete }
  }, [systems.length, traffic])

  if (systemsLoading) return <div className="text-sm text-zinc-500">加载中…</div>

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">累计流量</h1>
        <p className="text-xs text-zinc-500">
          基于 Beszel agent 的网卡累计字节计数；自动处理主机或接口重启导致的计数器归零。
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TotalCard label="今日总流量" totals={totals.today} complete={totals.todayComplete} />
        <TotalCard label="本月总流量" totals={totals.month} complete={totals.monthComplete} />
      </section>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2">主机</th>
              <th className="px-3 py-2">今日下载</th>
              <th className="px-3 py-2">今日上传</th>
              <th className="px-3 py-2">本月下载</th>
              <th className="px-3 py-2">本月上传</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {systems.map((system) => {
              const value = traffic.get(system.id)
              return (
                <tr key={system.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/70">
                  <td className="px-3 py-2">
                    <Link className="font-medium hover:text-emerald-600" to={`/servers/${system.id}`}>
                      {system.name}
                    </Link>
                  </td>
                  <TrafficCell value={value?.today.recvBytes} loading={loading} complete={value?.todayComplete} />
                  <TrafficCell value={value?.today.sentBytes} loading={loading} complete={value?.todayComplete} />
                  <TrafficCell value={value?.month.recvBytes} loading={loading} complete={value?.monthComplete} />
                  <TrafficCell value={value?.month.sentBytes} loading={loading} complete={value?.monthComplete} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-500">
        自然日和自然月按浏览器本地时区计算；月初边界包含一个采样周期以内的误差。
      </p>
    </div>
  )
}

function TotalCard({
  label,
  totals,
  complete,
}: {
  label: string
  totals: NetworkTotals
  complete: boolean
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="text-xs text-zinc-500">
        {label}
        {!complete && <span className="ml-1 text-amber-600 dark:text-amber-400">（部分数据）</span>}
      </div>
      <div className="mt-1 font-mono text-xl">{formatBytes(totals.recvBytes + totals.sentBytes)}</div>
      <div className="mt-2 flex gap-4 text-xs text-zinc-500">
        <span>↓ {formatBytes(totals.recvBytes)}</span>
        <span>↑ {formatBytes(totals.sentBytes)}</span>
      </div>
    </div>
  )
}

function TrafficCell({
  value,
  loading,
  complete,
}: {
  value?: number
  loading: boolean
  complete?: boolean
}) {
  return (
    <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">
      {value === undefined && loading ? '加载中…' : formatBytes(value)}
      {value !== undefined && complete === false && (
        <span className="ml-1 font-sans text-[10px] text-amber-600 dark:text-amber-400">部分</span>
      )}
    </td>
  )
}
