import PocketBase from 'pocketbase'

const url = import.meta.env.VITE_BESZEL_URL as string | undefined

if (!url) {
  // eslint-disable-next-line no-console
  console.warn(
    '[beszel-ui] VITE_BESZEL_URL is not set. Copy .env.example to .env and restart the dev server.',
  )
}

export const pb = new PocketBase(url ?? 'http://127.0.0.1:8090')

// Disable auto-cancellation of duplicate requests; we explicitly manage lifecycles.
pb.autoCancellation(false)

/**
 * Demo / no-auth mode: when `VITE_NO_AUTH=true` the router skips RequireAuth
 * and renders the UI without any PocketBase credentials. Hooks will still hit
 * the hub and likely 401 — that's expected: this mode is only for visual
 * review of the layout.
 */
export const NO_AUTH = import.meta.env.VITE_NO_AUTH === 'true'

/**
 * Service-account mode: when `VITE_PB_EMAIL` and `VITE_PB_PASSWORD` are baked
 * into the bundle at build time, the app automatically signs in with that
 * account on startup. Users never see the login page; the account itself
 * should be a PocketBase `users` record with role=readonly so the embedded
 * credentials cannot mutate anything (effectively an API key).
 *
 * The credentials end up in the JS bundle — anyone with access to the page
 * can extract them. Do NOT use a privileged account here.
 */
export const SERVICE_ACCOUNT = {
  email: (import.meta.env.VITE_PB_EMAIL as string | undefined) ?? null,
  password: (import.meta.env.VITE_PB_PASSWORD as string | undefined) ?? null,
}

export const HAS_SERVICE_ACCOUNT = Boolean(SERVICE_ACCOUNT.email && SERVICE_ACCOUNT.password)
