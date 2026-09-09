import { Link } from 'react-router'
import { ArrowDown, ArrowUp, Cpu, HardDrive, MemoryStick } from 'lucide-react'
import type { System } from '../lib/types'
import { diskMetrics, networkRates, type StatsPayload } from '../lib/metrics'
import { formatBytes, formatBytesPerSec, formatPercent, formatUptime } from '../lib/format'
import { osMeta } from '../lib/fleet'
import { flagForSystem } from '../lib/flags'
import StatusDot from './StatusDot'
import Sparkline from './Sparkline'

interface Props {
  system: System
  stats?: StatsPayload
  cpuTrail?: number[]
  /** Mock-only: friendly alias shown next to the name (e.g. "主控网关"). */
  alias?: string
}

export default function ServerCard({ system, stats, cpuTrail, alias }: Props) {
  const info = system.info ?? {}
  const isUp = system.status === 'up'
  const os = osMeta(info.os)
  const flag = flagForSystem(system)
  const disk = diskMetrics(info, stats)
  const network = networkRates(stats)

  return (
    <Link
      to={`/servers/${system.id}`}
      className="group block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-emerald-600/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <StatusDot status={system.status} />
            {flag && (
              <span className="text-sm" aria-label="country flag">
                {flag}
              </span>
            )}
            <h3 className="truncate text-sm font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-300">
              {system.name}
              {alias && (
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  ({alias})
                </span>
              )}
            </h3>
            <span
              className="text-xs"
              title={os.label}
              aria-label={os.label}
            >
              {os.emoji}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {info.h ?? system.host} · up {formatUptime(info.u)}
          </p>
        </div>
        <span className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {system.status}
        </span>
      </div>

      {isUp && cpuTrail && cpuTrail.length >= 2 && (
        <div className="mb-3 -mx-1">
          <Sparkline
            values={cpuTrail}
            width={220}
            height={32}
            min={0}
            max={100}
            stroke="#10b981"
            fill="rgba(16, 185, 129, 0.12)"
          />
        </div>
      )}

      <div className="space-y-2">
        <MetricRow
          icon={<Cpu size={12} />}
          label="CPU"
          value={formatPercent(info.cpu)}
          percent={info.cpu}
          tone="emerald"
        />
        <MetricRow
          icon={<MemoryStick size={12} />}
          label="内存"
          value={formatPercent(info.mp)}
          percent={info.mp}
          tone="sky"
        />
        <MetricRow
          icon={<HardDrive size={12} />}
          label="磁盘"
          value={`${formatBytes(disk.usedBytes)} / ${formatBytes(disk.totalBytes)}`}
          percent={disk.percent}
          tone="amber"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <ArrowDown size={11} className="text-emerald-500" />
          {isUp ? formatBytesPerSec(network.recvBps) : '—'}
        </span>
        <span className="inline-flex items-center gap-1">
          <ArrowUp size={11} className="text-sky-500" />
          {isUp ? formatBytesPerSec(network.sentBps) : '—'}
        </span>
      </div>
    </Link>
  )
}

function MetricRow({
  icon,
  label,
  value,
  percent,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  percent?: number
  tone: 'emerald' | 'sky' | 'amber'
}) {
  const bar =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'sky'
        ? 'bg-sky-500'
        : 'bg-amber-500'
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
          {icon}
          {label}
        </span>
        <span className="font-mono text-zinc-800 dark:text-zinc-300">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full ${bar} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, percent ?? 0))}%` }}
        />
      </div>
    </div>
  )
}
