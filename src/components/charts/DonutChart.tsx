import { formatBytes } from '../../lib/format'

interface Slice {
  label: string
  value: number
  color: string
}

interface Props {
  /** Slices; values must be positive. Total is computed. */
  slices: Slice[]
  size?: number
  /** Optional center label, defaults to total. */
  centerLabel?: string
  centerValue?: string
}

/** Simple SVG donut chart. */
export default function DonutChart({ slices, size = 160, centerLabel, centerValue }: Props) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-zinc-500"
        style={{ width: size, height: size }}
      >
        暂无数据
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.62

  let angle = -Math.PI / 2
  const paths: { d: string; color: string; key: string }[] = []
  for (const s of slices) {
    const frac = s.value / total
    const sweep = frac * Math.PI * 2
    const a0 = angle
    const a1 = angle + sweep
    angle = a1

    const largeArc = sweep > Math.PI ? 1 : 0
    const x0o = cx + outerR * Math.cos(a0)
    const y0o = cy + outerR * Math.sin(a0)
    const x1o = cx + outerR * Math.cos(a1)
    const y1o = cy + outerR * Math.sin(a1)
    const x1i = cx + innerR * Math.cos(a1)
    const y1i = cy + innerR * Math.sin(a1)
    const x0i = cx + innerR * Math.cos(a0)
    const y0i = cy + innerR * Math.sin(a0)

    const d = [
      `M ${x0o} ${y0o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x1o} ${y1o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x0i} ${y0i}`,
      'Z',
    ].join(' ')

    paths.push({ d, color: s.color, key: s.label })
  }

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p) => (
          <path key={p.key} d={p.d} fill={p.color} stroke="none" opacity={0.9} />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-zinc-500 text-[10px]"
          style={{ fontSize: 10 }}
        >
          {centerLabel ?? '总计'}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-zinc-900 font-mono dark:fill-zinc-100"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          {centerValue ?? formatBytes(total)}
        </text>
      </svg>
      <ul className="space-y-1 text-xs">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-zinc-600 dark:text-zinc-400">{s.label}</span>
            <span className="ml-auto font-mono text-zinc-800 dark:text-zinc-200">
              {formatBytes(s.value)}
            </span>
            <span className="text-zinc-500">({((s.value / total) * 100).toFixed(0)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
