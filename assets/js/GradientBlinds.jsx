/* eslint-disable react/no-unknown-property */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  uniform float uAngle;
  uniform float uBlindCount;
  uniform float uBlindMinWidth;
  uniform float uNoise;
  uniform float uSpotlight;
  uniform vec2  uMouse;
  uniform float uAspect;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    vec2 c = uv - 0.5;
    c.x *= uAspect;

    float s = sin(uAngle);
    float co = cos(uAngle);
    vec2 rot = vec2(co * c.x - s * c.y, s * c.x + co * c.y);

    float band = rot.x * uBlindCount + uTime * 0.08;
    float idx  = floor(band);
    float f    = fract(band);
    float edge = abs(f - 0.5) * 2.0;

    float phase = hash(vec2(idx, 17.3)) * 6.2831;
    float breath = sin(uTime * 0.55 + phase) * 0.25 + 0.55;

    float stripe = smoothstep(1.0, uBlindMinWidth, edge);
    stripe *= breath;

    float bigNoise = noise(uv * 2.6 + uTime * 0.07);
    float fineNoise = noise(uv * 8.0 - uTime * 0.12);
    float n = mix(bigNoise, fineNoise, 0.35);
    stripe -= (1.0 - n) * uNoise * 0.55;

    float vgrad = smoothstep(1.05, -0.1, uv.y);
    stripe *= mix(0.55, 1.0, vgrad);

    vec2 mouseC = uMouse - 0.5;
    mouseC.x *= uAspect;
    float spot = 1.0 - smoothstep(0.0, 0.6, length(c - mouseC));
    stripe += spot * uSpotlight * 0.45;

    stripe = clamp(stripe, 0.0, 1.0);

    vec3 col = mix(uColor2, uColor1, stripe);

    float vig = smoothstep(1.15, 0.2, length(c));
    col *= mix(0.55, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function BlindsPlane({
  color1,
  color2,
  angle,
  blindCount,
  blindMinWidth,
  noiseIntensity,
  spotlight,
  mouseDampening,
}) {
  const matRef = useRef(null);
  const mouseTarget = useRef(new THREE.Vector2(0.5, 0.5));
  const mouseSmooth = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uAngle: { value: (angle * Math.PI) / 180 },
      uBlindCount: { value: blindCount },
      uBlindMinWidth: { value: blindMinWidth },
      uNoise: { value: noiseIntensity },
      uSpotlight: { value: spotlight },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: 1 },
    }),
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uColor1.value.set(color1);
    uniforms.uColor2.value.set(color2);
    uniforms.uAngle.value = (angle * Math.PI) / 180;
    uniforms.uBlindCount.value = blindCount;
    uniforms.uBlindMinWidth.value = blindMinWidth;
    uniforms.uNoise.value = noiseIntensity;
    uniforms.uSpotlight.value = spotlight;

    const { size, pointer } = state;
    uniforms.uAspect.value = size.width / size.height;
    mouseTarget.current.set(pointer.x * 0.5 + 0.5, pointer.y * 0.5 + 0.5);
    mouseSmooth.current.lerp(mouseTarget.current, 1 - mouseDampening);
    uniforms.uMouse.value.copy(mouseSmooth.current);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function GradientBlinds({
  color1 = '#EAB308',
  color2 = '#0B0909',
  angle = 0,
  blindCount = 14,
  blindMinWidth = 0.35,
  noiseIntensity = 0.3,
  spotlight = 0.5,
  mouseDampening = 0.9,
}) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <BlindsPlane
        color1={color1}
        color2={color2}
        angle={angle}
        blindCount={blindCount}
        blindMinWidth={blindMinWidth}
        noiseIntensity={noiseIntensity}
        spotlight={spotlight}
        mouseDampening={mouseDampening}
      />
    </Canvas>
  );
}
