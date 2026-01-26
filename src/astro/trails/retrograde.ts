import type { BodyState } from '../ephemeris/types'
import { radToDeg } from '../math/angles'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type MotionKind = 'direct' | 'retrograde' | 'station'

export type StationKind = 'station_retro' | 'station_direct'

export type StationEvent = {
  kind: StationKind
  timeMs: number
}

export function computeDerivativeDegPerDay(
  timesMs: readonly number[],
  lonUnwrappedRad: readonly number[],
): number[] {
  const n = timesMs.length
  if (lonUnwrappedRad.length !== n) throw new Error('timesMs and lonUnwrappedRad length mismatch')
  if (n < 2) return Array(n).fill(0)

  const out = new Array<number>(n)

  const slope = (i0: number, i1: number) => {
    const dtMs = timesMs[i1] - timesMs[i0]
    if (dtMs === 0) return 0
    const dLonDeg = radToDeg(lonUnwrappedRad[i1] - lonUnwrappedRad[i0])
    return (dLonDeg / dtMs) * MS_PER_DAY
  }

  out[0] = slope(0, 1)
  for (let i = 1; i < n - 1; i++) {
    out[i] = slope(i - 1, i + 1)
  }
  out[n - 1] = slope(n - 2, n - 1)

  return out
}

export function motionFromDerivative(dLonDegPerDay: number, epsDegPerDay: number): MotionKind {
  if (dLonDegPerDay > epsDegPerDay) return 'direct'
  if (dLonDegPerDay < -epsDegPerDay) return 'retrograde'
  return 'station'
}

export function detectStations(
  timesMs: readonly number[],
  dLonDegPerDay: readonly number[],
  epsDegPerDay: number,
): StationEvent[] {
  const n = timesMs.length
  if (dLonDegPerDay.length !== n) throw new Error('timesMs and dLonDegPerDay length mismatch')
  if (n < 2) return []

  const out: StationEvent[] = []

  let lastNonZero: { dir: 1 | -1; idx: number } | null = null

  for (let i = 0; i < n; i++) {
    const d = dLonDegPerDay[i]
    const dir: 1 | -1 | 0 = d > epsDegPerDay ? 1 : d < -epsDegPerDay ? -1 : 0

    if (dir === 0) continue

    if (!lastNonZero) {
      lastNonZero = { dir, idx: i }
      continue
    }

    if (dir === lastNonZero.dir) {
      lastNonZero = { dir, idx: i }
      continue
    }

    const i0 = lastNonZero.idx
    const i1 = i
    const d0 = dLonDegPerDay[i0]
    const d1 = dLonDegPerDay[i1]
    const t0 = timesMs[i0]
    const t1 = timesMs[i1]

    const frac = d1 === d0 ? 0.5 : (0 - d0) / (d1 - d0)
    const timeMs = t0 + Math.min(1, Math.max(0, frac)) * (t1 - t0)

    out.push({
      kind: lastNonZero.dir === 1 ? 'station_retro' : 'station_direct',
      timeMs,
    })

    lastNonZero = { dir, idx: i }
  }

  return out
}

export function lonLatDistAtTime(states: readonly BodyState[]): {
  timesMs: number[]
  lonRad: number[]
  latRad: number[]
  distAu: number[]
} {
  return {
    timesMs: states.map((s) => s.date.getTime()),
    lonRad: states.map((s) => s.lonRad),
    latRad: states.map((s) => s.latRad),
    distAu: states.map((s) => s.distAu),
  }
}

