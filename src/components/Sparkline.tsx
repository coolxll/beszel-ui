interface Props {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  min?: number
  max?: number
}

/** Tiny inline SVG sparkline; values are auto-scaled unless min/max provided. */
export default function Sparkline({
  values,
  width = 120,
  height = 28,
  stroke = '#34d399',
  fill = 'rgba(52, 211, 153, 0.15)',
  min,
  max,
}: Props) {
  if (values.length < 2) {
    return <svg width={width} height={height} />
  }
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const span = hi - lo || 1
  const step = width / (values.length - 1)

  const points = values.map((v, i) => {
    const x = i * step
    const y = height - ((v - lo) / span) * height
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={area} fill={fill} stroke="none" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  )
}
