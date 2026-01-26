const MS_PER_DAY = 24 * 60 * 60 * 1000

export function julianDayUTC(date: Date): number {
  return date.getTime() / MS_PER_DAY + 2440587.5
}

export function julianCenturiesSinceJ2000UTC(date: Date): number {
  return (julianDayUTC(date) - 2451545.0) / 36525.0
}

