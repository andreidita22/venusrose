import { Billboard, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { BODY_META } from '../astro/bodies'
import {
  EVENT_ORB_DEG_BY_BODY,
  INNER_CONJ_ORB_DEG_BY_BODY,
  STATION_EPS_DEG_PER_DAY,
  TRAIL_STEP_HOURS,
  TRAIL_WINDOW_DAYS,
  Z_SCALE,
} from '../astro/config'
import { computeSynodicEvents, filterSynodicEvents } from '../astro/events/synodicEvents'
import { astronomyEngineProvider } from '../astro/ephemeris/providerAstronomyEngine'
import { eclipticToScenePosition } from '../astro/math/ecliptic'
import { scaleRadiusAUToScene } from '../astro/math/scale'
import { getTrailAnalysis, trailCenterMsFor } from '../astro/trails/cache'
import { resolveTrailWindow } from '../astro/trails/window'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

const EVENT_Z_OFFSET = 0.012
const EVENT_LABEL_Z_OFFSET = 0.26
const EVENT_LABEL_FONT_SIZE = 0.24
const EVENT_LABEL_OUTLINE_WIDTH = 0.02

function stationColor(kind: 'station_retro' | 'station_direct'): string {
  return kind === 'station_retro' ? '#ff7668' : '#7fd3ff'
}

export function EventMarkers() {
  const t0 = useAppStore((s) => s.t0)
  const setT0 = useAppStore((s) => s.setT0)
  const setIsPlaying = useAppStore((s) => s.setIsPlaying)
  const selectedBody = useAppStore((s) => s.selectedBody)
  const showEvents = useAppStore((s) => s.showEvents)
  const eventKinds = useAppStore((s) => s.eventKinds)
  const showTrails = useAppStore((s) => s.showTrails)
  const trailMode = useAppStore((s) => s.trailMode)
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]

  const windowDays = selectedBody ? TRAIL_WINDOW_DAYS[selectedBody] : 0
  const stepHours = selectedBody ? TRAIL_STEP_HOURS[selectedBody] : 0

  const t0Ms = t0.getTime()
  const baseCenterMs = useMemo(() => {
    if (!showEvents || !selectedBody) return t0Ms
    return trailCenterMsFor(t0Ms, windowDays)
  }, [selectedBody, showEvents, t0Ms, windowDays])

  const spec = useMemo(() => {
    if (!showEvents || !selectedBody) return null
    return resolveTrailWindow(
      astronomyEngineProvider,
      selectedBody,
      baseCenterMs,
      windowDays,
      stepHours,
      { ensureConjunctions: true },
    )
  }, [baseCenterMs, selectedBody, showEvents, stepHours, windowDays])

  const analysis = useMemo(() => {
    if (!spec || !selectedBody) return null
    return getTrailAnalysis(
      astronomyEngineProvider,
      selectedBody,
      spec.centerMs,
      spec.windowDays,
      stepHours,
      STATION_EPS_DEG_PER_DAY,
    )
  }, [selectedBody, spec, stepHours])

  const markers = useMemo(() => {
    if (!showEvents || !selectedBody || !analysis || !spec) return null

    const baseRadius = scaleRadiusAUToScene(analysis.current.distAu)
    const events = filterSynodicEvents(
      computeSynodicEvents(
        astronomyEngineProvider,
        selectedBody,
        new Date(spec.centerMs),
        spec.windowDays,
        stepHours,
        {
          orbDeg: EVENT_ORB_DEG_BY_BODY[selectedBody],
          innerConjOrbDeg: INNER_CONJ_ORB_DEG_BY_BODY[selectedBody],
        },
      ),
      eventKinds,
    )

    return events
      .filter((ev) => {
        if (!showTrails) return true
        return ev.kind !== 'station_retro' && ev.kind !== 'station_direct'
      })
      .map((ev) => {
        const state = ev.bodyState
        const position: [number, number, number] =
          trailMode === 'wheel'
            ? [Math.cos(state.lonRad) * baseRadius, Math.sin(state.lonRad) * baseRadius, EVENT_Z_OFFSET]
            : eclipticToScenePosition(
                state.lonRad,
                state.latRad,
                state.distAu,
                Z_SCALE,
                scaleRadiusAUToScene,
              )

        const color =
          ev.kind === 'station_retro' || ev.kind === 'station_direct'
            ? stationColor(ev.kind)
            : BODY_META[selectedBody].color

        return { ...ev, position, color }
      })
  }, [analysis, selectedBody, eventKinds, showEvents, showTrails, spec, stepHours, trailMode])

  if (!markers || markers.length === 0 || !selectedBody) return null

  return (
    <group renderOrder={3.8}>
      {markers.map((m) => (
        <group
          key={`${m.kind}-${Math.round(m.timeMs)}`}
          position={m.position}
          onPointerDown={(e) => {
            e.stopPropagation()
            setIsPlaying(false)
            setT0(new Date(m.timeMs))
          }}
        >
          <Billboard position={[0, 0, EVENT_LABEL_Z_OFFSET]} follow>
            <Text
              fontSize={EVENT_LABEL_FONT_SIZE}
              color={m.color}
              anchorX="center"
              anchorY="middle"
              outlineColor={palette.labelOutlineBg}
              outlineWidth={EVENT_LABEL_OUTLINE_WIDTH}
              depthTest={false}
            >
              {m.label}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
