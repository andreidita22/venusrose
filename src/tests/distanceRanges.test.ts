import { describe, expect, test } from 'vitest'
import { DISTANCE_RANGE_AU, distanceCloseness } from '../astro/distanceRanges'

describe('distanceRanges', () => {
  test('all configured ranges are valid', () => {
    for (const [id, range] of Object.entries(DISTANCE_RANGE_AU)) {
      expect(range.minAu, `${id} minAu`).toBeGreaterThan(0)
      expect(range.maxAu, `${id} maxAu`).toBeGreaterThan(range.minAu)
    }
  })

  test('distanceCloseness clamps and interpolates', () => {
    const range = { minAu: 1, maxAu: 3 }
    expect(distanceCloseness(range, 1)).toBe(1)
    expect(distanceCloseness(range, 3)).toBe(0)
    expect(distanceCloseness(range, 2)).toBeCloseTo(0.5, 6)
    expect(distanceCloseness(range, 0)).toBe(1)
    expect(distanceCloseness(range, 4)).toBe(0)
  })
})

