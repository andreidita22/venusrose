import { useEffect, useMemo, useRef } from 'react'
import { Color, Vector3 } from 'three'

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  uniform vec3 uLightDir;
  uniform vec3 uViewDir;
  uniform vec3 uLitColor;
  uniform vec3 uDarkColor;
  uniform vec3 uRimColor;
  uniform float uAmbient;
  uniform float uOpacity;
  uniform float uTerminatorSoftness;

  void main() {
    vec3 nW = normalize(vNormalW);
    vec3 l = normalize(uLightDir);
    vec3 v = normalize(uViewDir);

    float sunDot = dot(nW, l);
    float viewDot = dot(nW, v);

    float sunLit = smoothstep(0.0, uTerminatorSoftness, sunDot);
    float front = smoothstep(0.0, 0.04, viewDot);
    float mask = sunLit * front;

    vec3 dark = uDarkColor * uAmbient;
    vec3 litC = uLitColor;
    vec3 color = mix(dark, litC, mask);

    // Add a subtle camera-space rim so the dark side still reads as a globe.
    vec3 toCam = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - clamp(dot(nW, toCam), 0.0, 1.0), 2.0);
    color = mix(color, uRimColor, rim * 0.12);
    float alpha = uOpacity * max(mask, rim * 0.18);

    gl_FragColor = vec4(color, alpha);
  }
`

export type MoonPhaseMaterialProps = {
  lightDir: [number, number, number]
  viewDir: [number, number, number]
  litColor: Color
  darkColor: Color
  rimColor: Color
  opacity: number
  ambient?: number
  terminatorSoftness?: number
}

export function MoonPhaseMaterial({
  lightDir,
  viewDir,
  litColor,
  darkColor,
  rimColor,
  opacity,
  ambient = 0.14,
  terminatorSoftness = 0.035,
}: MoonPhaseMaterialProps) {
  const uniforms = useMemo(() => {
    return {
      uLightDir: { value: new Vector3(1, 0, 0) },
      uViewDir: { value: new Vector3(0, 1, 0) },
      uLitColor: { value: new Color('#ffffff') },
      uDarkColor: { value: new Color('#000000') },
      uRimColor: { value: new Color('#ffffff') },
      uAmbient: { value: 0.14 },
      uOpacity: { value: 1 },
      uTerminatorSoftness: { value: 0.035 },
    }
  }, [])
  const uniformsRef = useRef(uniforms)

  useEffect(() => {
    uniformsRef.current.uLightDir.value
      .set(lightDir[0], lightDir[1], lightDir[2])
      .normalize()
  }, [lightDir])

  useEffect(() => {
    uniformsRef.current.uViewDir.value
      .set(viewDir[0], viewDir[1], viewDir[2])
      .normalize()
  }, [viewDir])

  useEffect(() => {
    uniformsRef.current.uLitColor.value.copy(litColor)
  }, [litColor])

  useEffect(() => {
    uniformsRef.current.uDarkColor.value.copy(darkColor)
  }, [darkColor])

  useEffect(() => {
    uniformsRef.current.uRimColor.value.copy(rimColor)
  }, [rimColor])

  useEffect(() => {
    uniformsRef.current.uOpacity.value = opacity
  }, [opacity])

  useEffect(() => {
    uniformsRef.current.uAmbient.value = ambient
  }, [ambient])

  useEffect(() => {
    uniformsRef.current.uTerminatorSoftness.value = terminatorSoftness
  }, [terminatorSoftness])

  return (
    <shaderMaterial
      vertexShader={VERTEX_SHADER}
      fragmentShader={FRAGMENT_SHADER}
      uniforms={uniforms}
      transparent
      depthWrite={false}
    />
  )
}
