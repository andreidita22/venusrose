import type { BodyId } from './config'

export type BodyMeta = {
  id: BodyId
  label: string
  glyph: string
  color: string
}

export const BODY_META: Record<BodyId, BodyMeta> = {
  sun: { id: 'sun', label: 'Sun', glyph: '☉', color: '#ffd36a' },
  moon: { id: 'moon', label: 'Moon', glyph: '☽', color: '#d7e1ff' },
  mercury: { id: 'mercury', label: 'Mercury', glyph: '☿', color: '#9fe1ff' },
  venus: { id: 'venus', label: 'Venus', glyph: '♀', color: '#ffd1dc' },
  mars: { id: 'mars', label: 'Mars', glyph: '♂', color: '#ff8a7a' },
  jupiter: { id: 'jupiter', label: 'Jupiter', glyph: '♃', color: '#ffc07a' },
  saturn: { id: 'saturn', label: 'Saturn', glyph: '♄', color: '#ffe08b' },
  uranus: { id: 'uranus', label: 'Uranus', glyph: '♅', color: '#7dffde' },
  neptune: { id: 'neptune', label: 'Neptune', glyph: '♆', color: '#7fa7ff' },
  pluto: { id: 'pluto', label: 'Pluto', glyph: '♇', color: '#c8b0ff' },
  mean_node: { id: 'mean_node', label: 'Mean Node', glyph: '☊', color: '#cfe7ff' },
}

export const DEFAULT_BODY_ORDER: readonly BodyId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]
