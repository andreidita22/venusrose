import { DoubleSide } from 'three'
import { CHART_OUTER_RADIUS } from '../astro/config'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

export function EclipticPlane() {
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]

  return (
    <group>
      <mesh renderOrder={0}>
        <circleGeometry args={[CHART_OUTER_RADIUS, 128]} />
        <meshBasicMaterial
          color={palette.planeFill}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.002]} renderOrder={1}>
        <ringGeometry args={[CHART_OUTER_RADIUS - 0.03, CHART_OUTER_RADIUS, 256]} />
        <meshBasicMaterial
          color={palette.planeRim}
          transparent
          opacity={theme === 'dark' ? 0.9 : 0.8}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
