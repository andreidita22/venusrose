import { create } from 'zustand'
import type { BodyId } from '../astro/config'
import type { BodyState } from '../astro/ephemeris/types'
import { MS_PER_HOUR } from '../astro/math/time'
import type { ThemeMode } from '../theme/types'

export type ToggleKey = 'showZodiac' | 'showZoneRings'

export type Toggles = Record<ToggleKey, boolean>

export type TrailMode = 'wheel' | '3d'

export type TimeStep = 1 | 6 | 24 | 168 | 720

export type AppState = {
  t0: Date
  setT0: (t0: Date) => void
  advanceTimeByMs: (deltaMs: number) => void
  advanceTimeByHours: (deltaHours: number) => void
  tiltDeg: number
  setTiltDeg: (tiltDeg: number) => void
  selectedBody: BodyId | null
  setSelectedBody: (selectedBody: BodyId | null) => void
  bodyStates: Partial<Record<BodyId, BodyState>>
  setBodyStates: (bodyStates: Partial<Record<BodyId, BodyState>>) => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  togglePlaying: () => void
  timeStep: TimeStep
  setTimeStep: (timeStep: TimeStep) => void
  showMoonExtras: boolean
  setShowMoonExtras: (showMoonExtras: boolean) => void
  showDistanceBands: boolean
  setShowDistanceBands: (showDistanceBands: boolean) => void
  showSynodic: boolean
  setShowSynodic: (showSynodic: boolean) => void
  showTrails: boolean
  setShowTrails: (showTrails: boolean) => void
  trailMode: TrailMode
  setTrailMode: (trailMode: TrailMode) => void
  toggles: Toggles
  setToggle: (key: ToggleKey, value: boolean) => void
  toggle: (key: ToggleKey) => void
}

export const useAppStore = create<AppState>((set) => ({
  t0: new Date(),
  setT0: (t0) => set({ t0 }),
  advanceTimeByMs: (deltaMs) =>
    set((s) => ({ t0: new Date(s.t0.getTime() + deltaMs) })),
  advanceTimeByHours: (deltaHours) =>
    set((s) => ({ t0: new Date(s.t0.getTime() + deltaHours * MS_PER_HOUR) })),
  tiltDeg: 0,
  setTiltDeg: (tiltDeg) => set({ tiltDeg }),
  selectedBody: null,
  setSelectedBody: (selectedBody) => set({ selectedBody }),
  bodyStates: {},
  setBodyStates: (bodyStates) => set({ bodyStates }),
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  timeStep: 6,
  setTimeStep: (timeStep) => set({ timeStep }),
  showMoonExtras: true,
  setShowMoonExtras: (showMoonExtras) => set({ showMoonExtras }),
  showDistanceBands: true,
  setShowDistanceBands: (showDistanceBands) => set({ showDistanceBands }),
  showSynodic: true,
  setShowSynodic: (showSynodic) => set({ showSynodic }),
  showTrails: true,
  setShowTrails: (showTrails) => set({ showTrails }),
  trailMode: 'wheel',
  setTrailMode: (trailMode) => set({ trailMode }),
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
