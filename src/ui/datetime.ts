const pad2 = (n: number) => String(n).padStart(2, '0')

export function formatUTCDateTimeLocal(date: Date): string {
  return [
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`,
    `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`,
  ].join('T')
}

export function parseUTCDateTimeLocal(value: string): Date | null {
  if (!value) return null

  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null

  return new Date(Date.UTC(year, month - 1, day, hour, minute))
}
