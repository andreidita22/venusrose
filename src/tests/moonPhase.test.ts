import { describe, expect, it } from 'vitest'
import { moonIlluminationFraction } from '../astro/moon/phase'

describe('moonIlluminationFraction', () => {
  it('returns 0 at new moon (elongation 0)', () => {
    expect(moonIlluminationFraction(0)).toBeCloseTo(0, 8)
  })

  it('returns 1 at full moon (elongation π)', () => {
    expect(moonIlluminationFraction(Math.PI)).toBeCloseTo(1, 8)
  })

  it('returns 0.5 at quarter (elongation π/2)', () => {
    expect(moonIlluminationFraction(Math.PI / 2)).toBeCloseTo(0.5, 8)
  })
})

