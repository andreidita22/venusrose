import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { MathUtils, Spherical, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { MAX_TILT_DEG } from '../astro/config'
import { useAppStore } from '../state/store'
import { SCENE_PALETTE } from '../theme/palette'
import { EclipticPlane } from './EclipticPlane'
import { DistanceBands } from './DistanceBands'
import { MoonExtras } from './MoonExtras'
import { PlanetTokens } from './PlanetTokens'
import { SynodicArc } from './SynodicArc'
import { Trails } from './Trails'
import { ZodiacWedges } from './ZodiacWedges'
import { ZoneRings } from './ZoneRings'

function CameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const tiltDeg = useAppStore((s) => s.tiltDeg)
  const { camera, invalidate } = useThree()

  useEffect(() => {
    const controls = controlsRef.current
    const target = controls?.target ?? new Vector3(0, 0, 0)

    const offset = camera.position.clone().sub(target)
    const spherical = new Spherical().setFromVector3(offset)

    spherical.phi = MathUtils.clamp(
      MathUtils.degToRad(tiltDeg),
      0.0001,
      MathUtils.degToRad(MAX_TILT_DEG),
    )

    offset.setFromSpherical(spherical)
    camera.position.copy(target.clone().add(offset))
    camera.lookAt(target)
    camera.updateProjectionMatrix()

    controls?.update()
    invalidate()
  }, [camera, controlsRef, invalidate, tiltDeg])

  return null
}

function SceneControls({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const invalidate = useThree((s) => s.invalidate)
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      maxPolarAngle={MathUtils.degToRad(MAX_TILT_DEG)}
      minPolarAngle={0}
      onChange={() => invalidate()}
    />
  )
}

export function SceneRoot() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const toggles = useAppStore((s) => s.toggles)
  const setSelectedBody = useAppStore((s) => s.setSelectedBody)
  const theme = useAppStore((s) => s.theme)
  const palette = SCENE_PALETTE[theme]

  return (
    <Canvas
      className="canvas"
      frameloop="demand"
      orthographic
      camera={{ position: [0, 18, 18], zoom: 60, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => setSelectedBody(null)}
    >
      <color attach="background" args={[palette.canvasBg]} />
      <ambientLight intensity={theme === 'dark' ? 0.9 : 0.75} />
      <directionalLight position={[4, 8, 10]} intensity={theme === 'dark' ? 0.65 : 0.55} />

      <group rotation={[-Math.PI / 2, 0, 0]}>
        <EclipticPlane />
        {toggles.showZodiac ? <ZodiacWedges /> : null}
        {toggles.showZoneRings ? <ZoneRings /> : null}
        <DistanceBands />
        <SynodicArc />
        <MoonExtras />
        <Trails />
        <PlanetTokens />
      </group>

      <SceneControls controlsRef={controlsRef} />
      <CameraRig controlsRef={controlsRef} />
    </Canvas>
  )
}
