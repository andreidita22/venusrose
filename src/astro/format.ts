import { ZODIAC } from './config'
import { radToDeg, wrapTo2Pi } from './math/angles'

export function zodiacIndexFromLonRad(lonRad: number): number {
  const deg = radToDeg(wrapTo2Pi(lonRad))
  return Math.floor(deg / 30) % 12
}

export function formatZodiacPosition(lonRad: number): string {
  const lonDeg = radToDeg(wrapTo2Pi(lonRad))
  const signIndex = Math.floor(lonDeg / 30) % 12
  const sign = ZODIAC[signIndex]

  const degInSign = lonDeg - signIndex * 30
  let wholeDeg = Math.floor(degInSign)
  let minutes = Math.round((degInSign - wholeDeg) * 60)
  if (minutes === 60) {
    minutes = 0
    wholeDeg = (wholeDeg + 1) % 30
  }

  const mm = String(minutes).padStart(2, '0')
  return `${wholeDeg}°${mm}' ${sign.glyph}`
}

export function formatSignedDegrees(deg: number, digits = 1): string {
  const sign = deg >= 0 ? '+' : '−'
  return `${sign}${Math.abs(deg).toFixed(digits)}°`
}

