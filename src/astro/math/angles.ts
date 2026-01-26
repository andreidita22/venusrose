export const TAU = Math.PI * 2

export function wrapTo2Pi(rad: number): number {
  let x = rad % TAU
  if (x < 0) x += TAU
  return x
}

export function wrapToPi(rad: number): number {
  let x = (rad + Math.PI) % TAU
  if (x < 0) x += TAU
  return x - Math.PI
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}
