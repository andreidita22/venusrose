import type { BodyId } from '../config'

export type EclipticSpherical = {
  lonRad: number
  latRad: number
  distAu: number
}

export type BodyState = EclipticSpherical & {
  body: BodyId
  date: Date
}

export type EphemerisProvider = {
  getBodyState: (body: BodyId, date: Date) => BodyState | null
}
