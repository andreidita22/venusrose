import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { CHART_OUTER_RADIUS, ZODIAC } from '../astro/config'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

export function ZodiacWedges() {
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]
  const wedgeOpacity = theme === 'dark' ? 0.1 : 0.16

  const wedges = useMemo(() => {
    const thetaLen = Math.PI / 6
    const innerRadius = 0.01
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

  return (
    <group renderOrder={2}>
      {wedges.map(({ sign, start, thetaLen, innerRadius, outerRadius, labelPos, idx }) => (
        <group key={sign.key}>
          <mesh>
            <ringGeometry args={[innerRadius, outerRadius, 64, 1, start, thetaLen]} />
            <meshBasicMaterial
              color={idx % 2 === 0 ? palette.zodiacWedgeA : palette.zodiacWedgeB}
              transparent
              opacity={wedgeOpacity}
              side={DoubleSide}
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
