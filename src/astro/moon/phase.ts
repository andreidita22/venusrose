export function moonIlluminationFraction(elongationRad: number): number {
  // Approx illumination fraction from elongation:
  // new (0) -> 0, full (π) -> 1.
  const raw = 0.5 * (1 - Math.cos(elongationRad))
  if (!Number.isFinite(raw)) return 0
  return Math.min(1, Math.max(0, raw))
}

