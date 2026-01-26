import { Line, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { CHART_OUTER_RADIUS, ZODIAC } from '../astro/config'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

export function ZodiacWedges() {
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]
  const wedgeOpacity = theme === 'dark' ? 0.22 : 0.22
  const boundaryOpacity = theme === 'dark' ? 0.35 : 0.55

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
          color={palette.zoneRing}
          lineWidth={1.25}
          transparent
          opacity={boundaryOpacity}
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
              opacity={wedgeOpacity}
              side={DoubleSide}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
          <Text
            position={labelPos}
            fontSize={0.33}
            color={palette.zodiacGlyph}
            anchorX="center"
            anchorY="middle"
          >
            {sign.glyph}
          </Text>
        </group>
      ))}
    </group>
  )
}
