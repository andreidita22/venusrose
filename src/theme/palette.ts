import type { ThemeMode } from './types'

export type ScenePalette = {
  canvasBg: string
  planeFill: string
  planeRim: string
  zoneRing: string
  zoneLabel: string
  zodiacWedgeA: string
  zodiacWedgeB: string
  zodiacGlyph: string
  stemLine: string
  labelText: string
  labelOutlineBg: string
  subtleText: string
}

export const SCENE_PALETTE: Record<ThemeMode, ScenePalette> = {
  dark: {
    canvasBg: '#070A12',
    planeFill: '#0b1327',
    planeRim: '#2a3a62',
    zoneRing: '#6f86c7',
    zoneLabel: '#b9c5ff',
    zodiacWedgeA: '#2b3b66',
    zodiacWedgeB: '#22335f',
    zodiacGlyph: '#e7edff',
    stemLine: '#b9c5ff',
    labelText: '#e7edff',
    labelOutlineBg: '#050812',
    subtleText: '#8fa2d9',
  },
  light: {
    canvasBg: '#f5f7ff',
    planeFill: '#ffffff',
    planeRim: '#cfd7ef',
    zoneRing: '#5164a3',
    zoneLabel: '#33406b',
    zodiacWedgeA: '#dbe4ff',
    zodiacWedgeB: '#eef2ff',
    zodiacGlyph: '#111827',
    stemLine: '#3b4a7a',
    labelText: '#111827',
    labelOutlineBg: '#ffffff',
    subtleText: '#475569',
  },
}
