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
