import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { BODY_META } from '../astro/bodies'
import { DISTANCE_RANGE_AU } from '../astro/distanceRanges'
import { scaleRadiusAUToScene } from '../astro/math/scale'
import { useAppStore } from '../state/store'

const SEGMENTS = 256
const Z_OFFSET = 0.0018

function circlePoints(radius: number, z: number): [number, number, number][] {
  return Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    const a = (i / SEGMENTS) * Math.PI * 2
    return [Math.cos(a) * radius, Math.sin(a) * radius, z]
  })
}

export function DistanceBands() {
  const selectedBody = useAppStore((s) => s.selectedBody)
  const bodyStates = useAppStore((s) => s.bodyStates)
  const showDistanceBands = useAppStore((s) => s.showDistanceBands)

  const selectedState = selectedBody ? bodyStates[selectedBody] : null
  const range = selectedBody ? DISTANCE_RANGE_AU[selectedBody] : undefined

  const geometry = useMemo(() => {
    if (!showDistanceBands || !selectedBody || !selectedState || !range) return null

    const rMin = scaleRadiusAUToScene(range.minAu)
    const rMax = scaleRadiusAUToScene(range.maxAu)
    const rNow = scaleRadiusAUToScene(selectedState.distAu)
    const lon = selectedState.lonRad

    const c = Math.cos(lon)
    const s = Math.sin(lon)

    const minRing = circlePoints(rMin, Z_OFFSET)
    const maxRing = circlePoints(rMax, Z_OFFSET)
    const nowPoint: [number, number, number] = [c * rNow, s * rNow, Z_OFFSET + 0.0006]
    const spanLine: [number, number, number][] = [
      [c * rMin, s * rMin, Z_OFFSET],
      [c * rMax, s * rMax, Z_OFFSET],
    ]

    return { minRing, maxRing, nowPoint, spanLine }
  }, [range, selectedBody, selectedState, showDistanceBands])

  if (!geometry || !selectedBody) return null

  const color = BODY_META[selectedBody].color

  return (
    <group renderOrder={3.12}>
      <Line
        points={geometry.minRing}
        color={color}
        transparent
        opacity={0.38}
        lineWidth={1.3}
        depthWrite={false}
      />
      <Line
        points={geometry.maxRing}
        color={color}
        transparent
        opacity={0.38}
        lineWidth={1.3}
        depthWrite={false}
      />
      <Line
        points={geometry.spanLine}
        color={color}
        transparent
        opacity={0.28}
        lineWidth={1.1}
        depthWrite={false}
      />
      <mesh position={geometry.nowPoint} renderOrder={3.13}>
        <sphereGeometry args={[0.095, 18, 18]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  )
}

