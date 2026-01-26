import { useMemo } from 'react'
import { BODY_META } from '../astro/bodies'
import {
  INNER_CONJ_ORB_DEG,
  STATION_EPS_DEG_PER_DAY,
  TRAIL_STEP_HOURS,
  TRAIL_WINDOW_DAYS,
} from '../astro/config'
import type { BodyId } from '../astro/config'
import type { BodyState } from '../astro/ephemeris/types'
import { astronomyEngineProvider } from '../astro/ephemeris/providerAstronomyEngine'
import { degToRad, radToDeg } from '../astro/math/angles'
import { MS_PER_DAY } from '../astro/math/time'
import { unwrapRadians } from '../astro/math/unwrap'
import { elongationRad, synodicPhaseRad } from '../astro/synodic'
import { makeSampleTimes, sampleBodyStates } from '../astro/trails/sampling'
import { computeDerivativeDegPerDay, motionFromDerivative, type MotionKind } from '../astro/trails/retrograde'
import type { ThemeMode } from '../theme/types'
import { SCENE_PALETTE } from '../theme/palette'
const DIAL_SIZE = 108
const DIAL_CX = DIAL_SIZE / 2
const DIAL_CY = DIAL_SIZE / 2
const DIAL_R_OUTER = 46
const DIAL_R_RETRO = 40
const DIAL_R_CENTER = 18

type SynodicDialProps = {
  body: BodyId
  bodyState: BodyState
  sunState: BodyState
  t0: Date
  theme: ThemeMode
}

type RetroSegment = { points: string }

function polarPoint(cx: number, cy: number, r: number, phaseRad: number): { x: number; y: number } {
  // rotate -90° so 0 is at the top (dial/clock style)
  const a = phaseRad - Math.PI / 2
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function toPointsString(points: readonly { x: number; y: number }[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

export function SynodicDial({ body, bodyState, sunState, t0, theme }: SynodicDialProps) {
  const palette = SCENE_PALETTE[theme]
  const bodyColor = BODY_META[body].color

  const t0Ms = t0.getTime()
  const windowDays = TRAIL_WINDOW_DAYS[body]
  const stepHours = TRAIL_STEP_HOURS[body]
  const bucketMs = windowDays * MS_PER_DAY * 0.25
  const centerMs = bucketMs > 0 ? Math.round(t0Ms / bucketMs) * bucketMs : t0Ms

  const phaseRad = synodicPhaseRad(bodyState.lonRad, sunState.lonRad)
  const phaseDeg = radToDeg(phaseRad)
  const elongRad = elongationRad(bodyState.lonRad, sunState.lonRad)
  const elongDeg = radToDeg(elongRad)

  const isInner = body === 'mercury' || body === 'venus'
  const isNearConjunction = isInner && Math.abs(elongRad) <= degToRad(INNER_CONJ_ORB_DEG)
  const conjKind = isNearConjunction ? (bodyState.distAu < sunState.distAu ? 'inferior' : 'superior') : null

  const sampled = useMemo((): { retroSegments: RetroSegment[]; peakMarkers: { x: number; y: number }[] } => {
    const center = new Date(centerMs)
    const times = makeSampleTimes(center, windowDays, stepHours)
    const planetSamples = sampleBodyStates(astronomyEngineProvider, body, times)
    const sunSamples = sampleBodyStates(astronomyEngineProvider, 'sun', times)

    const timesMs = planetSamples.map((s) => s.date.getTime())
    const lon = planetSamples.map((s) => s.lonRad)
    const lonU = unwrapRadians(lon)
    const dLonDegPerDay = computeDerivativeDegPerDay(timesMs, lonU)
    const motionAt: MotionKind[] = dLonDegPerDay.map((d) => motionFromDerivative(d, STATION_EPS_DEG_PER_DAY))

    const phaseAt = planetSamples.map((s, i) => synodicPhaseRad(s.lonRad, sunSamples[i].lonRad))
    const elongAt = planetSamples.map((s, i) => elongationRad(s.lonRad, sunSamples[i].lonRad))
    const absElongAt = elongAt.map((e) => Math.abs(e))

    const retroSegments: RetroSegment[] = []
    let current: { x: number; y: number }[] = []

    for (let i = 0; i < phaseAt.length; i++) {
      const isRetro = motionAt[i] === 'retrograde'
      if (!isRetro) {
        if (current.length >= 2) retroSegments.push({ points: toPointsString(current) })
        current = []
        continue
      }
      current.push(polarPoint(DIAL_CX, DIAL_CY, DIAL_R_RETRO, phaseAt[i]))
    }
    if (current.length >= 2) retroSegments.push({ points: toPointsString(current) })

    const peaks: { phaseRad: number; absElongRad: number }[] = []
    if (isInner) {
      const minPeak = degToRad(10)
      for (let i = 1; i < absElongAt.length - 1; i++) {
        const v = absElongAt[i]
        if (v < minPeak) continue
        if (v > absElongAt[i - 1] && v >= absElongAt[i + 1]) {
          peaks.push({ phaseRad: phaseAt[i], absElongRad: v })
        }
      }
    }

    const peakMarkers = [...peaks]
      .sort((a, b) => b.absElongRad - a.absElongRad)
      .slice(0, 2)
      .map((p) => polarPoint(DIAL_CX, DIAL_CY, DIAL_R_OUTER - 6, p.phaseRad))

    return { retroSegments, peakMarkers }
  }, [body, centerMs, isInner, stepHours, windowDays])

  const marker = polarPoint(DIAL_CX, DIAL_CY, DIAL_R_OUTER, phaseRad)

  const tickAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
  const baseStroke = theme === 'dark' ? palette.zoneRing : palette.planeRim

  return (
    <div className="synodicDial" title={`Δλ ${phaseDeg.toFixed(1)}°`}>
      <svg
        className="synodicDialSvg"
        width={DIAL_SIZE}
        height={DIAL_SIZE}
        viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
        role="img"
        aria-label="Synodic dial"
      >
        <circle
          cx={DIAL_CX}
          cy={DIAL_CY}
          r={DIAL_R_OUTER}
          fill="none"
          stroke={baseStroke}
          strokeOpacity={0.45}
          strokeWidth={2}
        />

        {tickAngles.map((a) => {
          const p0 = polarPoint(DIAL_CX, DIAL_CY, DIAL_R_OUTER - 4, a)
          const p1 = polarPoint(DIAL_CX, DIAL_CY, DIAL_R_OUTER + 2, a)
          return (
            <line
              key={a}
              x1={p0.x}
              y1={p0.y}
              x2={p1.x}
              y2={p1.y}
              stroke={baseStroke}
              strokeOpacity={0.55}
              strokeWidth={2}
            />
          )
        })}

        {sampled.retroSegments.map((seg) => (
          <polyline
            key={seg.points}
            points={seg.points}
            fill="none"
            stroke={bodyColor}
            strokeOpacity={0.5}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {sampled.peakMarkers.map((p) => (
          <circle
            key={`${p.x.toFixed(2)}-${p.y.toFixed(2)}`}
            cx={p.x}
            cy={p.y}
            r={2.6}
            fill={bodyColor}
            opacity={0.9}
          />
        ))}

        <circle cx={marker.x} cy={marker.y} r={4} fill={bodyColor} opacity={0.95} />
        <circle
          cx={DIAL_CX}
          cy={DIAL_CY}
          r={DIAL_R_CENTER}
          fill={theme === 'dark' ? '#050812' : '#ffffff'}
          opacity={0.72}
        />

        <text
          x={DIAL_CX}
          y={DIAL_CY - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={palette.labelText}
          fontSize={13}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {phaseDeg.toFixed(0)}°
        </text>
        <text
          x={DIAL_CX}
          y={DIAL_CY + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={palette.subtleText}
          fontSize={10}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {elongDeg >= 0 ? '+' : '−'}
          {Math.abs(elongDeg).toFixed(0)}°
        </text>
      </svg>

      <div className="synodicDialCaption">
        <span className="synodicDialCaptionTitle">Synodic</span>
        <span className="synodicDialCaptionValue">Δλ {phaseDeg.toFixed(1)}°</span>
        {conjKind ? (
          <span className="synodicDialCaptionHint">
            {conjKind === 'inferior' ? 'Inferior ☌' : 'Superior ☌'}
          </span>
        ) : null}
        {!isInner ? (
          <span className="synodicDialCaptionHint">0° ☌ · 90° □ · 180° ☍ · 270° □</span>
        ) : (
          <span className="synodicDialCaptionHint">Retro segments shaded · peaks = max elong</span>
        )}
      </div>
    </div>
  )
}
