import { degToRad, wrapTo2Pi } from '../math/angles'
import { julianCenturiesSinceJ2000UTC } from '../math/time'

// Meeus (approx): mean longitude of the ascending node of the Moon.
// Returns radians in [0, 2π).
export function meanLunarNodeLongitudeRad(date: Date): number {
  const T = julianCenturiesSinceJ2000UTC(date)
  const lonDeg =
    125.04452 -
    1934.136261 * T +
    0.0020708 * T * T +
    (T * T * T) / 450000

  return wrapTo2Pi(degToRad(lonDeg))
}

