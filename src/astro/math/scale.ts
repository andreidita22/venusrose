import { AU_BREAKS, R_BREAKS } from '../config'

export function piecewiseLinearMap(
  x: number,
  xBreaks: readonly number[],
  yBreaks: readonly number[],
): number {
  if (xBreaks.length !== yBreaks.length) {
    throw new Error('xBreaks and yBreaks must have same length')
  }
  if (xBreaks.length < 2) {
    throw new Error('xBreaks must have at least 2 points')
  }

  const last = xBreaks.length - 1
  if (x <= xBreaks[0]) return yBreaks[0]
  if (x >= xBreaks[last]) return yBreaks[last]

  let i = 0
  while (i < last - 1 && x > xBreaks[i + 1]) i++

  const x0 = xBreaks[i]
  const x1 = xBreaks[i + 1]
  const y0 = yBreaks[i]
  const y1 = yBreaks[i + 1]

  if (x1 === x0) return y1
  const t = (x - x0) / (x1 - x0)
  return y0 + t * (y1 - y0)
}

export function scaleRadiusAUToScene(rAu: number): number {
  return piecewiseLinearMap(rAu, AU_BREAKS, R_BREAKS)
}
