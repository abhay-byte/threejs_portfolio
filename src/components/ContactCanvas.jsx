import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { Stars, useGLTF, shaderMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

/* ============ NEBULA BACKDROP ============ */
const NebulaMaterial = shaderMaterial(
    { uTime: 0, uScroll: 0, uColor1: new THREE.Color('#1a0a2e'), uColor2: new THREE.Color('#16213e'), uAccent1: new THREE.Color('#fabd2f'), uAccent2: new THREE.Color('#ff6b6b') },
    `varying vec2 vUv; varying vec3 vPos;
   void main() {
     vUv = uv; vPos = position;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
    `uniform float uTime; uniform float uScroll;
   uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uAccent1; uniform vec3 uAccent2;
   varying vec2 vUv; varying vec3 vPos;
   
   float noise(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
   
   float smoothNoise(vec2 p) {
     vec2 i = floor(p); vec2 f = fract(p);
     float a = noise(i); float b = noise(i + vec2(1.0, 0.0));
     float c = noise(i + vec2(0.0, 1.0)); float d = noise(i + vec2(1.0, 1.0));
     vec2 u = f * f * (3.0 - 2.0 * f);
     return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
   }
   
   float fbm(vec2 p) {
     float val = 0.0; float amp = 0.5; float freq = 1.0;
     for(int i = 0; i < 5; i++) { val += amp * smoothNoise(p * freq); freq *= 2.0; amp *= 0.5; }
     return val;
   }
   
   void main() {
     vec2 p = vUv * 3.0 + uTime * 0.02;
     float n1 = fbm(p + vec2(uTime * 0.03, 0.0));
     float n2 = fbm(p * 1.5 + vec2(0.0, uTime * 0.04));
     float n3 = fbm(p * 0.8 + n1 * 0.5);
     vec3 base = mix(uColor1, uColor2, n1);
     vec3 accent = mix(uAccent1, uAccent2, sin(uTime * 0.5 + n2 * 3.14) * 0.5 + 0.5);
     float accentMask = smoothstep(0.4, 0.7, n3) * 0.3;
     vec3 color = mix(base, accent, accentMask);
     float alpha = smoothstep(0.1, 0.5, n1) * 0.25 + n3 * 0.1;
     alpha *= 0.6;
     gl_FragColor = vec4(color, alpha);
   }`
)

/* ============ SUN SHADER ============ */
const SunMaterial = shaderMaterial(
    { uTime: 0 },
    `varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir;
   void main() {
     vNormal = normalize(normalMatrix * normal);
     vPosition = position;
     vec4 wp = modelMatrix * vec4(position, 1.0);
     vViewDir = normalize(cameraPosition - wp.xyz);
     gl_Position = projectionMatrix * viewMatrix * wp;
   }`,
    `uniform float uTime;
   varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir;
   float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
   float noise2d(vec2 p) {
     vec2 i = floor(p); vec2 f = fract(p);
     f = f*f*(3.0-2.0*f);
     return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
   }
   float fbm(vec2 p) {
     float v = 0.0; float a = 0.5;
     for(int i = 0; i < 5; i++) { v += a * noise2d(p); p *= 2.0; a *= 0.5; }
     return v;
   }
   void main() {
     vec3 n = normalize(vNormal);
     vec3 v = normalize(vViewDir);
     float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.0);
     vec2 uv = vPosition.xy * 2.0;
     float turbulence = fbm(uv + uTime * 0.15);
     float turbulence2 = fbm(uv * 1.5 - uTime * 0.2 + 3.0);
     float spots = smoothstep(0.55, 0.6, turbulence * turbulence2);
     vec3 sunCore = vec3(1.0, 0.95, 0.7);
     vec3 sunMid = vec3(1.0, 0.6, 0.1);
     vec3 sunEdge = vec3(0.9, 0.2, 0.05);
     vec3 color = mix(sunCore, sunMid, turbulence);
     color = mix(color, sunEdge, fresnel * 0.7);
     color -= spots * vec3(0.3, 0.2, 0.1);
     float pulse = sin(uTime * 1.5) * 0.1 + 1.0;
     color *= pulse;
     color += vec3(1.0, 0.8, 0.3) * fresnel * 0.8;
     gl_FragColor = vec4(color, 1.0);
   }`
)

const SunCoronaMaterial = shaderMaterial(
    { uTime: 0 },
    `varying vec2 vUv;
   void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    `uniform float uTime; varying vec2 vUv;
   float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
   float noise2d(vec2 p) {
     vec2 i = floor(p); vec2 f = fract(p);
     f = f*f*(3.0-2.0*f);
     return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
   }
   void main() {
     vec2 center = vUv - 0.5;
     float dist = length(center);
     float angle = atan(center.y, center.x);
     float flare = noise2d(vec2(angle * 3.0, uTime * 0.5)) * 0.15;
     float corona = smoothstep(0.5, 0.2, dist + flare);
     float outerGlow = smoothstep(0.5, 0.0, dist) * 0.3;
     float rays = pow(abs(sin(angle * 8.0 + uTime * 0.8)), 8.0) * smoothstep(0.25, 0.45, dist) * 0.4;
     vec3 coreColor = vec3(1.0, 0.9, 0.6);
     vec3 edgeColor = vec3(1.0, 0.4, 0.05);
     vec3 color = mix(edgeColor, coreColor, corona);
     float alpha = (corona * 0.6 + outerGlow + rays) * smoothstep(0.52, 0.48, dist);
     gl_FragColor = vec4(color, alpha);
   }`
)

/* ============ PLANET SHADERS ============ */
const AuroraPlanetMaterial = shaderMaterial(
    { uTime: 0 },
    `varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir;
   void main() {
     vNormal = normalize(normalMatrix * normal);
     vPosition = position;
     vec4 wp = modelMatrix * vec4(position, 1.0);
     vViewDir = normalize(cameraPosition - wp.xyz);
     gl_Position = projectionMatrix * viewMatrix * wp;
   }`,
    `uniform float uTime;
   varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir;
   void main() {
     vec3 n = normalize(vNormal);
     vec3 v = normalize(vViewDir);
     float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
     float angle = atan(vPosition.z, vPosition.x);
     float wave = sin(angle * 3.0 + vPosition.y * 4.0 + uTime * 0.8) * 0.5 + 0.5;
     float wave2 = sin(angle * 5.0 - vPosition.y * 2.0 + uTime * 1.2) * 0.5 + 0.5;
     vec3 c1 = vec3(0.4, 0.1, 0.8);
     vec3 c2 = vec3(0.1, 0.8, 0.6);
     vec3 c3 = vec3(0.9, 0.3, 0.5);
     vec3 color = mix(c1, c2, wave);
     color = mix(color, c3, wave2 * fresnel);
     color += vec3(1.0, 0.9, 0.7) * fresnel * 0.5;
     gl_FragColor = vec4(color, 0.85);
   }`
)

const LavaPlanetMaterial = shaderMaterial(
    { uTime: 0 },
    `varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir;
   void main() { vNormal = normalize(normalMatrix * normal); vPosition = position; vec4 wp = modelMatrix * vec4(position, 1.0); vViewDir = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    `uniform float uTime; varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir;
   float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
   float noise2d(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
   void main() {
     vec3 n = normalize(vNormal); vec3 v = normalize(vViewDir); float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.5);
     vec2 uv = vPosition.xy * 3.0; float n1 = noise2d(uv + uTime * 0.1); float n2 = noise2d(uv * 2.0 - uTime * 0.15);
     float cracks = smoothstep(0.45, 0.55, n1 * n2);
     vec3 darkRock = vec3(0.08, 0.05, 0.03); vec3 lavaOrange = vec3(1.0, 0.4, 0.0); vec3 lavaYellow = vec3(1.0, 0.8, 0.2);
     vec3 lava = mix(lavaOrange, lavaYellow, n2); vec3 color = mix(darkRock, lava, cracks);
     color += vec3(1.0, 0.5, 0.1) * fresnel * 0.6; gl_FragColor = vec4(color, 1.0);
   }`
)

const IcePlanetMaterial = shaderMaterial(
    { uTime: 0 },
    `varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir; void main() { vNormal = normalize(normalMatrix * normal); vPosition = position; vec4 wp = modelMatrix * vec4(position, 1.0); vViewDir = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    `uniform float uTime; varying vec3 vNormal; varying vec3 vPosition; varying vec3 vViewDir;
   void main() {
     vec3 n = normalize(vNormal); vec3 v = normalize(vViewDir); float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
     float facets = abs(sin(vPosition.x * 12.0) * sin(vPosition.y * 14.0) * sin(vPosition.z * 10.0));
     vec3 deepBlue = vec3(0.05, 0.15, 0.35); vec3 iceBlue = vec3(0.4, 0.7, 0.95); vec3 white = vec3(0.9, 0.95, 1.0);
     vec3 color = mix(deepBlue, iceBlue, facets); color = mix(color, white, fresnel * 0.8);
     float sparkle = pow(sin(vPosition.x * 30.0 + uTime) * sin(vPosition.y * 30.0 - uTime * 0.7), 8.0);
     color += vec3(0.8, 0.9, 1.0) * sparkle * 0.4; gl_FragColor = vec4(color, 0.9);
   }`
)

/* ============ CAR SHADER ============ */
const CarMetallicMaterial = shaderMaterial(
    { uTime: 0, uLightPos: new THREE.Vector3(5, 3, 5) },
    `varying vec3 vNormal; varying vec3 vPosition; varying vec3 vWorldPos; varying vec3 vViewDir;
   void main() { vNormal = normalize(normalMatrix * normal); vPosition = position; vec4 wp = modelMatrix * vec4(position, 1.0); vWorldPos = wp.xyz; vViewDir = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    `uniform float uTime; uniform vec3 uLightPos;
   varying vec3 vNormal; varying vec3 vPosition; varying vec3 vWorldPos; varying vec3 vViewDir;
   void main() {
     vec3 n = normalize(vNormal); vec3 v = normalize(vViewDir); vec3 l = normalize(uLightPos - vWorldPos); vec3 h = normalize(l + v);
     float fresnel = pow(1.0 - max(dot(n, v), 0.0), 4.0);
     float spec1 = pow(max(dot(n, h), 0.0), 80.0); float spec2 = pow(max(dot(n, h), 0.0), 20.0);
     float diff = max(dot(n, l), 0.0);
     float shift = sin(uTime * 0.8 + vPosition.y * 2.0) * 0.5 + 0.5;
     vec3 metalColor = mix(vec3(0.85, 0.65, 0.15), vec3(0.9, 0.4, 0.3), shift * 0.4);
     vec3 base = vec3(0.04, 0.04, 0.05) + diff * metalColor * 0.3;
     vec3 specColor = vec3(1.0, 0.92, 0.7) * spec1 * 2.0 + metalColor * spec2 * 0.6;
     vec3 rimColor = mix(vec3(0.98, 0.74, 0.18), vec3(0.98, 0.42, 0.42), fresnel) * fresnel * 0.6;
     vec3 envReflect = metalColor * fresnel * 0.4 + vec3(0.15, 0.12, 0.08) * (1.0 - fresnel);
     gl_FragColor = vec4(base + specColor + rimColor + envReflect, 1.0);
   }`
)

extend({ NebulaMaterial, SunMaterial, SunCoronaMaterial, AuroraPlanetMaterial, LavaPlanetMaterial, IcePlanetMaterial, CarMetallicMaterial })

function NebulaBG() {
    const matRef = useRef()
    useFrame((state) => { if (matRef.current) matRef.current.uTime = state.clock.elapsedTime })
    return (
        <mesh position={[0, 0, -30]} renderOrder={-1}>
            <planeGeometry args={[120, 60, 1, 1]} />
            <nebulaMaterial ref={matRef} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
    )
}

const BG_PLANETS = [
    { pos: [-8, 2, -15], scale: 1.5, shader: 'aurora', rotSpeed: 0.002, glow: '#8b5cf6', glowIntensity: 2 },
    { pos: [10, -3, -20], scale: 1.2, shader: 'aurora', rotSpeed: -0.003, glow: '#06d6a0', glowIntensity: 1.5 },
    { pos: [-6, -5, -12], scale: 0.8, shader: 'lava', rotSpeed: 0.004, glow: '#ff6b35', glowIntensity: 3 },
    { pos: [20, 0, -30], scale: 1.0, shader: 'ice', rotSpeed: 0.001, glow: '#4cc9f0', glowIntensity: 1.8 },
]

function Sun() {
    const sunRef = useRef()
    const sunMatRef = useRef()
    const coronaRef = useRef()
    useFrame((state) => {
        const t = state.clock.elapsedTime
        if (sunRef.current) {
            sunRef.current.rotation.y += 0.001
            sunRef.current.scale.setScalar(2.5 * (1.0 + Math.sin(t * 0.8) * 0.02))
        }
        if (sunMatRef.current) sunMatRef.current.uTime = t
        if (coronaRef.current) coronaRef.current.uTime = t
    })
    return (
        <group position={[12, 6, -25]}>
            <mesh ref={sunRef}><sphereGeometry args={[1, 64, 64]} /><sunMaterial ref={sunMatRef} /></mesh>
            <mesh renderOrder={-1}><planeGeometry args={[20, 20]} /><sunCoronaMaterial ref={coronaRef} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
            <pointLight color="#ffdd77" intensity={8} distance={120} decay={1.5} />
        </group>
    )
}

function BackgroundPlanet({ config }) {
    const { scene } = useGLTF('/models/Planet1.glb')
    const ref = useRef()
    const matRef = useRef()
    const cloned = useMemo(() => scene.clone(true), [scene])
    useFrame((state) => {
        if (!ref.current) return
        ref.current.rotation.y += config.rotSpeed
        if (matRef.current) {
            matRef.current.uTime = state.clock.elapsedTime
            cloned.traverse((child) => {
                if (child.isMesh) { child.material = matRef.current; child.material.side = THREE.DoubleSide; }
            })
        }
    })
    const Shader = config.shader === 'aurora' ? 'auroraPlanetMaterial' : config.shader === 'lava' ? 'lavaPlanetMaterial' : 'icePlanetMaterial'
    return (
        <group ref={ref} position={config.pos} scale={config.scale}>
            <primitive object={cloned} />
            <pointLight color={config.glow} intensity={config.glowIntensity} distance={15} decay={2} />
            {config.shader === 'aurora' && <auroraPlanetMaterial ref={matRef} />}
            {config.shader === 'lava' && <lavaPlanetMaterial ref={matRef} />}
            {config.shader === 'ice' && <icePlanetMaterial ref={matRef} />}
        </group>
    )
}

function RacingCar() {
    const { scene } = useGLTF('/models/car.glb')
    const carRef = useRef()
    const carShaderRef = useRef()
    const cloned = useMemo(() => scene.clone(true), [scene])
    useFrame((state) => {
        if (!carRef.current) return
        const t = state.clock.elapsedTime
        // Gentle floating
        carRef.current.position.y = -2 + Math.sin(t * 0.5) * 0.2
        carRef.current.rotation.y = -0.5 + Math.sin(t * 0.2) * 0.1
        if (carShaderRef.current) {
            carShaderRef.current.uTime = t
            cloned.traverse((child) => { if (child.isMesh) { child.material = carShaderRef.current; child.material.side = THREE.DoubleSide; } })
        }
    })
    return (
        <group position={[0, -2, 0]} rotation={[0, -0.2, 0]} scale={0.8}>
            <carMetallicMaterial ref={carShaderRef} />
            <primitive ref={carRef} object={cloned} />
        </group>
    )
}

/* ============ PARTICLES ============ */
function ParticleField({ count = 200 }) {
    const mesh = useRef()
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 40
            pos[i * 3 + 1] = (Math.random() - 0.5) * 40
            pos[i * 3 + 2] = (Math.random() - 0.5) * 40
        }
        return pos
    }, [count])
    useFrame((state) => { if (mesh.current) mesh.current.rotation.y = state.clock.elapsedTime * 0.02 })
    return (
        <points ref={mesh}>
            <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
            <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} sizeAttenuation />
        </points>
    )
}

export default function ContactCanvas() {
    return (
        <div className="contact-canvas-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.5} />
                <pointLight position={[5, 5, 5]} intensity={1} />
                <Stars radius={60} depth={50} count={1000} factor={4} fade speed={0.5} />
                <NebulaBG />
                <React.Suspense fallback={null}>
                    <Sun />
                    {BG_PLANETS.map((cfg, i) => <BackgroundPlanet key={i} config={cfg} />)}
                    <RacingCar />
                </React.Suspense>
                <ParticleField />
            </Canvas>
        </div>
    )
}
