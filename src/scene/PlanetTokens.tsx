import { Billboard, Line, Text } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { Color } from 'three'
import { BODY_META, DEFAULT_BODY_ORDER } from '../astro/bodies'
import {
  LAT_CUE_MIN_ABS_DEG,
  STEM_FADE_IN_TILT_DEG,
  STEM_FULL_TILT_DEG,
  TOKEN_RADIUS,
  TOKEN_SELECTED_SCALE,
  Z_SCALE,
} from '../astro/config'
import type { BodyState } from '../astro/ephemeris/types'
import { astronomyEngineProvider } from '../astro/ephemeris/providerAstronomyEngine'
import { formatSignedDegrees } from '../astro/format'
import { eclipticToScenePosition, eclipticUnitVector } from '../astro/math/ecliptic'
import { radToDeg } from '../astro/math/angles'
import { scaleRadiusAUToScene } from '../astro/math/scale'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'
import { MoonPhaseMaterial } from './MoonPhaseMaterial'

const STEM_BASE_OPACITY = 0.85
const UNFOCUSED_OPACITY = 0.22
const OPAQUE_THRESHOLD = 0.999

const TOKEN_SEGMENTS = 24
const TOKEN_SELECTED_HALO_SCALE = 1.25
const TOKEN_SELECTED_HALO_OPACITY = 0.22
const TOKEN_SELECTED_HALO_SEGMENTS = 20

const BILLBOARD_Z_OFFSET = 0.35

const GLYPH_FONT_SIZE = 0.28
const GLYPH_OUTLINE_WIDTH = 0.015

const LAT_CUE_X = 0.34
const LAT_CUE_FONT_SIZE = 0.2

const LABEL_Y = -0.36
const LABEL_FONT_SIZE = 0.22
const LABEL_OUTLINE_WIDTH = 0.02

const LAT_LABEL_Y = -0.62
const LAT_LABEL_FONT_SIZE = 0.18

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

function stemOpacityForTilt(tiltDeg: number): number {
  if (tiltDeg <= STEM_FADE_IN_TILT_DEG) return 0
  return clamp01((tiltDeg - STEM_FADE_IN_TILT_DEG) / (STEM_FULL_TILT_DEG - STEM_FADE_IN_TILT_DEG))
}

export function PlanetTokens() {
  const t0 = useAppStore((s) => s.t0)
  const tiltDeg = useAppStore((s) => s.tiltDeg)
  const selectedBody = useAppStore((s) => s.selectedBody)
  const setSelectedBody = useAppStore((s) => s.setSelectedBody)
  const focusMode = useAppStore((s) => s.focusMode)
  const setBodyStates = useAppStore((s) => s.setBodyStates)
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]

  const bodyStates = useMemo(() => {
    const out: Partial<Record<string, BodyState>> = {}
    for (const body of DEFAULT_BODY_ORDER) {
      const state = astronomyEngineProvider.getBodyState(body, t0)
      if (state) out[body] = state
    }
    return out as Partial<Record<keyof typeof BODY_META, BodyState>>
  }, [t0])

  useEffect(() => {
    setBodyStates(bodyStates)
  }, [bodyStates, setBodyStates])

  const sunState = bodyStates.sun
  const sunVecAu = useMemo((): [number, number, number] | null => {
    if (!sunState) return null
    const [ux, uy, uz] = eclipticUnitVector(sunState.lonRad, sunState.latRad)
    return [ux * sunState.distAu, uy * sunState.distAu, uz * sunState.distAu]
  }, [sunState])

  const moonDarkColor = useMemo(() => {
    if (theme !== 'dark') return new Color('#111827')
    return new Color(palette.planeFill).lerp(new Color(palette.planeRim), 0.35)
  }, [palette.planeFill, palette.planeRim, theme])

  const stemOpacity = stemOpacityForTilt(tiltDeg)
  const cueOpacity = 1 - stemOpacity

  return (
    <group renderOrder={4}>
      {DEFAULT_BODY_ORDER.map((body) => {
        if (focusMode === 'solo' && selectedBody && body !== selectedBody) return null

        const state = bodyStates[body]
        if (!state) return null

        const meta = BODY_META[body]
        const pos = eclipticToScenePosition(
          state.lonRad,
          state.latRad,
          state.distAu,
          Z_SCALE,
          scaleRadiusAUToScene,
        )

        const isSelected = selectedBody === body
        const accentColor = new Color(meta.color)
        const tokenColor = accentColor
        let emissiveIntensity = isSelected ? 0.65 : 0.35
        let moonPhase:
          | { lightDir: [number, number, number]; viewDir: [number, number, number]; darkColor: Color }
          | null = null

        if (body === 'moon' && sunVecAu) {
          const [ux, uy, uz] = eclipticUnitVector(state.lonRad, state.latRad)
          const mx = ux * state.distAu
          const my = uy * state.distAu
          const mz = uz * state.distAu
          moonPhase = {
            lightDir: [sunVecAu[0] - mx, sunVecAu[1] - my, sunVecAu[2] - mz],
            viewDir: [-mx, -my, -mz],
            darkColor: moonDarkColor,
          }
          emissiveIntensity = isSelected ? 0.12 : 0.05
        }

        const latDeg = radToDeg(state.latRad)
        const showLatCue = Math.abs(latDeg) >= LAT_CUE_MIN_ABS_DEG && cueOpacity > 0.001
        const latCue = latDeg >= 0 ? '↑' : '↓'

        return (
          <PlanetToken
            key={body}
            hasSelection={Boolean(selectedBody)}
            focusMode={focusMode}
            position={pos}
            tokenColor={tokenColor}
            accentColor={accentColor}
            emissiveIntensity={emissiveIntensity}
            moonPhase={moonPhase}
            glyph={meta.glyph}
            label={meta.label}
            latLabel={`β ${formatSignedDegrees(latDeg, 1)}`}
            palette={palette}
            stemOpacity={stemOpacity}
            cueOpacity={cueOpacity}
            showLatCue={showLatCue}
            latCue={latCue}
            selected={isSelected}
            onSelect={() => setSelectedBody(isSelected ? null : body)}
          />
        )
      })}
    </group>
  )
}

type PlanetTokenProps = {
  hasSelection: boolean
  focusMode: 'off' | 'fade' | 'solo'
  position: [number, number, number]
  tokenColor: Color
  accentColor: Color
  emissiveIntensity: number
  moonPhase: { lightDir: [number, number, number]; viewDir: [number, number, number]; darkColor: Color } | null
  glyph: string
  label: string
  latLabel: string
  palette: typeof SCENE_PALETTE.dark
  stemOpacity: number
  cueOpacity: number
  showLatCue: boolean
  latCue: string
  selected: boolean
  onSelect: () => void
}

function PlanetToken({
  hasSelection,
  focusMode,
  position,
  tokenColor,
  accentColor,
  emissiveIntensity,
  moonPhase,
  glyph,
  label,
  latLabel,
  palette,
  stemOpacity,
  cueOpacity,
  showLatCue,
  latCue,
  selected,
  onSelect,
}: PlanetTokenProps) {
  const [hovered, setHovered] = useState(false)
  const showLabel = selected || hovered

  const dimOthers = hasSelection && focusMode === 'fade'
  const isPrimary = selected || hovered
  const focusOpacity = dimOthers ? (isPrimary ? 1 : UNFOCUSED_OPACITY) : 1

  const [x, y, z] = position
  const stemPoints = [
    [x, y, 0],
    [x, y, z],
  ] as [number, number, number][]

  return (
    <group>
      <Line
        points={stemPoints}
        color={palette.stemLine}
        lineWidth={1}
        transparent
        opacity={stemOpacity * STEM_BASE_OPACITY * focusOpacity}
      />
      {selected ? (
        <mesh
          position={position}
          scale={TOKEN_SELECTED_SCALE * TOKEN_SELECTED_HALO_SCALE}
          renderOrder={4.1}
        >
          <sphereGeometry
            args={[
              TOKEN_RADIUS * TOKEN_SELECTED_HALO_SCALE,
              TOKEN_SELECTED_HALO_SEGMENTS,
              TOKEN_SELECTED_HALO_SEGMENTS,
            ]}
          />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={TOKEN_SELECTED_HALO_OPACITY}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      <mesh
        position={position}
        scale={selected ? TOKEN_SELECTED_SCALE : 1}
        renderOrder={4}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <sphereGeometry args={[TOKEN_RADIUS, TOKEN_SEGMENTS, TOKEN_SEGMENTS]} />
        {moonPhase ? (
          <MoonPhaseMaterial
            lightDir={moonPhase.lightDir}
            viewDir={moonPhase.viewDir}
            litColor={accentColor}
            darkColor={moonPhase.darkColor}
            opacity={focusOpacity}
          />
        ) : (
          <meshStandardMaterial
            color={tokenColor}
            emissive={tokenColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.45}
            metalness={0.05}
            transparent={focusOpacity < OPAQUE_THRESHOLD}
            opacity={focusOpacity}
          />
        )}
      </mesh>

      <Billboard position={[x, y, z + BILLBOARD_Z_OFFSET]} follow>
        <group>
          <Text
            fontSize={GLYPH_FONT_SIZE}
            color={palette.labelText}
            fillOpacity={focusOpacity}
            anchorX="center"
            anchorY="middle"
            outlineColor={palette.labelOutlineBg}
            outlineWidth={GLYPH_OUTLINE_WIDTH}
            material-depthTest={false}
          >
            {glyph}
          </Text>
          {showLatCue ? (
            <Text
              position={[LAT_CUE_X, 0, 0]}
              fontSize={LAT_CUE_FONT_SIZE}
              color={palette.stemLine}
              anchorX="left"
              anchorY="middle"
              fillOpacity={cueOpacity * focusOpacity}
              material-depthTest={false}
            >
              {latCue}
            </Text>
          ) : null}
          {showLabel ? (
            <Text
              position={[0, LABEL_Y, 0]}
              fontSize={LABEL_FONT_SIZE}
              color={palette.labelText}
              fillOpacity={focusOpacity}
              anchorX="center"
              anchorY="top"
              outlineColor={palette.labelOutlineBg}
              outlineWidth={LABEL_OUTLINE_WIDTH}
              material-depthTest={false}
            >
              {label}
            </Text>
          ) : null}
          {showLabel ? (
            <Text
              position={[0, LAT_LABEL_Y, 0]}
              fontSize={LAT_LABEL_FONT_SIZE}
              color={palette.subtleText}
              fillOpacity={focusOpacity}
              anchorX="center"
              anchorY="top"
              material-depthTest={false}
            >
              {latLabel}
            </Text>
          ) : null}
        </group>
      </Billboard>
    </group>
  )
}
