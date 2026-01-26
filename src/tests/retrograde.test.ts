import { describe, expect, it } from 'vitest'
import { degToRad } from '../astro/math/angles'
import {
  computeDerivativeDegPerDay,
  detectStations,
  motionFromDerivative,
} from '../astro/trails/retrograde'

const MS_PER_DAY = 24 * 60 * 60 * 1000

describe('retrograde', () => {
  it('classifies motion from derivative', () => {
    const eps = 0.03
    expect(motionFromDerivative(0.2, eps)).toBe('direct')
    expect(motionFromDerivative(-0.2, eps)).toBe('retrograde')
    expect(motionFromDerivative(0.0, eps)).toBe('station')
    expect(motionFromDerivative(0.02, eps)).toBe('station')
    expect(motionFromDerivative(-0.02, eps)).toBe('station')
  })

  it('detects station when longitude derivative flips + to -', () => {
    const timesMs = Array.from({ length: 5 }, (_, i) => i * MS_PER_DAY)
    const lonRad = [0, 1, 2, 1, 0].map(degToRad)

    const d = computeDerivativeDegPerDay(timesMs, lonRad)
    const stations = detectStations(timesMs, d, 0.03)

    expect(stations).toHaveLength(1)
    expect(stations[0].kind).toBe('station_retro')
    expect(stations[0].timeMs).toBeCloseTo(2 * MS_PER_DAY, 4)
  })

  it('detects station when longitude derivative flips - to +', () => {
    const timesMs = Array.from({ length: 5 }, (_, i) => i * MS_PER_DAY)
    const lonRad = [0, -1, -2, -1, 0].map(degToRad)

    const d = computeDerivativeDegPerDay(timesMs, lonRad)
    const stations = detectStations(timesMs, d, 0.03)

    expect(stations).toHaveLength(1)
    expect(stations[0].kind).toBe('station_direct')
    expect(stations[0].timeMs).toBeCloseTo(2 * MS_PER_DAY, 4)
  })
})

