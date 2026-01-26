import { describe, expect, it } from 'vitest'
import { astronomyEngineProvider } from '../astro/ephemeris/providerAstronomyEngine'
import { TAU, radToDeg } from '../astro/math/angles'

describe('AstronomyEngineProvider', () => {
  it('returns ecliptic lon/lat/dist for supported bodies', () => {
    const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0))
    const bodies = ['sun', 'moon', 'mars'] as const

    for (const body of bodies) {
      const state = astronomyEngineProvider.getBodyState(body, date)
      expect(state).not.toBeNull()
      if (!state) continue

      expect(state.lonRad).toBeGreaterThanOrEqual(0)
      expect(state.lonRad).toBeLessThan(TAU)
      expect(state.latRad).toBeGreaterThanOrEqual(-Math.PI / 2)
      expect(state.latRad).toBeLessThanOrEqual(Math.PI / 2)
      expect(state.distAu).toBeGreaterThan(0)
    }
  })

  it('keeps the Sun near zero ecliptic latitude (of-date)', () => {
    const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0))
    const state = astronomyEngineProvider.getBodyState('sun', date)
    expect(state).not.toBeNull()
    if (!state) return

    expect(Math.abs(radToDeg(state.latRad))).toBeLessThan(0.5)
  })

  it('returns null for unsupported bodies (mean_node v0 placeholder)', () => {
    const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0))
    expect(astronomyEngineProvider.getBodyState('mean_node', date)).toBeNull()
  })
})

