import { createContext, useContext, type ReactNode } from 'react'
import {
  useSystems as useSystemsInternal,
  type SystemMeta,
} from './useSystems'
import type { System, SystemStat } from '../lib/types'

interface SystemsState {
  systems: System[]
  cpuTrail: Map<string, number[]>
  latestStats: Map<string, SystemStat['stats']>
  meta: Map<string, SystemMeta>
  loading: boolean
  error: string | null
}

const SystemsContext = createContext<SystemsState | null>(null)

export function SystemsProvider({ children }: { children: ReactNode }) {
  const state = useSystemsInternal()
  return (
    <SystemsContext.Provider value={state}>{children}</SystemsContext.Provider>
  )
}

export function useSystems(): SystemsState {
  const ctx = useContext(SystemsContext)
  if (!ctx) throw new Error('useSystems must be used inside <SystemsProvider>')
  return ctx
}
