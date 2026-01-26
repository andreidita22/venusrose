import { Billboard, Line, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { CHART_OUTER_RADIUS, Z_SCALE } from '../astro/config'
import { astronomyEngineProvider } from '../astro/ephemeris/providerAstronomyEngine'
import { eclipticToScenePosition } from '../astro/math/ecliptic'
import { scaleRadiusAUToScene } from '../astro/math/scale'
import { MS_PER_HOUR } from '../astro/math/time'
import { meanLunarNodeLongitudeRad } from '../astro/moon/meanNode'
import { makeSampleTimes, sampleBodyStates } from '../astro/trails/sampling'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'

const ORBIT_WINDOW_DAYS = 14
const ORBIT_STEP_HOURS = 6
const Z_OFFSET = 0.004

export function MoonExtras() {
  const t0 = useAppStore((s) => s.t0)
  const selectedBody = useAppStore((s) => s.selectedBody)
  const showMoonExtras = useAppStore((s) => s.showMoonExtras)
  const trailMode = useAppStore((s) => s.trailMode)
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]

  const enabled = showMoonExtras || selectedBody === 'moon'
  const data = useMemo(() => {
    if (!enabled) return null

    const nodeLonRad = meanLunarNodeLongitudeRad(t0)
    const c = Math.cos(nodeLonRad)
    const s = Math.sin(nodeLonRad)

    const r = CHART_OUTER_RADIUS + 0.7
    const nodeLinePoints: [number, number, number][] = [
      [-c * r, -s * r, Z_OFFSET],
      [c * r, s * r, Z_OFFSET],
    ]

    const markerR = CHART_OUTER_RADIUS + 0.5
    const ascPos: [number, number, number] = [c * markerR, s * markerR, Z_OFFSET + 0.02]
    const descPos: [number, number, number] = [-c * markerR, -s * markerR, Z_OFFSET + 0.02]

    const moonNow = astronomyEngineProvider.getBodyState('moon', t0)
    const moonBaseRadius = moonNow ? scaleRadiusAUToScene(moonNow.distAu) : 1.0

    const stepMs = ORBIT_STEP_HOURS * MS_PER_HOUR
    const centerMs = Math.round(t0.getTime() / stepMs) * stepMs
    const center = new Date(centerMs)
    const times = makeSampleTimes(center, ORBIT_WINDOW_DAYS, ORBIT_STEP_HOURS)
    const samples = sampleBodyStates(astronomyEngineProvider, 'moon', times)

    const orbitPoints: [number, number, number][] = samples.map((st) => {
      if (trailMode === 'wheel') {
        return [Math.cos(st.lonRad) * moonBaseRadius, Math.sin(st.lonRad) * moonBaseRadius, Z_OFFSET]
      }
      const [x, y, z] = eclipticToScenePosition(
        st.lonRad,
        st.latRad,
        st.distAu,
        Z_SCALE,
        scaleRadiusAUToScene,
      )
      return [x, y, z]
    })

    return { nodeLinePoints, ascPos, descPos, orbitPoints }
  }, [enabled, t0, trailMode])

  if (!data) return null

  return (
    <group renderOrder={3.3}>
      <Line
        points={data.nodeLinePoints}
        color={palette.stemLine}
        transparent
        opacity={0.55}
        dashed
        dashScale={1}
        dashSize={0.35}
        gapSize={0.25}
        lineWidth={1.6}
        depthWrite={false}
      />

      <Billboard position={data.ascPos} follow>
        <Text
          fontSize={0.34}
          color={palette.labelText}
          anchorX="center"
          anchorY="middle"
          outlineColor={theme === 'dark' ? '#050812' : '#ffffff'}
          outlineWidth={0.02}
        >
          ☊
        </Text>
      </Billboard>
      <Billboard position={data.descPos} follow>
        <Text
          fontSize={0.34}
          color={palette.labelText}
          anchorX="center"
          anchorY="middle"
          outlineColor={theme === 'dark' ? '#050812' : '#ffffff'}
          outlineWidth={0.02}
        >
          ☋
        </Text>
      </Billboard>

      <Line
        points={data.orbitPoints}
        color={theme === 'dark' ? '#d7e1ff' : '#475569'}
        transparent
        opacity={0.55}
        lineWidth={2.4}
        depthWrite={false}
      />
    </group>
  )
}
