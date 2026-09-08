import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { pb } from '../lib/pb'

interface AuthState {
  isAuthed: boolean
  isReady: boolean
  email: string | null
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
    // Re-validate the stored token; if it is stale, the SDK clears it.
    const init = async () => {
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
    () => ({ isAuthed, isReady, email, login, logout }),
    [isAuthed, isReady, email, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
