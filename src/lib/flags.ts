/**
 * Country flag lookup.
 *
 * Flags are configured via the `VITE_SYSTEM_FLAGS` env var, which is a JSON
 * object mapping system identifiers (name, hostname, or info.h) to ISO 3166-1
 * alpha-2 country codes. Example:
 *
 *   VITE_SYSTEM_FLAGS={"rn-direct":"cn","ddrk":"us","jph2":"jp"}
 *
 * We deliberately do NOT call a GeoIP API at runtime: the system host field is
 * often a tailscale or RFC1918 address that public GeoIP services cannot
 * resolve anyway, and a static mapping is faster, deterministic, and works
 * fully offline.
 */

const RAW = import.meta.env.VITE_SYSTEM_FLAGS as string | undefined

let MAP: Record<string, string> = {}
if (RAW) {
  try {
    const parsed = JSON.parse(RAW) as Record<string, unknown>
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') MAP[k.toLowerCase()] = v.toLowerCase()
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[beszel-ui] VITE_SYSTEM_FLAGS is not valid JSON:', err)
  }
}

/** Convert a 2-letter ISO code to its regional-indicator emoji. */
export function countryCodeToFlag(code: string | undefined): string | null {
  if (!code || code.length !== 2) return null
  const A = 0x1f1e6
  const a = 'a'.charCodeAt(0)
  const c0 = code.charCodeAt(0)
  const c1 = code.charCodeAt(1)
  if (c0 < a || c0 > a + 25 || c1 < a || c1 > a + 25) return null
  return String.fromCodePoint(A + (c0 - a), A + (c1 - a))
}

/**
 * Look up the flag for a system. Accepts a system-like object with `name`,
 * `host`, and optional `info.h`. Returns the emoji string or null when no
 * mapping is configured.
 */
export function flagForSystem(sys: {
  name?: string
  host?: string
  info?: { h?: string }
}): string | null {
  const candidates = [sys.name, sys.host, sys.info?.h]
  for (const c of candidates) {
    if (!c) continue
    const code = MAP[c.toLowerCase()]
    if (code) {
      const flag = countryCodeToFlag(code)
      if (flag) return flag
    }
  }
  return null
}
