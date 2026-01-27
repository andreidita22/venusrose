import type { BodyId } from '../config'
import type { BodyState, EphemerisProvider } from '../ephemeris/types'
import { unwrapRadians } from '../math/unwrap'
import { makeSampleTimes, sampleBodyStates } from './sampling'
import {
  computeDerivativeDegPerDay,
  detectStations,
  motionFromDerivative,
  type MotionKind,
  type StationEvent,
} from './retrograde'

type LruMap<K, V> = Map<K, V>

function lruGet<K, V>(map: LruMap<K, V>, key: K): V | undefined {
  const value = map.get(key)
  if (value === undefined) return undefined
  map.delete(key)
  map.set(key, value)
  return value
}

function lruSet<K, V>(map: LruMap<K, V>, key: K, value: V, maxSize: number): void {
  if (map.has(key)) map.delete(key)
  map.set(key, value)
  while (map.size > maxSize) {
    const oldestKey = map.keys().next().value as K | undefined
    if (oldestKey === undefined) break
    map.delete(oldestKey)
  }
}

const TIMES_CACHE_MAX = 24
const STATES_CACHE_MAX = 64
const TRAIL_CACHE_MAX = 24

const timesCache: LruMap<string, readonly Date[]> = new Map()
const statesCache: LruMap<string, readonly BodyState[]> = new Map()
const trailCache: LruMap<string, TrailAnalysis> = new Map()

export type TrailAnalysis = {
  key: string
  centerMs: number
  windowDays: number
  stepHours: number
  current: BodyState
  samples: readonly BodyState[]
  motionAtPoints: readonly MotionKind[]
  stations: readonly StationEvent[]
  stationStates: readonly (StationEvent & { state: BodyState })[]
}

export function getSampleTimes(centerMs: number, windowDays: number, stepHours: number): readonly Date[] {
  const key = `${centerMs}:${windowDays}:${stepHours}`
  const cached = lruGet(timesCache, key)
  if (cached) return cached

  const center = new Date(centerMs)
  const times = makeSampleTimes(center, windowDays, stepHours)
  lruSet(timesCache, key, times, TIMES_CACHE_MAX)
  return times
}

export function getBodySamples(
  provider: EphemerisProvider,
  body: BodyId,
  centerMs: number,
  windowDays: number,
  stepHours: number,
): readonly BodyState[] {
  const key = `${body}:${centerMs}:${windowDays}:${stepHours}`
  const cached = lruGet(statesCache, key)
  if (cached) return cached

  const times = getSampleTimes(centerMs, windowDays, stepHours)
  const states = sampleBodyStates(provider, body, times)
  lruSet(statesCache, key, states, STATES_CACHE_MAX)
  return states
}

export function getTrailAnalysis(
  provider: EphemerisProvider,
  body: BodyId,
  centerMs: number,
  windowDays: number,
  stepHours: number,
  epsDegPerDay: number,
): TrailAnalysis {
  const key = `${body}:${centerMs}:${windowDays}:${stepHours}:${epsDegPerDay}`
  const cached = lruGet(trailCache, key)
  if (cached) return cached

  const centerDate = new Date(centerMs)
  const current = provider.getBodyState(body, centerDate)
  if (!current) {
    throw new Error(`Provider returned null for body=${body} at ${centerDate.toISOString()}`)
  }

  const samples = getBodySamples(provider, body, centerMs, windowDays, stepHours)
  const timesMs = samples.map((s) => s.date.getTime())
  const lonU = unwrapRadians(samples.map((s) => s.lonRad))
  const dLonDegPerDay = computeDerivativeDegPerDay(timesMs, lonU)
  const motionAtPoints = dLonDegPerDay.map((d) => motionFromDerivative(d, epsDegPerDay))
  const stations = detectStations(timesMs, dLonDegPerDay, epsDegPerDay)

  const stationStates = stations.map((ev) => {
    const state = provider.getBodyState(body, new Date(ev.timeMs))
    if (!state) {
      throw new Error(`Provider returned null for body=${body} at ${new Date(ev.timeMs).toISOString()}`)
    }
    return { ...ev, state }
  })

  const out: TrailAnalysis = {
    key,
    centerMs,
    windowDays,
    stepHours,
    current,
    samples,
    motionAtPoints,
    stations,
    stationStates,
  }

  lruSet(trailCache, key, out, TRAIL_CACHE_MAX)
  return out
}

