import { describe, expect, it } from 'vitest'
import { degToRad, radToDeg } from '../astro/math/angles'
import { unwrapRadians } from '../astro/math/unwrap'

describe('unwrapRadians', () => {
  it('unwraps across 360° for increasing longitudes', () => {
    const lonsDeg = [350, 355, 2, 8]
    const lonsRad = lonsDeg.map(degToRad)
    const unwrapped = unwrapRadians(lonsRad).map(radToDeg)

    expect(unwrapped[0]).toBeCloseTo(350, 6)
    expect(unwrapped[1]).toBeCloseTo(355, 6)
    expect(unwrapped[2]).toBeCloseTo(362, 6)
    expect(unwrapped[3]).toBeCloseTo(368, 6)
  })

  it('unwraps across 360° for decreasing longitudes', () => {
    const lonsDeg = [10, 5, 358, 350]
    const lonsRad = lonsDeg.map(degToRad)
    const unwrapped = unwrapRadians(lonsRad).map(radToDeg)

    expect(unwrapped[0]).toBeCloseTo(10, 6)
    expect(unwrapped[1]).toBeCloseTo(5, 6)
    expect(unwrapped[2]).toBeCloseTo(-2, 6)
    expect(unwrapped[3]).toBeCloseTo(-10, 6)
  })
})
