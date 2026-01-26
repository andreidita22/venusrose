export function unwrapRadians(lons: readonly number[]): number[] {
  if (lons.length === 0) return []

  const out = [lons[0]]
  for (let i = 1; i < lons.length; i++) {
    let d = lons[i] - lons[i - 1]
    while (d <= -Math.PI) d += 2 * Math.PI
    while (d > Math.PI) d -= 2 * Math.PI
    out.push(out[i - 1] + d)
  }
  return out
}
