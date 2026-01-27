import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { BODY_META } from '../astro/bodies'
import { STATION_EPS_DEG_PER_DAY, TRAIL_STEP_HOURS, TRAIL_WINDOW_DAYS, Z_SCALE } from '../astro/config'
import { astronomyEngineProvider } from '../astro/ephemeris/providerAstronomyEngine'
import { eclipticToScenePosition } from '../astro/math/ecliptic'
import { scaleRadiusAUToScene } from '../astro/math/scale'
import { getTrailAnalysis, trailCenterMsFor } from '../astro/trails/cache'
import { resolveTrailWindow } from '../astro/trails/window'
import type { MotionKind, StationEvent } from '../astro/trails/retrograde'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

const TRAIL_Z_OFFSET = 0.0025

type Seg = { kind: MotionKind; points: [number, number, number][] }

type SegWithIndex = Seg & { startIndex: number }

function splitByMotion(points: [number, number, number][], motionAtPoints: MotionKind[]): SegWithIndex[] {
  if (points.length === 0) return []
  if (motionAtPoints.length !== points.length) throw new Error('motionAtPoints and points length mismatch')

  const out: SegWithIndex[] = []
  let currentKind = motionAtPoints[0]
  let currentPoints: [number, number, number][] = [points[0]]
  let currentStartIndex = 0

  for (let i = 0; i < points.length - 1; i++) {
    const segKind = motionAtPoints[i]
    if (segKind !== currentKind && currentPoints.length > 1) {
      out.push({ kind: currentKind, points: currentPoints, startIndex: currentStartIndex })
      currentKind = segKind
      currentPoints = [points[i]]
      currentStartIndex = i
    }
    currentPoints.push(points[i + 1])
  }

  if (currentPoints.length > 1) {
    out.push({ kind: currentKind, points: currentPoints, startIndex: currentStartIndex })
  }
  return out
}

function motionStyle(kind: MotionKind): { opacity: number; lineWidth: number; dashed: boolean } {
  switch (kind) {
    case 'retrograde':
      return { opacity: 0.92, lineWidth: 2.4, dashed: true }
    case 'station':
      return { opacity: 0.85, lineWidth: 2.6, dashed: false }
    case 'direct':
    default:
      return { opacity: 0.35, lineWidth: 1.8, dashed: false }
  }
}

function stationColor(kind: StationEvent['kind']): string {
  return kind === 'station_retro' ? '#ff7668' : '#7fd3ff'
}

export function Trails() {
  const t0 = useAppStore((s) => s.t0)
  const selectedBody = useAppStore((s) => s.selectedBody)
  const showTrails = useAppStore((s) => s.showTrails)
  const showEvents = useAppStore((s) => s.showEvents)
  const trailMode = useAppStore((s) => s.trailMode)
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]

  const t0Ms = t0.getTime()
  const baseWindowDays = selectedBody ? TRAIL_WINDOW_DAYS[selectedBody] : 0
  const baseCenterMs = useMemo(() => {
    if (!showTrails || !selectedBody) return t0Ms
    return trailCenterMsFor(t0Ms, baseWindowDays)
  }, [baseWindowDays, selectedBody, showTrails, t0Ms])

  const spec = useMemo(() => {
    if (!showTrails || !selectedBody) return null
    return resolveTrailWindow(
      astronomyEngineProvider,
      selectedBody,
      baseCenterMs,
      baseWindowDays,
      TRAIL_STEP_HOURS[selectedBody],
      { ensureConjunctions: showEvents },
    )
  }, [baseCenterMs, baseWindowDays, selectedBody, showEvents, showTrails])

  const analysis = useMemo(() => {
    if (!spec || !selectedBody) return null
    const windowDays = spec.windowDays
    const stepHours = TRAIL_STEP_HOURS[selectedBody]
    return getTrailAnalysis(
      astronomyEngineProvider,
      selectedBody,
      spec.centerMs,
      windowDays,
      stepHours,
      STATION_EPS_DEG_PER_DAY,
    )
  }, [selectedBody, spec])

  const trail = useMemo(() => {
    if (!analysis || !selectedBody) return null

    const baseRadius = scaleRadiusAUToScene(analysis.current.distAu)

    const points: [number, number, number][] = analysis.samples.map((s) => {
      if (trailMode === 'wheel') {
        return [Math.cos(s.lonRad) * baseRadius, Math.sin(s.lonRad) * baseRadius, TRAIL_Z_OFFSET]
      }
      const [x, y, z] = eclipticToScenePosition(
        s.lonRad,
        s.latRad,
        s.distAu,
        Z_SCALE,
        scaleRadiusAUToScene,
      )
      return [x, y, z]
    })

    const segments = splitByMotion(points, analysis.motionAtPoints)

    const stationPoints = analysis.stationStates.map((ev) => {
      if (trailMode === 'wheel') {
        return {
          ...ev,
          position: [Math.cos(ev.state.lonRad) * baseRadius, Math.sin(ev.state.lonRad) * baseRadius, TRAIL_Z_OFFSET],
        }
      }
      const position = eclipticToScenePosition(
        ev.state.lonRad,
        ev.state.latRad,
        ev.state.distAu,
        Z_SCALE,
        scaleRadiusAUToScene,
      )
      return { ...ev, position }
    })

    return { body: selectedBody, segments, stationPoints, color: BODY_META[selectedBody].color }
  }, [analysis, selectedBody, trailMode])

  if (!trail) return null

  return (
    <group renderOrder={3.6}>
      {trail.segments.map((seg) => {
        const style = motionStyle(seg.kind)
        return (
          <Line
            key={`${seg.kind}-${seg.startIndex}`}
            points={seg.points}
            color={seg.kind === 'direct' ? palette.zoneRing : trail.color}
            transparent
            opacity={style.opacity}
            lineWidth={style.lineWidth}
            dashed={style.dashed}
            dashScale={1}
            dashSize={0.35}
            gapSize={0.25}
            depthWrite={false}
          />
        )
      })}

      {trail.stationPoints.map((ev) => (
        <mesh
          key={`${ev.kind}-${Math.round(ev.timeMs)}`}
          position={ev.position}
          rotation={[0, 0, Math.PI / 4]}
          renderOrder={3.7}
        >
          <boxGeometry args={[0.14, 0.14, 0.02]} />
          <meshBasicMaterial
            color={stationColor(ev.kind)}
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
