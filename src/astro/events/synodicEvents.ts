import { DEFAULT_EVENT_ORB_DEG, INNER_CONJ_ORB_DEG, STATION_EPS_DEG_PER_DAY } from '../config'
import type { BodyId } from '../config'
import type { BodyState, EphemerisProvider } from '../ephemeris/types'
import { degToRad, radToDeg, wrapToPi } from '../math/angles'
import { MS_PER_HOUR } from '../math/time'
import { elongationRad } from '../synodic'
import { getBodySamples, getTrailAnalysis, trailCenterMsFor } from '../trails/cache'

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

const EVENTS_CACHE_MAX = 32
const eventsCache: LruMap<string, readonly SynodicEvent[]> = new Map()

export type SynodicAspect = 'conjunction' | 'opposition' | 'square'

export type SynodicEventKind =
  | SynodicAspect
  | 'station_retro'
  | 'station_direct'
  | 'max_elongation'

export type ConjunctionKind = 'inferior' | 'superior'

export type SynodicEvent = {
  kind: SynodicEventKind
  timeMs: number
  bodyState: BodyState
  sunState: BodyState
  label: string
  details?: string
}

export type SynodicEventsOptions = {
  orbDeg?: number
  innerConjOrbDeg?: number
  maxElongationMinDeg?: number
}

function isInnerPlanet(body: BodyId): boolean {
  return body === 'mercury' || body === 'venus'
}

function findAngleCrossings(
  timesMs: readonly number[],
  valuesRad: readonly number[],
  targetRad: number,
): number[] {
  const n = timesMs.length
  if (valuesRad.length !== n) throw new Error('timesMs and valuesRad length mismatch')
  if (n < 2) return []

  const out: number[] = []
  const delta = valuesRad.map((v) => wrapToPi(v - targetRad))

  for (let i = 0; i < n - 1; i++) {
    const d0 = delta[i]
    const d1 = delta[i + 1]

    if (d0 === 0) {
      out.push(timesMs[i])
      continue
    }
    if (d0 === d1) continue
    if (d0 > 0 && d1 > 0) continue
    if (d0 < 0 && d1 < 0) continue

    const frac = -d0 / (d1 - d0)
    const t = timesMs[i] + Math.min(1, Math.max(0, frac)) * (timesMs[i + 1] - timesMs[i])
    out.push(t)
  }

  return out
}

function localMaximaIndices(values: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < values.length - 1; i++) {
    const v = values[i]
    if (v > values[i - 1] && v >= values[i + 1]) out.push(i)
  }
  return out
}

function uniqSortedTimes(timesMs: readonly number[], minSpacingMs: number): number[] {
  const sorted = [...timesMs].sort((a, b) => a - b)
  const out: number[] = []
  for (const t of sorted) {
    const last = out[out.length - 1]
    if (last === undefined || Math.abs(t - last) >= minSpacingMs) out.push(t)
  }
  return out
}

function formatConjunctionDetails(kind: ConjunctionKind): string {
  return kind === 'inferior' ? 'Inferior ☌' : 'Superior ☌'
}

export function computeSynodicEvents(
  provider: EphemerisProvider,
  body: BodyId,
  t0: Date,
  windowDays: number,
  stepHours: number,
  options: SynodicEventsOptions = {},
): readonly SynodicEvent[] {
  if (body === 'sun') return []

  const orbDeg = options.orbDeg ?? DEFAULT_EVENT_ORB_DEG
  const innerConjOrbDeg = options.innerConjOrbDeg ?? INNER_CONJ_ORB_DEG
  const maxElongationMinDeg = options.maxElongationMinDeg ?? 10

  const centerMs = trailCenterMsFor(t0.getTime(), windowDays)
  const cacheKey = `${body}:${centerMs}:${windowDays}:${stepHours}:${orbDeg}:${innerConjOrbDeg}:${maxElongationMinDeg}`
  const cached = lruGet(eventsCache, cacheKey)
  if (cached) return cached

  const analysis = getTrailAnalysis(
    provider,
    body,
    centerMs,
    windowDays,
    stepHours,
    STATION_EPS_DEG_PER_DAY,
  )
  const sunSamples = getBodySamples(provider, 'sun', centerMs, windowDays, stepHours)

  const timesMs = analysis.samples.map((s) => s.date.getTime())
  const elongAt = analysis.samples.map((s, i) => elongationRad(s.lonRad, sunSamples[i].lonRad))

  const isInner = isInnerPlanet(body)
  const orbConjRad = degToRad(isInner ? innerConjOrbDeg : orbDeg)
  const orbRad = degToRad(orbDeg)

  const out: SynodicEvent[] = []

  const minSpacingMs = stepHours * MS_PER_HOUR * 0.75

  const conjTimes = uniqSortedTimes(findAngleCrossings(timesMs, elongAt, 0), minSpacingMs)
  for (const timeMs of conjTimes) {
    const date = new Date(timeMs)
    const bodyState = provider.getBodyState(body, date)
    const sunState = provider.getBodyState('sun', date)
    if (!bodyState || !sunState) continue

    const elong = elongationRad(bodyState.lonRad, sunState.lonRad)
    const conjErr = Math.abs(wrapToPi(elong - 0))
    if (conjErr <= orbConjRad) {
      const conjKind: ConjunctionKind | null =
        isInner && bodyState.distAu !== sunState.distAu
          ? bodyState.distAu < sunState.distAu
            ? 'inferior'
            : 'superior'
          : null

      out.push({
        kind: 'conjunction',
        timeMs,
        bodyState,
        sunState,
        label: '☌',
        details: conjKind ? formatConjunctionDetails(conjKind) : undefined,
      })
    }
  }

  const oppTimes = uniqSortedTimes(findAngleCrossings(timesMs, elongAt, -Math.PI), minSpacingMs)
  for (const timeMs of oppTimes) {
    const date = new Date(timeMs)
    const bodyState = provider.getBodyState(body, date)
    const sunState = provider.getBodyState('sun', date)
    if (!bodyState || !sunState) continue

    const elong = elongationRad(bodyState.lonRad, sunState.lonRad)
    const oppErr = Math.abs(wrapToPi(elong + Math.PI))
    if (oppErr <= orbRad) {
      out.push({
        kind: 'opposition',
        timeMs,
        bodyState,
        sunState,
        label: '☍',
      })
    }
  }

  const sqPosTimes = uniqSortedTimes(findAngleCrossings(timesMs, elongAt, Math.PI / 2), minSpacingMs)
  for (const timeMs of sqPosTimes) {
    const date = new Date(timeMs)
    const bodyState = provider.getBodyState(body, date)
    const sunState = provider.getBodyState('sun', date)
    if (!bodyState || !sunState) continue

    const elong = elongationRad(bodyState.lonRad, sunState.lonRad)
    const err = Math.abs(wrapToPi(elong - Math.PI / 2))
    if (err <= orbRad) {
      out.push({
        kind: 'square',
        timeMs,
        bodyState,
        sunState,
        label: '□',
        details: 'Square +90°',
      })
    }
  }

  const sqNegTimes = uniqSortedTimes(findAngleCrossings(timesMs, elongAt, -Math.PI / 2), minSpacingMs)
  for (const timeMs of sqNegTimes) {
    const date = new Date(timeMs)
    const bodyState = provider.getBodyState(body, date)
    const sunState = provider.getBodyState('sun', date)
    if (!bodyState || !sunState) continue

    const elong = elongationRad(bodyState.lonRad, sunState.lonRad)
    const err = Math.abs(wrapToPi(elong + Math.PI / 2))
    if (err <= orbRad) {
      out.push({
        kind: 'square',
        timeMs,
        bodyState,
        sunState,
        label: '□',
        details: 'Square −90°',
      })
    }
  }

  for (const st of analysis.stationStates) {
    const sunState = provider.getBodyState('sun', new Date(st.timeMs))
    if (!sunState) continue
    out.push({
      kind: st.kind,
      timeMs: st.timeMs,
      bodyState: st.state,
      sunState,
      label: st.kind === 'station_retro' ? 'S℞' : 'Sᴅ',
    })
  }

  if (isInner) {
    const absElongAt = elongAt.map((e) => Math.abs(e))
    const minPeak = degToRad(maxElongationMinDeg)
    const peaks = localMaximaIndices(absElongAt)
      .filter((i) => absElongAt[i] >= minPeak)
      .map((i) => ({
        idx: i,
        absElong: absElongAt[i],
      }))
      .sort((a, b) => b.absElong - a.absElong)
      .slice(0, 2)

    for (const peak of peaks) {
      const timeMs = timesMs[peak.idx]
      const date = new Date(timeMs)
      const bodyState = provider.getBodyState(body, date)
      const sunState = provider.getBodyState('sun', date)
      if (!bodyState || !sunState) continue

      const elong = elongationRad(bodyState.lonRad, sunState.lonRad)
      const absDeg = radToDeg(Math.abs(elong))

      out.push({
        kind: 'max_elongation',
        timeMs,
        bodyState,
        sunState,
        label: 'El',
        details: `Max elong ${elong >= 0 ? '+' : '−'}${absDeg.toFixed(0)}°`,
      })
    }
  }

  out.sort((a, b) => a.timeMs - b.timeMs)
  lruSet(eventsCache, cacheKey, out, EVENTS_CACHE_MAX)
  return out
}
