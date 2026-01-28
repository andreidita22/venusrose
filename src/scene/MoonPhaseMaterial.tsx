import { useMemo } from 'react'
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

    // Add a subtle camera-space rim so the Moon stays readable near new moon.
    vec3 toCam = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - clamp(dot(nW, toCam), 0.0, 1.0), 2.0);
    float alpha = uOpacity * max(mask, rim * 0.10);

    gl_FragColor = vec4(color, alpha);
  }
`

export type MoonPhaseMaterialProps = {
  lightDir: [number, number, number]
  viewDir: [number, number, number]
  litColor: Color
  darkColor: Color
  opacity: number
  ambient?: number
  terminatorSoftness?: number
}

export function MoonPhaseMaterial({
  lightDir,
  viewDir,
  litColor,
  darkColor,
  opacity,
  ambient = 0.14,
  terminatorSoftness = 0.035,
}: MoonPhaseMaterialProps) {
  const uniforms = useMemo(() => {
    return {
      uLightDir: { value: new Vector3(lightDir[0], lightDir[1], lightDir[2]).normalize() },
      uViewDir: { value: new Vector3(viewDir[0], viewDir[1], viewDir[2]).normalize() },
      uLitColor: { value: litColor.clone() },
      uDarkColor: { value: darkColor.clone() },
      uAmbient: { value: ambient },
      uOpacity: { value: opacity },
      uTerminatorSoftness: { value: terminatorSoftness },
    }
  }, [ambient, darkColor, lightDir, litColor, opacity, terminatorSoftness, viewDir])

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
