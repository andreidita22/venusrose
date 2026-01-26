export function eclipticUnitVector(lonRad: number, latRad: number): [number, number, number] {
  const cosB = Math.cos(latRad)
  return [cosB * Math.cos(lonRad), cosB * Math.sin(lonRad), Math.sin(latRad)]
}

export function eclipticToScenePosition(
  lonRad: number,
  latRad: number,
  distAu: number,
  zScale: number,
  radiusMap: (distAu: number) => number,
): [number, number, number] {
  const [ux, uy, uz] = eclipticUnitVector(lonRad, latRad)
  const R = radiusMap(distAu)
  return [ux * R, uy * R, uz * zScale]
}

export function eclipticToWheelPosition(lonRad: number, radius: number): [number, number, number] {
  return [Math.cos(lonRad) * radius, Math.sin(lonRad) * radius, 0]
}
