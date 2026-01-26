export const MS_PER_HOUR = 3_600_000
export const MS_PER_DAY = 86_400_000

export function julianDayUTC(date: Date): number {
  return date.getTime() / MS_PER_DAY + 2440587.5
}

export function julianCenturiesSinceJ2000UTC(date: Date): number {
  return (julianDayUTC(date) - 2451545.0) / 36525.0
}
