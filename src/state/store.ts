import { create } from 'zustand'
import type { BodyId } from '../astro/config'
import type { BodyState } from '../astro/ephemeris/types'
import type { ThemeMode } from '../theme/types'

export type ToggleKey = 'showZodiac' | 'showZoneRings'

export type Toggles = Record<ToggleKey, boolean>

export type AppState = {
  t0: Date
  setT0: (t0: Date) => void
  tiltDeg: number
  setTiltDeg: (tiltDeg: number) => void
  selectedBody: BodyId | null
  setSelectedBody: (selectedBody: BodyId | null) => void
  bodyStates: Partial<Record<BodyId, BodyState>>
  setBodyStates: (bodyStates: Partial<Record<BodyId, BodyState>>) => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  toggles: Toggles
  setToggle: (key: ToggleKey, value: boolean) => void
  toggle: (key: ToggleKey) => void
}

export const useAppStore = create<AppState>((set) => ({
  t0: new Date(),
  setT0: (t0) => set({ t0 }),
  tiltDeg: 0,
  setTiltDeg: (tiltDeg) => set({ tiltDeg }),
  selectedBody: null,
  setSelectedBody: (selectedBody) => set({ selectedBody }),
  bodyStates: {},
  setBodyStates: (bodyStates) => set({ bodyStates }),
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  toggles: {
    showZodiac: true,
    showZoneRings: true,
  },
  setToggle: (key, value) =>
    set((state) => ({ toggles: { ...state.toggles, [key]: value } })),
  toggle: (key) =>
    set((state) => ({
      toggles: { ...state.toggles, [key]: !state.toggles[key] },
    })),
}))
