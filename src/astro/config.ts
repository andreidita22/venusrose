export const AU_BREAKS = [0.0, 0.0035, 2.0, 4.0, 11.0, 40.0] as const
export const R_BREAKS = [0.0, 1.8, 6.0, 8.0, 11.0, 14.0] as const

export const CHART_OUTER_RADIUS = R_BREAKS[R_BREAKS.length - 1]

export const Z_SCALE = 2.5

export const MAX_TILT_DEG = 75
export const STEM_FADE_IN_TILT_DEG = 10
export const STEM_FULL_TILT_DEG = 20

export const TOKEN_RADIUS = 0.18
export const TOKEN_SELECTED_SCALE = 1.35
export const LAT_CUE_MIN_ABS_DEG = 0.05

export const STATION_EPS_DEG_PER_DAY = 0.03
export const DEFAULT_EVENT_ORB_DEG = 1.0
export const INNER_CONJ_ORB_DEG = 1.5

export const V0_BODIES = [
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
  'mean_node',
] as const

export type BodyId = (typeof V0_BODIES)[number]

export const EVENT_ORB_DEG_BY_BODY: Record<BodyId, number> = {
  sun: DEFAULT_EVENT_ORB_DEG,
  moon: DEFAULT_EVENT_ORB_DEG,
  mercury: DEFAULT_EVENT_ORB_DEG,
  venus: DEFAULT_EVENT_ORB_DEG,
  mars: DEFAULT_EVENT_ORB_DEG,
  jupiter: DEFAULT_EVENT_ORB_DEG,
  saturn: DEFAULT_EVENT_ORB_DEG,
  uranus: DEFAULT_EVENT_ORB_DEG,
  neptune: DEFAULT_EVENT_ORB_DEG,
  pluto: DEFAULT_EVENT_ORB_DEG,
  mean_node: DEFAULT_EVENT_ORB_DEG,
}

export const INNER_CONJ_ORB_DEG_BY_BODY: Record<BodyId, number> = {
  sun: INNER_CONJ_ORB_DEG,
  moon: INNER_CONJ_ORB_DEG,
  mercury: INNER_CONJ_ORB_DEG,
  venus: INNER_CONJ_ORB_DEG,
  mars: DEFAULT_EVENT_ORB_DEG,
  jupiter: DEFAULT_EVENT_ORB_DEG,
  saturn: DEFAULT_EVENT_ORB_DEG,
  uranus: DEFAULT_EVENT_ORB_DEG,
  neptune: DEFAULT_EVENT_ORB_DEG,
  pluto: DEFAULT_EVENT_ORB_DEG,
  mean_node: DEFAULT_EVENT_ORB_DEG,
}

export const TRAIL_STEP_HOURS: Record<BodyId, number> = {
  sun: 12,
  moon: 6,
  mercury: 6,
  venus: 6,
  mars: 12,
  jupiter: 12,
  saturn: 12,
  uranus: 24,
  neptune: 24,
  pluto: 24,
  mean_node: 24,
}

export const TRAIL_WINDOW_DAYS: Record<BodyId, number> = {
  sun: 120,
  moon: 30,
  mercury: 60,
  venus: 60,
  mars: 240,
  jupiter: 365,
  saturn: 365,
  uranus: 540,
  neptune: 540,
  pluto: 540,
  mean_node: 540,
}

export const ZONE_RING_LABELS = ['Moon', 'Inner', 'Belt', 'Gas', 'Outer'] as const

export const ZODIAC = [
  { key: 'aries', label: 'Aries', glyph: '♈' },
  { key: 'taurus', label: 'Taurus', glyph: '♉' },
  { key: 'gemini', label: 'Gemini', glyph: '♊' },
  { key: 'cancer', label: 'Cancer', glyph: '♋' },
  { key: 'leo', label: 'Leo', glyph: '♌' },
  { key: 'virgo', label: 'Virgo', glyph: '♍' },
  { key: 'libra', label: 'Libra', glyph: '♎' },
  { key: 'scorpio', label: 'Scorpio', glyph: '♏' },
  { key: 'sagittarius', label: 'Sagittarius', glyph: '♐' },
  { key: 'capricorn', label: 'Capricorn', glyph: '♑' },
  { key: 'aquarius', label: 'Aquarius', glyph: '♒' },
  { key: 'pisces', label: 'Pisces', glyph: '♓' },
] as const

export type ZodiacSignKey = (typeof ZODIAC)[number]['key']
