import type { BodyId } from '../config'
import type { EphemerisProvider } from '../ephemeris/types'
import type { BodyState } from '../ephemeris/types'
import { MS_PER_DAY, MS_PER_HOUR } from '../math/time'

export function makeSampleTimes(t0: Date, windowDays: number, stepHours: number): Date[] {
  const stepMs = stepHours * MS_PER_HOUR
  const startMs = t0.getTime() - windowDays * MS_PER_DAY
  const endMs = t0.getTime() + windowDays * MS_PER_DAY

  const times: Date[] = []
  for (let t = startMs; t <= endMs + stepMs / 2; t += stepMs) {
    times.push(new Date(t))
  }
  return times
}

export function sampleBodyStates(
  provider: EphemerisProvider,
  body: BodyId,
  times: readonly Date[],
): BodyState[] {
  const out: BodyState[] = []
  for (const time of times) {
    const state = provider.getBodyState(body, time)
    if (!state) {
      throw new Error(`Provider returned null for body=${body} at ${time.toISOString()}`)
    }
    out.push(state)
  }
  return out
}
