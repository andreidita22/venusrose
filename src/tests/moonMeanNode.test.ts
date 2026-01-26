import { describe, expect, it } from 'vitest'
import { meanLunarNodeLongitudeRad } from '../astro/moon/meanNode'
import { TAU } from '../astro/math/angles'

describe('meanLunarNodeLongitudeRad', () => {
  it('returns radians in [0, 2π)', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 0, 0, 0))
    const lon = meanLunarNodeLongitudeRad(d)
    expect(lon).toBeGreaterThanOrEqual(0)
    expect(lon).toBeLessThan(TAU)
  })
})

