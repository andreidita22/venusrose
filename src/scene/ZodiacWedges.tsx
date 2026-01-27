import { Line, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { BODY_META } from '../astro/bodies'
import { CHART_OUTER_RADIUS, ZODIAC } from '../astro/config'
import { zodiacIndexFromLonRad } from '../astro/format'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

export function ZodiacWedges() {
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]
  const selectedBody = useAppStore((s) => s.selectedBody)
  const bodyStates = useAppStore((s) => s.bodyStates)
  const wedgeOpacity = theme === 'dark' ? 0.22 : 0.22
  const boundaryOpacity = theme === 'dark' ? 0.35 : 0.55

  const selectedLonRad = selectedBody ? bodyStates[selectedBody]?.lonRad : null
  const selectedSignIndex = selectedLonRad != null ? zodiacIndexFromLonRad(selectedLonRad) : null
  const focusColor = selectedBody ? BODY_META[selectedBody].color : palette.zoneRing

  const wedges = useMemo(() => {
    const thetaLen = Math.PI / 6
    const innerRadius = 0.22
    const outerRadius = CHART_OUTER_RADIUS
    const labelRadius = outerRadius + 0.55

    return ZODIAC.map((sign, idx) => {
      const start = idx * thetaLen
      const mid = start + thetaLen / 2
      const labelPos: [number, number, number] = [
        labelRadius * Math.cos(mid),
        labelRadius * Math.sin(mid),
        0.02,
      ]
      return { sign, start, thetaLen, innerRadius, outerRadius, labelPos, idx }
    })
  }, [])

  const boundaries = useMemo(() => {
    const thetaLen = Math.PI / 6
    const innerRadius = 0.22
    const outerRadius = CHART_OUTER_RADIUS
    const z = 0.002
    return Array.from({ length: 12 }, (_, i) => {
      const angle = i * thetaLen
      const c = Math.cos(angle)
      const s = Math.sin(angle)
      return [
        [c * innerRadius, s * innerRadius, z],
        [c * outerRadius, s * outerRadius, z],
      ] as [number, number, number][]
    })
  }, [])

  return (
    <group renderOrder={2}>
      {boundaries.map((points, idx) => (
        <Line
          key={`b-${idx}`}
          points={points}
          color={
            selectedSignIndex !== null &&
            (idx === selectedSignIndex || idx === (selectedSignIndex + 1) % 12)
              ? focusColor
              : palette.zoneRing
          }
          lineWidth={
            selectedSignIndex !== null &&
            (idx === selectedSignIndex || idx === (selectedSignIndex + 1) % 12)
              ? 2.2
              : 1.25
          }
          transparent
          opacity={
            selectedSignIndex !== null &&
            (idx === selectedSignIndex || idx === (selectedSignIndex + 1) % 12)
              ? 0.85
              : boundaryOpacity
          }
          depthWrite={false}
        />
      ))}
      {wedges.map(({ sign, start, thetaLen, innerRadius, outerRadius, labelPos, idx }) => (
        <group key={sign.key}>
          <mesh position={[0, 0, 0.001]} renderOrder={2}>
            <ringGeometry args={[innerRadius, outerRadius, 16, 1, start, thetaLen]} />
            <meshBasicMaterial
              color={idx % 2 === 0 ? palette.zodiacWedgeA : palette.zodiacWedgeB}
              transparent
              opacity={
                selectedSignIndex !== null && idx === selectedSignIndex
                  ? Math.min(0.55, wedgeOpacity + 0.18)
                  : wedgeOpacity
              }
              side={DoubleSide}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
          <Text
            position={labelPos}
            fontSize={selectedSignIndex !== null && idx === selectedSignIndex ? 0.38 : 0.33}
            color={selectedSignIndex !== null && idx === selectedSignIndex ? palette.labelText : palette.zodiacGlyph}
            anchorX="center"
            anchorY="middle"
            depthTest={false}
          >
            {sign.glyph}
          </Text>
        </group>
      ))}
    </group>
  )
}
