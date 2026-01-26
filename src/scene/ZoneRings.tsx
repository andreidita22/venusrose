import { Line, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { R_BREAKS, ZONE_RING_LABELS } from '../astro/config'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

const SEGMENTS = 256

const circlePoints = (radius: number) =>
  Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    const a = (i / SEGMENTS) * Math.PI * 2
    return [Math.cos(a) * radius, Math.sin(a) * radius, 0] as [number, number, number]
  })

export function ZoneRings() {
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]
  const ringOpacity = theme === 'dark' ? 0.9 : 0.7

  const rings = useMemo(
    () =>
      R_BREAKS.slice(1).map((radius, i) => ({
        radius,
        label: ZONE_RING_LABELS[i] ?? '',
        points: circlePoints(radius),
      })),
    [],
  )

  return (
    <group renderOrder={3}>
      {rings.map(({ radius, label, points }) => (
        <group key={`${radius}`}>
          <Line
            points={points}
            color={palette.zoneRing}
            lineWidth={1.1}
            opacity={ringOpacity}
            transparent
          />
          {label ? (
            <Text
              position={[radius + 0.35, 0, 0.02]}
              fontSize={0.26}
              color={palette.zoneLabel}
              anchorX="left"
              anchorY="middle"
            >
              {label}
            </Text>
          ) : null}
        </group>
      ))}
    </group>
  )
}
