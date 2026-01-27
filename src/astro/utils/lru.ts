export type LruMap<K, V> = Map<K, V>

export function lruGet<K, V>(map: LruMap<K, V>, key: K): V | undefined {
  const value = map.get(key)
  if (value === undefined) return undefined
  map.delete(key)
  map.set(key, value)
  return value
}

export function lruSet<K, V>(map: LruMap<K, V>, key: K, value: V, maxSize: number): void {
  if (map.has(key)) map.delete(key)
  map.set(key, value)
  while (map.size > maxSize) {
    const oldestKey = map.keys().next().value as K | undefined
    if (oldestKey === undefined) break
    map.delete(oldestKey)
  }
}

