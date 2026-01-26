import { wrapTo2Pi, wrapToPi } from './math/angles'

// Synodic phase: 0..2π where 0 means conjunction (same ecliptic longitude as the Sun).
export function synodicPhaseRad(bodyLonRad: number, sunLonRad: number): number {
  return wrapTo2Pi(bodyLonRad - sunLonRad)
}

// Elongation: signed -π..π where 0 means conjunction; ±π means opposition.
export function elongationRad(bodyLonRad: number, sunLonRad: number): number {
  return wrapToPi(bodyLonRad - sunLonRad)
}

