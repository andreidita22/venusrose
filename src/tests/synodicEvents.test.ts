import { describe, expect, it } from 'vitest'
import { computeSynodicEvents } from '../astro/events/synodicEvents'
import type { BodyId } from '../astro/config'
import type { BodyState, EphemerisProvider } from '../astro/ephemeris/types'
import { MS_PER_DAY } from '../astro/math/time'

function makeLinearProvider(body: BodyId, omegaRadPerDay: number, distAu: number): EphemerisProvider {
  return {
    getBodyState: (b, date) => {
      if (b !== body && b !== 'sun') return null

      const tDays = date.getTime() / MS_PER_DAY
      const lonRad = b === 'sun' ? 0 : omegaRadPerDay * tDays
      const dist = b === 'sun' ? 1 : distAu

      const state: BodyState = {
        body: b,
        date,
        lonRad,
        latRad: 0,
        distAu: dist,
      }
      return state
    },
  }
}

describe('synodic events', () => {
  it('detects conjunction, squares, and opposition for linear motion', () => {
    const omega = Math.PI / 2 // 90° per day
    const provider = makeLinearProvider('mars', omega, 1.5)

    const t0 = new Date(2 * MS_PER_DAY) // center window so sample range is [0d..4d]
    const events = computeSynodicEvents(provider, 'mars', t0, 2, 12)

    expect(events.map((e) => e.kind)).toEqual([
      'conjunction',
      'square',
      'opposition',
      'square',
      'conjunction',
    ])

    expect(events.map((e) => Math.round(e.timeMs / MS_PER_DAY))).toEqual([0, 1, 2, 3, 4])
  })

  it('classifies inner conjunction as inferior/superior via distance', () => {
    const omega = Math.PI / 2 // 90° per day
    const provider = makeLinearProvider('mercury', omega, 0.5)

    const t0 = new Date(0)
    const events = computeSynodicEvents(provider, 'mercury', t0, 1, 12, { maxElongationMinDeg: 200 })

    const conj = events.find((e) => e.kind === 'conjunction')
    expect(conj).toBeTruthy()
    expect(conj?.details).toBe('Inferior ☌')
  })
})
