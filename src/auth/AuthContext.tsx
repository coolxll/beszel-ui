import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { HAS_SERVICE_ACCOUNT, NO_AUTH, pb, SERVICE_ACCOUNT } from '../lib/pb'

interface AuthState {
  isAuthed: boolean
  isReady: boolean
  email: string | null
  /** True when a build-time service account is in use; hides the logout button. */
  isServiceAccount: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(pb.authStore.isValid)
  const [email, setEmail] = useState<string | null>(
    (pb.authStore.record?.email as string | undefined) ?? null,
  )

  useEffect(() => {
    const init = async () => {
      // NO_AUTH mode: skip all authentication, used for visual review only.
      if (NO_AUTH) {
        setIsAuthed(false)
        setEmail(null)
        setIsReady(true)
        return
      }

      // Service-account mode: always sign in with the build-time credentials,
      // ignoring anything already in the auth store. The user never sees a
      // login page in this mode.
      if (HAS_SERVICE_ACCOUNT && SERVICE_ACCOUNT.email && SERVICE_ACCOUNT.password) {
        try {
          // Clear any stale token first so we always start fresh.
          pb.authStore.clear()
          await pb
            .collection('users')
            .authWithPassword(SERVICE_ACCOUNT.email, SERVICE_ACCOUNT.password)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[beszel-ui] service-account login failed:', err)
          pb.authStore.clear()
        }
        setIsAuthed(pb.authStore.isValid)
        setEmail((pb.authStore.record?.email as string | undefined) ?? null)
        setIsReady(true)
        return
      }

      // Interactive mode: re-validate the stored token; if it is stale, the
      // SDK clears it and the user is sent back to the login page.
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
        } catch {
          pb.authStore.clear()
        }
      }
      setIsAuthed(pb.authStore.isValid)
      setEmail((pb.authStore.record?.email as string | undefined) ?? null)
      setIsReady(true)
    }
    void init()

    const unsub = pb.authStore.onChange(() => {
      setIsAuthed(pb.authStore.isValid)
      setEmail((pb.authStore.record?.email as string | undefined) ?? null)
    })
    return () => {
      unsub()
    }
  }, [])

  const login = useCallback(async (mail: string, password: string) => {
    await pb.collection('users').authWithPassword(mail, password)
  }, [])

  const logout = useCallback(() => {
    pb.authStore.clear()
  }, [])

  const value = useMemo(
    () => ({
      isAuthed,
      isReady,
      email,
      isServiceAccount: HAS_SERVICE_ACCOUNT,
      login,
      logout,
    }),
    [isAuthed, isReady, email, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
