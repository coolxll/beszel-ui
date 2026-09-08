import clsx from 'clsx'

interface Props {
  status: string | undefined
  size?: number
}

export default function StatusDot({ status, size = 8 }: Props) {
  const color =
    status === 'up'
      ? 'bg-emerald-400'
      : status === 'paused'
        ? 'bg-amber-400'
        : 'bg-red-500'
  return (
    <span
      className={clsx('inline-block rounded-full', color)}
      style={{ width: size, height: size }}
      aria-label={status ?? 'unknown'}
    />
  )
}
