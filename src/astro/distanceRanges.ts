import type { BodyId } from './config'

export type DistanceRangeAu = {
  minAu: number
  maxAu: number
}

export function distanceCloseness(range: DistanceRangeAu, distAu: number): number {
  const denom = range.maxAu - range.minAu
  if (!Number.isFinite(denom) || denom <= 0) return 0
  const raw = (range.maxAu - distAu) / denom
  return Math.min(1, Math.max(0, raw))
}

// v0: pragmatic approximate geocentric distance ranges (AU).
// Used only for visualization (monotone distance ordering is preserved).
export const DISTANCE_RANGE_AU: Partial<Record<BodyId, DistanceRangeAu>> = {
  sun: { minAu: 0.983, maxAu: 1.017 },
  moon: { minAu: 0.00243, maxAu: 0.00271 },
  mercury: { minAu: 0.53, maxAu: 1.47 },
  venus: { minAu: 0.27, maxAu: 1.73 },
  mars: { minAu: 0.37, maxAu: 2.68 },
  jupiter: { minAu: 3.93, maxAu: 6.48 },
  saturn: { minAu: 8.0, maxAu: 11.1 },
  uranus: { minAu: 17.1, maxAu: 21.2 },
  neptune: { minAu: 28.8, maxAu: 31.3 },
  pluto: { minAu: 28.7, maxAu: 50.3 },
}
