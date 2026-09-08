import { useMemo } from 'react'

interface Series {
  label: string
  color: string
  values: number[]
}

interface Props {
  series: Series[]
  height?: number
  min?: number
  max?: number
  /** Formatter applied to hover tooltip values; defaults to toFixed(1). */
  format?: (v: number) => string
}

/**
 * Multi-series SVG line chart with a simple hover cursor. Deliberately avoids
 * a charting library to keep the bundle small — Beszel's data rate is low
 * enough that SVG is plenty.
 */
export default function TimeSeriesChart({
  series,
  height = 180,
  min,
  max,
  format,
}: Props) {
  const width = 800

  const allValues = useMemo(() => series.flatMap((s) => s.values), [series])
  if (allValues.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded border border-zinc-800 bg-zinc-900/30 text-xs text-zinc-500"
        style={{ height }}
      >
        暂无数据
      </div>
    )
  }

  const lo = min ?? Math.min(...allValues)
  const hi = max ?? Math.max(...allValues)
  const span = hi - lo || 1

  const maxLen = Math.max(...series.map((s) => s.values.length))
  const step = maxLen > 1 ? width / (maxLen - 1) : width

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
      >
        {/* horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={0}
            x2={width}
            y1={height * r}
            y2={height * r}
            stroke="#27272a"
            strokeWidth={1}
          />
        ))}
        {series.map((s) => {
          const path = s.values
            .map((v, i) => {
              const x = i * step
              const y = height - ((v - lo) / span) * height
              return `${i === 0 ? 'M' : 'L'}${x},${y}`
            })
            .join(' ')
          return (
            <path
              key={s.label}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
        {series.map((s) => {
          const last = s.values[s.values.length - 1]
          return (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
              <span className="font-mono text-zinc-200">
                {last === undefined ? '—' : (format?.(last) ?? last.toFixed(1))}
              </span>
            </span>
          )
        })}
        <span className="ml-auto font-mono text-zinc-500">
          {lo.toFixed(1)} – {hi.toFixed(1)}
        </span>
      </div>
    </div>
  )
}
