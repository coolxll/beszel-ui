import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useSystems } from '../hooks/SystemsContext'
import { useSystemStats } from '../hooks/useSystemStats'
import { useContainers } from '../hooks/useContainers'
import StatusDot from '../components/StatusDot'
import TimeSeriesChart from '../components/charts/TimeSeriesChart'
import { osMeta } from '../lib/fleet'
import { flagForSystem } from '../lib/flags'
import { diskMetrics, networkRates } from '../lib/metrics'
import { emptyPeriodTraffic, useNetworkTraffic } from '../hooks/useNetworkTraffic'
import {
  formatBytes,
  formatBytesPerSec,
  formatPercent,
  formatUptime,
} from '../lib/format'

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { systems, meta, loading: systemsLoading } = useSystems()
  const system = useMemo(() => systems.find((s) => s.id === id), [systems, id])
  const systemMeta = id ? meta.get(id) : undefined
  const { stats, loading: statsLoading } = useSystemStats(id, 60)
  const { containers, loading: containersLoading } = useContainers(id)
  const { traffic, loading: trafficLoading } = useNetworkTraffic(system ? [system] : [])

  if (systemsLoading) return <div className="text-sm text-zinc-500">加载中…</div>
  if (!system) {
    return (
      <div className="space-y-3">
        <BackLink />
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          未找到该系统
        </div>
      </div>
    )
  }

  const info = system.info ?? {}
  const os = osMeta(info.os)
  const flag = flagForSystem(system)

  const latestStats = stats[stats.length - 1]?.stats
  const disk = diskMetrics(info, latestStats)
  const network = networkRates(latestStats)
  const periodTraffic = traffic.get(system.id) ?? emptyPeriodTraffic()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <BackLink />
        <StatusDot status={system.status} size={10} />
        {flag && <span className="text-base">{flag}</span>}
        <h1 className="text-xl font-semibold">
          {system.name}
          {systemMeta?.alias && (
            <span className="ml-2 text-base font-normal text-zinc-500">
              ({systemMeta.alias})
            </span>
          )}
        </h1>
        <span className="text-base" title={os.label}>
          {os.emoji}
        </span>
        <span className="text-xs text-zinc-500">
          {info.h ?? system.host} · up {formatUptime(info.u)}
        </span>
      </div>

      {systemMeta?.hw && (
        <p className="text-xs text-zinc-500">{systemMeta.hw}</p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="CPU" value={formatPercent(info.cpu)} />
        <StatCard label="内存" value={formatPercent(info.mp)} />
        <StatCard
          label="磁盘"
          value={`${formatBytes(disk.usedBytes)} / ${formatBytes(disk.totalBytes)}`}
        />
        <StatCard
          label="网络"
          value={`↓ ${formatBytesPerSec(network.recvBps)} ↑ ${formatBytesPerSec(network.sentBps)}`}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TrafficSummaryCard label="今日累计" totals={periodTraffic.today} loading={trafficLoading} complete={periodTraffic.todayComplete} />
        <TrafficSummaryCard label="本月累计" totals={periodTraffic.month} loading={trafficLoading} complete={periodTraffic.monthComplete} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="CPU %" loading={statsLoading}>
          <TimeSeriesChart
            min={0}
            max={100}
            series={[
              {
                label: 'CPU',
                color: '#34d399',
                values: stats.map((s) => s.stats.cpu ?? 0),
              },
            ]}
            format={(v) => `${v.toFixed(1)}%`}
          />
        </ChartCard>
        <ChartCard title="内存 %" loading={statsLoading}>
          <TimeSeriesChart
            min={0}
            max={100}
            series={[
              {
                label: '内存',
                color: '#38bdf8',
                values: stats.map((s) => s.stats.mp ?? 0),
              },
            ]}
            format={(v) => `${v.toFixed(1)}%`}
          />
        </ChartCard>
        <ChartCard title="磁盘 %" loading={statsLoading}>
          <TimeSeriesChart
            min={0}
            max={100}
            series={[
              {
                label: '磁盘',
                color: '#fbbf24',
                values: stats.map((s) => s.stats.dp ?? 0),
              },
            ]}
            format={(v) => `${v.toFixed(1)}%`}
          />
        </ChartCard>
        <ChartCard title="网络 B/s" loading={statsLoading}>
          <TimeSeriesChart
            series={[
              {
                label: '接收',
                color: '#34d399',
                values: stats.map((s) => networkRates(s.stats).recvBps ?? 0),
              },
              {
                label: '发送',
                color: '#38bdf8',
                values: stats.map((s) => networkRates(s.stats).sentBps ?? 0),
              },
            ]}
            format={(v) => formatBytesPerSec(v)}
          />
        </ChartCard>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-300">
          容器 ({containers.length})
        </h2>
        {containersLoading ? (
          <div className="text-sm text-zinc-500">加载中…</div>
        ) : containers.length === 0 ? (
          <div className="rounded-md border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
            该主机暂无容器数据
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-left text-xs text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-500">
                <tr>
                  <th className="px-3 py-2">名称</th>
                  <th className="px-3 py-2">状态</th>
                  <th className="px-3 py-2">CPU</th>
                  <th className="px-3 py-2">内存</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {containers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-200">{c.name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{c.status ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-300">
                      {formatPercent(c.cpu)}
                    </td>
                    <td className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-300">
                      {formatBytes(c.memory)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function TrafficSummaryCard({
  label,
  totals,
  loading,
  complete,
}: {
  label: string
  totals: { recvBytes: number; sentBytes: number }
  loading: boolean
  complete: boolean
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="text-xs text-zinc-500">
        {label}
        {!loading && !complete && (
          <span className="ml-1 text-amber-600 dark:text-amber-400">（部分数据）</span>
        )}
      </div>
      <div className="mt-1 font-mono text-lg text-zinc-900 dark:text-zinc-100">
        {loading ? '加载中…' : formatBytes(totals.recvBytes + totals.sentBytes)}
      </div>
      <div className="mt-1 flex gap-4 font-mono text-xs text-zinc-500">
        <span>↓ {loading ? '—' : formatBytes(totals.recvBytes)}</span>
        <span>↑ {loading ? '—' : formatBytes(totals.sentBytes)}</span>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
    >
      <ArrowLeft size={12} />
      返回
    </Link>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 font-mono text-lg text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  )
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{title}</h3>
        {loading && <span className="text-[10px] text-zinc-500">加载中…</span>}
      </div>
      {children}
    </div>
  )
}
