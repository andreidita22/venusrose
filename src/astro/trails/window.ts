import type { BodyId } from '../config'
import type { EphemerisProvider } from '../ephemeris/types'
import { degToRad } from '../math/angles'
import { MS_PER_DAY, MS_PER_HOUR } from '../math/time'
import { elongationRad } from '../synodic'
import { trailCenterMsFor } from './cache'

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

export type TrailWindowSpec = {
  centerMs: number
  windowDays: number
}

export type TrailWindowOptions = {
  ensureConjunctions?: boolean
  conjunctionMarginDays?: number
  conjunctionSearchMaxDays?: number
  conjunctionSearchNearZeroDeg?: number
  maxWindowDays?: number
}

const DEFAULT_CONJ_MARGIN_DAYS = 6
const DEFAULT_CONJ_SEARCH_MAX_DAYS = 900
const DEFAULT_CONJ_NEAR_ZERO_DEG = 120
const DEFAULT_MAX_WINDOW_DAYS = 900

const WINDOW_CACHE_MAX = 48
const windowCache: LruMap<string, TrailWindowSpec> = new Map()

function clampInt(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(x)))
}

function elongationAtMs(provider: EphemerisProvider, body: BodyId, timeMs: number): number | null {
  const date = new Date(timeMs)
  const bodyState = provider.getBodyState(body, date)
  const sunState = provider.getBodyState('sun', date)
  if (!bodyState || !sunState) return null
  return elongationRad(bodyState.lonRad, sunState.lonRad)
}

function findConjunctionTimeMs(
  provider: EphemerisProvider,
  body: BodyId,
  startMs: number,
  direction: -1 | 1,
  stepMs: number,
  maxSteps: number,
  nearZeroRad: number,
): number | null {
  let tPrev = startMs
  let ePrev = elongationAtMs(provider, body, tPrev)
  if (ePrev === null) return null

  for (let i = 1; i <= maxSteps; i++) {
    const t = startMs + direction * i * stepMs
    const e = elongationAtMs(provider, body, t)
    if (e === null) return null

    if (ePrev === 0) return tPrev
    if (e === 0) return t

    if (ePrev * e < 0) {
      const maxAbs = Math.max(Math.abs(ePrev), Math.abs(e))
      if (maxAbs <= nearZeroRad) {
        const frac = -ePrev / (e - ePrev)
        return tPrev + Math.min(1, Math.max(0, frac)) * (t - tPrev)
      }
    }

    tPrev = t
    ePrev = e
  }

  return null
}

function requiredWindowDaysForConjunctions(
  provider: EphemerisProvider,
  body: BodyId,
  centerMs: number,
  stepHours: number,
  marginDays: number,
  searchMaxDays: number,
  nearZeroRad: number,
): number | null {
  const stepMs = Math.max(1, stepHours) * MS_PER_HOUR
  const maxSteps = Math.ceil((searchMaxDays * MS_PER_DAY) / stepMs)

  const prev = findConjunctionTimeMs(
    provider,
    body,
    centerMs - stepMs,
    -1,
    stepMs,
    maxSteps,
    nearZeroRad,
  )
  const next = findConjunctionTimeMs(
    provider,
    body,
    centerMs + stepMs,
    1,
    stepMs,
    maxSteps,
    nearZeroRad,
  )

  if (prev === null || next === null) return null

  const daysToPrev = (centerMs - prev) / MS_PER_DAY
  const daysToNext = (next - centerMs) / MS_PER_DAY
  return Math.ceil(Math.max(daysToPrev, daysToNext) + marginDays)
}

export function resolveTrailWindow(
  provider: EphemerisProvider,
  body: BodyId,
  t0Ms: number,
  baseWindowDays: number,
  stepHours: number,
  options: TrailWindowOptions = {},
): TrailWindowSpec {
  const ensureConjunctions = options.ensureConjunctions ?? false
  const conjMarginDays = options.conjunctionMarginDays ?? DEFAULT_CONJ_MARGIN_DAYS
  const conjSearchMaxDays = options.conjunctionSearchMaxDays ?? DEFAULT_CONJ_SEARCH_MAX_DAYS
  const conjNearZeroRad = degToRad(options.conjunctionSearchNearZeroDeg ?? DEFAULT_CONJ_NEAR_ZERO_DEG)
  const maxWindowDays = options.maxWindowDays ?? DEFAULT_MAX_WINDOW_DAYS

  const cacheKey = `${body}:${t0Ms}:${baseWindowDays}:${stepHours}:${Number(ensureConjunctions)}:${conjMarginDays}:${conjSearchMaxDays}:${conjNearZeroRad}:${maxWindowDays}`
  const cached = lruGet(windowCache, cacheKey)
  if (cached) return cached

  let windowDays = clampInt(baseWindowDays, baseWindowDays, maxWindowDays)
  let centerMs = trailCenterMsFor(t0Ms, windowDays)

  // Iterate a couple times because windowDays affects the bucketing used by centerMs.
  for (let iter = 0; iter < 3; iter++) {
    centerMs = trailCenterMsFor(t0Ms, windowDays)
    if (!ensureConjunctions || body === 'sun') break

    const required = requiredWindowDaysForConjunctions(
      provider,
      body,
      centerMs,
      stepHours,
      conjMarginDays,
      conjSearchMaxDays,
      conjNearZeroRad,
    )

    if (required === null) break

    const nextWindow = clampInt(Math.max(baseWindowDays, required), baseWindowDays, maxWindowDays)
    if (nextWindow === windowDays) break
    windowDays = nextWindow
  }

  const out: TrailWindowSpec = { centerMs: trailCenterMsFor(t0Ms, windowDays), windowDays }
  lruSet(windowCache, cacheKey, out, WINDOW_CACHE_MAX)
  return out
}
