import * as Astronomy from 'astronomy-engine'
import type { BodyId } from '../config'
import { degToRad, wrapTo2Pi } from '../math/angles'
import type { BodyState, EphemerisProvider } from './types'

const BODY_MAP: Partial<Record<BodyId, Astronomy.Body>> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
}

export class AstronomyEngineProvider implements EphemerisProvider {
  getBodyState(body: BodyId, date: Date): BodyState | null {
    const astroBody = BODY_MAP[body]
    if (!astroBody) return null

    const eqj = Astronomy.GeoVector(astroBody, date, false)
    const ecl = Astronomy.Ecliptic(eqj)

    const lonRad = wrapTo2Pi(degToRad(ecl.elon))
    const latRad = degToRad(ecl.elat)
    const distAu = ecl.vec.Length()

    return { body, date, lonRad, latRad, distAu }
  }
}

export const astronomyEngineProvider = new AstronomyEngineProvider()
