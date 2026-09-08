const KB = 1024
const MB = KB * 1024
const GB = MB * 1024
const TB = GB * 1024

export function formatBytes(n: number | undefined, digits = 1): string {
  if (n === undefined || Number.isNaN(n)) return '—'
  if (n < KB) return `${n.toFixed(0)} B`
  if (n < MB) return `${(n / KB).toFixed(digits)} KB`
  if (n < GB) return `${(n / MB).toFixed(digits)} MB`
  if (n < TB) return `${(n / GB).toFixed(digits)} GB`
  return `${(n / TB).toFixed(digits)} TB`
}

export function formatBytesPerSec(n: number | undefined): string {
  if (n === undefined) return '—'
  return `${formatBytes(n)}/s`
}

export function formatPercent(n: number | undefined, digits = 1): string {
  if (n === undefined || Number.isNaN(n)) return '—'
  return `${n.toFixed(digits)}%`
}

export function formatUptime(seconds: number | undefined): string {
  if (seconds === undefined) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso.replace(' ', 'T'))
  return d.toLocaleString()
}
