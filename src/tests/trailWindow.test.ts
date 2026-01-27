import { describe, expect, it } from 'vitest'
import type { BodyId } from '../astro/config'
import type { BodyState, EphemerisProvider } from '../astro/ephemeris/types'
import { MS_PER_DAY } from '../astro/math/time'
import { resolveTrailWindow } from '../astro/trails/window'

function makeLinearProvider(body: BodyId, omegaRadPerDay: number, distAu: number): EphemerisProvider {
  return {
    getBodyState: (b, date) => {
      if (b !== body && b !== 'sun') return null
      const tDays = date.getTime() / MS_PER_DAY
      const lonRad = b === 'sun' ? 0 : omegaRadPerDay * tDays
      const state: BodyState = {
        body: b,
        date,
        lonRad,
        latRad: 0,
        distAu: b === 'sun' ? 1 : distAu,
      }
      return state
    },
  }
}

describe('resolveTrailWindow', () => {
  it('keeps base window when conjunction anchoring is off', () => {
    const provider = makeLinearProvider('venus', Math.PI / 2, 0.7)
    const spec = resolveTrailWindow(provider, 'venus', 0, 7, 24, { ensureConjunctions: false })
    expect(spec.windowDays).toBe(7)
  })

  it('expands window to include previous and next conjunction', () => {
    // 90°/day → conjunction every 4 days (Δλ wraps to 0 at t = ±4d, ±8d, ...)
    const provider = makeLinearProvider('venus', Math.PI / 2, 0.7)
    const spec = resolveTrailWindow(provider, 'venus', 0, 1, 24, {
      ensureConjunctions: true,
      conjunctionMarginDays: 0,
      conjunctionSearchMaxDays: 30,
      maxWindowDays: 100,
    })
    expect(spec.centerMs).toBe(0)
    expect(spec.windowDays).toBe(4)
  })

  it('clamps expansion to maxWindowDays', () => {
    const provider = makeLinearProvider('venus', Math.PI / 2, 0.7)
    const spec = resolveTrailWindow(provider, 'venus', 0, 1, 24, {
      ensureConjunctions: true,
      conjunctionMarginDays: 0,
      conjunctionSearchMaxDays: 30,
      maxWindowDays: 3,
    })
    expect(spec.windowDays).toBe(3)
  })
})

