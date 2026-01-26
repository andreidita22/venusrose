import { describe, expect, it } from 'vitest'
import { TAU, degToRad, radToDeg, wrapTo2Pi, wrapToPi } from '../astro/math/angles'

describe('angles', () => {
  it('wrapTo2Pi keeps values in [0, 2π)', () => {
    const samples = [-4 * TAU, -TAU - 0.2, -0.1, 0, 0.1, TAU + 0.2, 5 * TAU + 0.3]
    for (const s of samples) {
      const w = wrapTo2Pi(s)
      expect(w).toBeGreaterThanOrEqual(0)
      expect(w).toBeLessThan(TAU)
    }
  })

  it('wrapToPi keeps values in [-π, π)', () => {
    const samples = [-10, -4, -3.2, -Math.PI, -0.1, 0, 0.1, Math.PI, 3.2, 10]
    for (const s of samples) {
      const w = wrapToPi(s)
      expect(w).toBeGreaterThanOrEqual(-Math.PI)
      expect(w).toBeLessThan(Math.PI)
    }
  })

  it('degToRad and radToDeg round-trip', () => {
    const deg = 123.456
    const roundTrip = radToDeg(degToRad(deg))
    expect(roundTrip).toBeCloseTo(deg, 10)
  })
})
