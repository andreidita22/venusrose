import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { BODY_META } from '../astro/bodies'
import { CHART_OUTER_RADIUS } from '../astro/config'
import { elongationRad } from '../astro/synodic'
import { useAppStore } from '../state/store'

const ARC_RADIUS = CHART_OUTER_RADIUS - 0.8
const Z_OFFSET = 0.0032

export function SynodicArc() {
  const selectedBody = useAppStore((s) => s.selectedBody)
  const bodyStates = useAppStore((s) => s.bodyStates)
  const showSynodic = useAppStore((s) => s.showSynodic)

  const data = useMemo(() => {
    if (!showSynodic || !selectedBody || selectedBody === 'sun') return null
    const sun = bodyStates.sun
    const body = bodyStates[selectedBody]
    if (!sun || !body) return null

    const delta = elongationRad(body.lonRad, sun.lonRad)
    const steps = 96

    const points: [number, number, number][] = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps
      const a = sun.lonRad + delta * t
      return [Math.cos(a) * ARC_RADIUS, Math.sin(a) * ARC_RADIUS, Z_OFFSET]
    })

    const sunRayPoints: [number, number, number][] = [
      [0, 0, Z_OFFSET],
      [Math.cos(sun.lonRad) * ARC_RADIUS, Math.sin(sun.lonRad) * ARC_RADIUS, Z_OFFSET],
    ]

    return { points, sunRayPoints, bodyColor: BODY_META[selectedBody].color, sunColor: BODY_META.sun.color }
  }, [bodyStates, selectedBody, showSynodic])

  if (!data) return null

  return (
    <group renderOrder={3.18}>
      <Line
        points={data.sunRayPoints}
        color={data.sunColor}
        transparent
        opacity={0.55}
        lineWidth={1.8}
        depthWrite={false}
      />
      <Line
        points={data.points}
        color={data.bodyColor}
        transparent
        opacity={0.6}
        lineWidth={2.4}
        dashed
        dashScale={1}
        dashSize={0.35}
        gapSize={0.25}
        depthWrite={false}
      />
    </group>
  )
}

