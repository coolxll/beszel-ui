import { Link } from 'react-router'
import { ArrowDown, ArrowUp, Cpu, HardDrive, MemoryStick } from 'lucide-react'
import type { System } from '../lib/types'
import { formatBytes, formatBytesPerSec, formatPercent, formatUptime } from '../lib/format'
import StatusDot from './StatusDot'

interface Props {
  system: System
}

export default function ServerCard({ system }: Props) {
  const info = system.info ?? {}
  const isUp = system.status === 'up'

  return (
    <Link
      to={`/servers/${system.id}`}
      className="group block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-emerald-600/50 hover:bg-zinc-900"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusDot status={system.status} />
            <h3 className="truncate text-sm font-semibold text-zinc-100 group-hover:text-emerald-300">
              {system.name}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {info.h ?? system.host} · up {formatUptime(info.u)}
          </p>
        </div>
        <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
          {system.status}
        </span>
      </div>

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
          value={`${formatBytes(info.du)} / ${formatBytes(info.dt)}`}
          percent={info.dp}
          tone="amber"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2 text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <ArrowDown size={11} className="text-emerald-400" />
          {isUp ? formatBytesPerSec(info.nr) : '—'}
        </span>
        <span className="inline-flex items-center gap-1">
          <ArrowUp size={11} className="text-sky-400" />
          {isUp ? formatBytesPerSec(info.ns) : '—'}
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
        <span className="inline-flex items-center gap-1 text-zinc-400">
          {icon}
          {label}
        </span>
        <span className="font-mono text-zinc-300">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded bg-zinc-800">
        <div
          className={`h-full ${bar} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, percent ?? 0))}%` }}
        />
      </div>
    </div>
  )
}
