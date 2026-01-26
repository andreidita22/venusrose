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
import { eclipticToScenePosition } from '../astro/math/ecliptic'
import { radToDeg } from '../astro/math/angles'
import { scaleRadiusAUToScene } from '../astro/math/scale'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

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

  const stemOpacity = stemOpacityForTilt(tiltDeg)
  const cueOpacity = 1 - stemOpacity

  return (
    <group renderOrder={4}>
      {DEFAULT_BODY_ORDER.map((body) => {
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
        const tokenColor = new Color(meta.color)

        const latDeg = radToDeg(state.latRad)
        const showLatCue = Math.abs(latDeg) >= LAT_CUE_MIN_ABS_DEG && cueOpacity > 0.001
        const latCue = latDeg >= 0 ? '↑' : '↓'

        return (
          <PlanetToken
            key={body}
            position={pos}
            tokenColor={tokenColor}
            glyph={meta.glyph}
            label={meta.label}
            latLabel={`β ${formatSignedDegrees(latDeg, 1)}`}
            theme={theme}
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
  position: [number, number, number]
  tokenColor: Color
  glyph: string
  label: string
  latLabel: string
  theme: 'dark' | 'light'
  palette: typeof SCENE_PALETTE.dark
  stemOpacity: number
  cueOpacity: number
  showLatCue: boolean
  latCue: string
  selected: boolean
  onSelect: () => void
}

function PlanetToken({
  position,
  tokenColor,
  glyph,
  label,
  latLabel,
  theme,
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
        opacity={stemOpacity * 0.85}
      />
      <mesh
        position={position}
        scale={selected ? TOKEN_SELECTED_SCALE : 1}
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
        <sphereGeometry args={[TOKEN_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color={tokenColor}
          emissive={tokenColor}
          emissiveIntensity={selected ? 0.65 : 0.35}
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>

      <Billboard position={[x, y, z + 0.35]} follow>
        <group>
          <Text
            fontSize={0.28}
            color={palette.labelText}
            anchorX="center"
            anchorY="middle"
            outlineColor={theme === 'dark' ? '#050812' : '#ffffff'}
            outlineWidth={0.015}
          >
            {glyph}
          </Text>
          {showLatCue ? (
            <Text
              position={[0.34, 0, 0]}
              fontSize={0.2}
              color={palette.stemLine}
              anchorX="left"
              anchorY="middle"
              fillOpacity={cueOpacity}
            >
              {latCue}
            </Text>
          ) : null}
          {showLabel ? (
            <Text
              position={[0, -0.36, 0]}
              fontSize={0.22}
              color={palette.labelText}
              anchorX="center"
              anchorY="top"
              outlineColor={theme === 'dark' ? '#050812' : '#ffffff'}
              outlineWidth={0.02}
            >
              {label}
            </Text>
          ) : null}
          {showLabel ? (
            <Text
              position={[0, -0.62, 0]}
              fontSize={0.18}
              color={palette.subtleText}
              anchorX="center"
              anchorY="top"
            >
              {latLabel}
            </Text>
          ) : null}
        </group>
      </Billboard>
    </group>
  )
}
