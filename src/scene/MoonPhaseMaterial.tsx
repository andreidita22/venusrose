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

  float saturate(float x) { return clamp(x, 0.0, 1.0); }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 l = normalize(uLightDir);
    vec3 v = normalize(uViewDir);

    float sunDot = dot(n, l);
    float viewDot = dot(n, v);

    float lit = smoothstep(-uTerminatorSoftness, uTerminatorSoftness, sunDot);

    // Dim the far hemisphere (away from Earth) so phase remains "geocentric" even if the camera orbits.
    float front = smoothstep(0.0, 0.04, viewDot);

    vec3 baseColor = mix(uDarkColor, uLitColor, lit);
    float brightness = mix(uAmbient, 1.0, lit);
    vec3 color = baseColor * brightness;

    // Slightly darken the far hemisphere, but keep it visible.
    color *= mix(0.5, 1.0, front);

    // Add a subtle camera-space rim so the Moon stays readable even near new moon.
    vec3 toCam = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - saturate(dot(n, toCam)), 2.0);
    color = mix(color, uLitColor, rim * 0.06);

    gl_FragColor = vec4(color, uOpacity);
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
      transparent={opacity < 0.999}
    />
  )
}
