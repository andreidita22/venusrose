import { describe, expect, it } from 'vitest'
import { AU_BREAKS, R_BREAKS } from '../astro/config'
import { piecewiseLinearMap, scaleRadiusAUToScene } from '../astro/math/scale'

describe('piecewiseLinearMap', () => {
  it('maps within segment linearly', () => {
    const xBreaks = [0, 1, 2]
    const yBreaks = [0, 10, 20]
    expect(piecewiseLinearMap(0.5, xBreaks, yBreaks)).toBeCloseTo(5)
    expect(piecewiseLinearMap(1.5, xBreaks, yBreaks)).toBeCloseTo(15)
  })

  it('clamps outside range', () => {
    const xBreaks = [0, 1, 2]
    const yBreaks = [0, 10, 20]
    expect(piecewiseLinearMap(-1, xBreaks, yBreaks)).toBe(0)
    expect(piecewiseLinearMap(10, xBreaks, yBreaks)).toBe(20)
  })
})

describe('scaleRadiusAUToScene', () => {
  it('hits exact breakpoints', () => {
    for (let i = 0; i < AU_BREAKS.length; i++) {
      expect(scaleRadiusAUToScene(AU_BREAKS[i])).toBeCloseTo(R_BREAKS[i])
    }
  })

  it('is monotone non-decreasing', () => {
    const samples = Array.from({ length: 200 }, (_, i) => (i / 199) * 50)
    let prev = -Infinity
    for (const r of samples) {
      const mapped = scaleRadiusAUToScene(r)
      expect(mapped).toBeGreaterThanOrEqual(prev)
      prev = mapped
    }
  })
})
