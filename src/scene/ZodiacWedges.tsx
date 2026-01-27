import { Line, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { BODY_META } from '../astro/bodies'
import { CHART_OUTER_RADIUS, ZODIAC } from '../astro/config'
import { zodiacIndexFromLonRad } from '../astro/format'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

const SIGNS = 12
const THETA_LEN = Math.PI / 6 // 2π / 12
const INNER_RADIUS = 0.22
const WEDGE_Z = 0.001
const BOUNDARY_Z = 0.002
const LABEL_Z = 0.02
const LABEL_RADIUS_OFFSET = 0.55

const THETA_SEGMENTS = 16
const RING_SEGMENTS = 1

const WEDGE_OPACITY = 0.22
const WEDGE_HIGHLIGHT_BONUS = 0.18
const WEDGE_OPACITY_MAX = 0.55

const BOUNDARY_WIDTH = 1.25
const BOUNDARY_WIDTH_HIGHLIGHT = 2.2
const BOUNDARY_OPACITY_DARK = 0.35
const BOUNDARY_OPACITY_LIGHT = 0.55
const BOUNDARY_OPACITY_HIGHLIGHT = 0.85

const GLYPH_FONT_SIZE = 0.33
const GLYPH_FONT_SIZE_HIGHLIGHT = 0.38

export function ZodiacWedges() {
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]
  const selectedBody = useAppStore((s) => s.selectedBody)
  const bodyStates = useAppStore((s) => s.bodyStates)
  const boundaryOpacity = theme === 'dark' ? BOUNDARY_OPACITY_DARK : BOUNDARY_OPACITY_LIGHT

  const selectedLonRad = selectedBody ? bodyStates[selectedBody]?.lonRad : null
  const selectedSignIndex = selectedLonRad != null ? zodiacIndexFromLonRad(selectedLonRad) : null
  const focusColor = selectedBody ? BODY_META[selectedBody].color : palette.zoneRing
  const hasSelection = selectedSignIndex !== null

  const isSignHighlighted = (idx: number) => hasSelection && idx === selectedSignIndex
  const isBoundaryHighlighted = (idx: number) =>
    hasSelection && (idx === selectedSignIndex || idx === (selectedSignIndex + 1) % SIGNS)

  const wedges = useMemo(() => {
    const outerRadius = CHART_OUTER_RADIUS
    const labelRadius = outerRadius + LABEL_RADIUS_OFFSET

    return ZODIAC.map((sign, idx) => {
      const start = idx * THETA_LEN
      const mid = start + THETA_LEN / 2
      const labelPos: [number, number, number] = [
        labelRadius * Math.cos(mid),
        labelRadius * Math.sin(mid),
        LABEL_Z,
      ]
      return { sign, start, outerRadius, labelPos, idx }
    })
  }, [])

  const boundaries = useMemo(() => {
    const outerRadius = CHART_OUTER_RADIUS
    return Array.from({ length: SIGNS }, (_, i) => {
      const angle = i * THETA_LEN
      const c = Math.cos(angle)
      const s = Math.sin(angle)
      return [
        [c * INNER_RADIUS, s * INNER_RADIUS, BOUNDARY_Z],
        [c * outerRadius, s * outerRadius, BOUNDARY_Z],
      ] as [number, number, number][]
    })
  }, [])

  return (
    <group renderOrder={2}>
      {boundaries.map((points, idx) => {
        const highlighted = isBoundaryHighlighted(idx)
        return (
          <Line
            key={`b-${idx}`}
            points={points}
            color={highlighted ? focusColor : palette.zoneRing}
            lineWidth={highlighted ? BOUNDARY_WIDTH_HIGHLIGHT : BOUNDARY_WIDTH}
            transparent
            opacity={highlighted ? BOUNDARY_OPACITY_HIGHLIGHT : boundaryOpacity}
            depthWrite={false}
          />
        )
      })}
      {wedges.map(({ sign, start, outerRadius, labelPos, idx }) => {
        const highlighted = isSignHighlighted(idx)
        return (
        <group key={sign.key}>
          <mesh position={[0, 0, WEDGE_Z]} renderOrder={2}>
            <ringGeometry args={[INNER_RADIUS, outerRadius, THETA_SEGMENTS, RING_SEGMENTS, start, THETA_LEN]} />
            <meshBasicMaterial
              color={idx % 2 === 0 ? palette.zodiacWedgeA : palette.zodiacWedgeB}
              transparent
              opacity={highlighted ? Math.min(WEDGE_OPACITY_MAX, WEDGE_OPACITY + WEDGE_HIGHLIGHT_BONUS) : WEDGE_OPACITY}
              side={DoubleSide}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
          <Text
            position={labelPos}
            fontSize={highlighted ? GLYPH_FONT_SIZE_HIGHLIGHT : GLYPH_FONT_SIZE}
            color={highlighted ? palette.labelText : palette.zodiacGlyph}
            anchorX="center"
            anchorY="middle"
            material-depthTest={false}
          >
            {sign.glyph}
          </Text>
        </group>
        )
      })}
    </group>
  )
}
