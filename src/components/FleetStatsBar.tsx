import { ArrowDown, ArrowUp, Activity } from 'lucide-react'
import type { FleetStats } from '../lib/fleet'
import { formatBytes, formatBytesPerSec } from '../lib/format'

interface Props {
  stats: FleetStats
}

export default function FleetStatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat
        icon={<Activity size={14} className="text-emerald-500" />}
        label="在线 / 总数"
        value={`${stats.up} / ${stats.total}`}
        sub={
          stats.down > 0 || stats.paused > 0
            ? `${stats.down} 离线${stats.paused > 0 ? ` · ${stats.paused} 暂停` : ''}`
            : undefined
        }
      />
      <Stat
        icon={<ArrowDown size={14} className="text-emerald-500" />}
        label="总下行"
        value={formatBytesPerSec(stats.recvBps)}
      />
      <Stat
        icon={<ArrowUp size={14} className="text-sky-500" />}
        label="总上行"
        value={formatBytesPerSec(stats.sentBps)}
      />
      <Stat
        icon={<Activity size={14} className="text-amber-500" />}
        label="本月流量"
        value={formatBytes(stats.monthBytes)}
      />
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-lg text-zinc-900 dark:text-zinc-100">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
    </div>
  )
}
