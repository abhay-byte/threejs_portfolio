import { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { Stars, useGLTF, shaderMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

/* ============ OVERLAY SHADER MATERIALS ============ */
/* These render as a second pass over the real textured asteroid */

/* Stage 0: Wireframe glow overlay — digital/game dev origin story */
const WireframeGlowMaterial = shaderMaterial(
  { uTime: 0, uColor1: new THREE.Color('#fabd2f'), uColor2: new THREE.Color('#ff6b6b'), uOpacity: 1.0 },
  `varying vec3 vPosition; varying vec3 vNormal;
   void main() { vPosition = position; vNormal = normal;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 1.01, 1.0); }`,
  `uniform float uTime; uniform vec3 uColor1; uniform vec3 uColor2; uniform float uOpacity;
   varying vec3 vPosition; varying vec3 vNormal;
   void main() {
     float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.5);
     float scanLine = sin(vPosition.y * 30.0 + uTime * 3.0) * 0.5 + 0.5;
     vec3 color = mix(uColor1, uColor2, scanLine * fresnel);
     float alpha = (fresnel * 0.7 + scanLine * 0.15) * uOpacity;
     gl_FragColor = vec4(color, alpha);
   }`
)

/* Stage 2: Holographic scan overlay — tech/app building era */
const HologramMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#667eea'), uOpacity: 1.0 },
  `varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUv;
   void main() { vPosition = position; vNormal = normal; vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 1.01, 1.0); }`,
  `uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
   varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUv;
   void main() {
     float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.0);
     float scanLine = step(0.98, sin(vPosition.y * 60.0 + uTime * 5.0));
     float horizontalScan = smoothstep(-0.02, 0.02, sin(vPosition.y * 2.0 - uTime * 1.5));
     float grid = step(0.95, sin(vUv.x * 100.0)) + step(0.95, sin(vUv.y * 100.0));
     vec3 finalColor = uColor * (0.3 + fresnel * 0.7) + vec3(scanLine * 0.4 + grid * 0.08);
     finalColor *= horizontalScan * 0.5 + 0.5;
     float alpha = (fresnel * 0.5 + scanLine * 0.3 + 0.05) * uOpacity;
     gl_FragColor = vec4(finalColor, alpha);
   }`
)

/* Stage 3: Emissive bloom overlay — open source / community glow */
const EmissiveBloomMaterial = shaderMaterial(
  { uTime: 0, uColor1: new THREE.Color('#fabd2f'), uColor2: new THREE.Color('#4CAF50'), uOpacity: 1.0 },
  `varying vec3 vPosition; varying vec3 vNormal;
   void main() { vPosition = position; vNormal = normal;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 1.01, 1.0); }`,
  `uniform float uTime; uniform vec3 uColor1; uniform vec3 uColor2; uniform float uOpacity;
   varying vec3 vPosition; varying vec3 vNormal;
   void main() {
     float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
     float pulse = sin(uTime * 2.0) * 0.15 + 0.85;
     float wave = sin(vPosition.x * 5.0 + vPosition.y * 5.0 + uTime * 2.0) * 0.5 + 0.5;
     vec3 color = mix(uColor1, uColor2, wave) + fresnel * vec3(0.3, 0.6, 0.2);
     float alpha = (fresnel * 0.5 + 0.05) * pulse * uOpacity;
     gl_FragColor = vec4(color, alpha);
   }`
)

extend({ WireframeGlowMaterial, HologramMaterial, EmissiveBloomMaterial })

/* ============ PARTICLE FIELD ============ */
function ParticleField({ count = 600, scrollProgress }) {
  const mesh = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25
    }
    return pos
  }, [count])

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3)
    const c1 = new THREE.Color('#fabd2f')
    const c2 = new THREE.Color('#ff6b6b')
    const c3 = new THREE.Color('#667eea')
    for (let i = 0; i < count; i++) {
      const t = Math.random()
      const c = t < 0.33 ? c1 : t < 0.66 ? c2 : c3
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return col
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.03
      mesh.current.rotation.x = state.clock.elapsedTime * 0.01
      mesh.current.position.z = -scrollProgress * 5
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

/* ============ NASA ASTEROID WITH REAL TEXTURE + SHADER OVERLAYS ============ */
function AsteroidModel({ scrollProgress }) {
  const { scene } = useGLTF('/models/earth.glb')
  const asteroidRef = useRef()
  const overlayRef = useRef()
  const shaderRef0 = useRef()
  const shaderRef2 = useRef()
  const shaderRef3 = useRef()

  // Clone scene for the overlay pass
  const mainScene = useMemo(() => scene.clone(true), [scene])
  const overlayScene = useMemo(() => scene.clone(true), [scene])

  useFrame((state) => {
    if (!asteroidRef.current) return
    const t = state.clock.elapsedTime

    // Rotate both in sync
    asteroidRef.current.rotation.y += 0.003
    if (overlayRef.current) overlayRef.current.rotation.y = asteroidRef.current.rotation.y

    // Scale: big, grows with scroll
    const baseScale = 3.5
    const s = baseScale + scrollProgress * 1.0
    asteroidRef.current.scale.set(s, s, s)
    if (overlayRef.current) overlayRef.current.scale.set(s, s, s)

    // Gentle float
    const yPos = Math.sin(t * 0.4) * 0.15
    asteroidRef.current.position.y = yPos
    if (overlayRef.current) overlayRef.current.position.y = yPos

    // Update shader uniforms
    if (shaderRef0.current) shaderRef0.current.uTime = t
    if (shaderRef2.current) shaderRef2.current.uTime = t
    if (shaderRef3.current) shaderRef3.current.uTime = t

    // Determine stage (0-4) and apply overlay shader
    // Real texture is ALWAYS visible on mainScene
    // Overlay changes per stage
    const stage = scrollProgress * 4

    // Compute overlay opacity with smooth fade between stages
    let overlay0Opacity = 0
    let overlay2Opacity = 0
    let overlay3Opacity = 0

    if (stage < 1) {
      // Chapter I: wireframe glow overlay
      overlay0Opacity = 1.0
    } else if (stage < 1.3) {
      // Fade out wireframe
      overlay0Opacity = 1.0 - (stage - 1) / 0.3
    } else if (stage < 1.7) {
      // Chapter II: pure texture, no overlay
    } else if (stage < 2) {
      // Fade in hologram
      overlay2Opacity = (stage - 1.7) / 0.3
    } else if (stage < 3) {
      // Chapter III: holographic overlay
      overlay2Opacity = 1.0
    } else if (stage < 3.3) {
      // Fade hologram out, bloom in
      overlay2Opacity = 1.0 - (stage - 3) / 0.3
      overlay3Opacity = (stage - 3) / 0.3
    } else {
      // Chapter IV: emissive bloom overlay
      overlay3Opacity = 1.0
    }

    // Apply overlay material to all overlay meshes
    if (shaderRef0.current) shaderRef0.current.uOpacity = overlay0Opacity
    if (shaderRef2.current) shaderRef2.current.uOpacity = overlay2Opacity
    if (shaderRef3.current) shaderRef3.current.uOpacity = overlay3Opacity

    // Pick which shader to show on overlay meshes
    overlayScene.traverse((child) => {
      if (!child.isMesh) return
      if (overlay0Opacity > 0.01 && shaderRef0.current) {
        child.material = shaderRef0.current
        child.visible = true
      } else if (overlay2Opacity > 0.01 && shaderRef2.current) {
        child.material = shaderRef2.current
        child.visible = true
      } else if (overlay3Opacity > 0.01 && shaderRef3.current) {
        child.material = shaderRef3.current
        child.visible = true
      } else {
        child.visible = false
      }
      if (child.material) {
        child.material.transparent = true
        child.material.side = THREE.FrontSide
        child.material.depthWrite = false
      }
    })
  })

  return (
    <group>
      {/* Hidden shader instances for refs */}
      <wireframeGlowMaterial ref={shaderRef0} transparent depthWrite={false} />
      <hologramMaterial ref={shaderRef2} transparent depthWrite={false} />
      <emissiveBloomMaterial ref={shaderRef3} transparent depthWrite={false} />

      {/* Real textured asteroid — always visible */}
      <primitive ref={asteroidRef} object={mainScene} scale={3.5} />

      {/* Shader overlay — rendered on top */}
      <primitive ref={overlayRef} object={overlayScene} scale={3.5} renderOrder={1} />
    </group>
  )
}

/* ============ ORBIT RINGS ============ */
function OrbitRing({ radius = 4.5, tilt = 2.5, scrollProgress }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.PI / tilt + Math.sin(state.clock.elapsedTime * 0.5) * 0.15
      ref.current.rotation.z = state.clock.elapsedTime * 0.08
    }
  })
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.008, 16, 200]} />
      <meshBasicMaterial color="#fabd2f" transparent opacity={0.2 + scrollProgress * 0.15} />
    </mesh>
  )
}

/* ============ LOADING FALLBACK ============ */
function LoadingFallback() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.5
      ref.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2, 2]} />
      <meshBasicMaterial color="#fabd2f" wireframe transparent opacity={0.3} />
    </mesh>
  )
}

/* ============ CAMERA CLOSE-UP CONTROLLER ============ */
function CameraController({ scrollProgress }) {
  const { camera } = useThree()

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Zoom in as user scrolls: z goes from 8 → 4 (close-up)
    const zStart = 8
    const zEnd = 4
    const targetZ = zStart - scrollProgress * (zStart - zEnd)

    // Subtle orbital sway
    const swayX = Math.sin(t * 0.2) * 0.3 * (1 - scrollProgress * 0.5)
    const swayY = Math.cos(t * 0.15) * 0.2 * (1 - scrollProgress * 0.5)

    // Smooth lerp
    camera.position.x += (swayX - camera.position.x) * 0.05
    camera.position.y += (swayY - camera.position.y) * 0.05
    camera.position.z += (targetZ - camera.position.z) * 0.05

    camera.lookAt(0, 0, 0)
  })

  return null
}

/* ============ CUSTOM CAR METALLIC SHADER ============ */
const CarMetallicMaterial = shaderMaterial(
  { uTime: 0, uLightPos: new THREE.Vector3(5, 3, 5) },
  // vertex
  `varying vec3 vNormal; varying vec3 vPosition; varying vec3 vWorldPos; varying vec3 vViewDir;
   void main() {
     vNormal = normalize(normalMatrix * normal);
     vPosition = position;
     vec4 wp = modelMatrix * vec4(position, 1.0);
     vWorldPos = wp.xyz;
     vViewDir = normalize(cameraPosition - wp.xyz);
     gl_Position = projectionMatrix * viewMatrix * wp;
   }`,
  // fragment
  `uniform float uTime; uniform vec3 uLightPos;
   varying vec3 vNormal; varying vec3 vPosition; varying vec3 vWorldPos; varying vec3 vViewDir;
   void main() {
     vec3 n = normalize(vNormal);
     vec3 v = normalize(vViewDir);
     vec3 l = normalize(uLightPos - vWorldPos);
     vec3 h = normalize(l + v);

     // Fresnel rim
     float fresnel = pow(1.0 - max(dot(n, v), 0.0), 4.0);

     // Anisotropic-like specular
     float spec1 = pow(max(dot(n, h), 0.0), 80.0);
     float spec2 = pow(max(dot(n, h), 0.0), 20.0);

     // Diffuse
     float diff = max(dot(n, l), 0.0);

     // Animated color shift on reflection
     float shift = sin(uTime * 0.8 + vPosition.y * 2.0) * 0.5 + 0.5;
     vec3 metalColor = mix(
       vec3(0.85, 0.65, 0.15),  // warm gold
       vec3(0.9, 0.4, 0.3),     // warm coral
       shift * 0.4
     );

     // Dark chrome base
     vec3 base = vec3(0.04, 0.04, 0.05) + diff * metalColor * 0.3;

     // Sharp specular highlights
     vec3 specColor = vec3(1.0, 0.92, 0.7) * spec1 * 2.0
                    + metalColor * spec2 * 0.6;

     // Warm fresnel rim glow
     vec3 rimColor = mix(vec3(0.98, 0.74, 0.18), vec3(0.98, 0.42, 0.42), fresnel) * fresnel * 0.6;

     // Environment reflection fake
     vec3 envReflect = metalColor * fresnel * 0.4 + vec3(0.15, 0.12, 0.08) * (1.0 - fresnel);

     vec3 finalColor = base + specColor + rimColor + envReflect;
     gl_FragColor = vec4(finalColor, 1.0);
   }`
)

extend({ CarMetallicMaterial })

/* ============ RACING CAR MODEL (visible in all chapters) ============ */
function RacingCarModel({ scrollProgress }) {
  const { scene } = useGLTF('/models/car.glb')
  const carRef = useRef()
  const carShaderRef = useRef()
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Smooth lerp helper
  const lerp = (a, b, t) => a + (b - a) * t

  useFrame((state) => {
    if (!carRef.current) return
    const t = state.clock.elapsedTime
    const stage = scrollProgress * 4

    // Update shader time
    if (carShaderRef.current) {
      carShaderRef.current.uTime = t
      // Apply shader to all meshes
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.material = carShaderRef.current
          child.material.side = THREE.DoubleSide
        }
      })
    }

    carRef.current.visible = true

    // Calculate target position/rotation per stage
    let tx, ty, tz, ry, rz, rx

    if (stage < 1) {
      // Chapter I: slow orbit right side, fixed facing
      const angle = t * 0.12
      tx = Math.cos(angle) * 6.5
      tz = Math.sin(angle) * 6.5
      ty = 2.0 + Math.sin(t * 0.3) * 0.1
      ry = -1.2   // fixed facing
      rz = -0.08
      rx = 0
    } else if (stage < 2) {
      // Chapter II: parked lower-left, fixed facing
      tx = -5.5
      tz = 3.0
      ty = -1.5 + Math.sin(t * 0.25) * 0.1
      ry = 0.8    // fixed facing
      rz = 0.06
      rx = 0
    } else if (stage < 3) {
      // Chapter III: slow arc top-right, fixed facing
      const angle = t * 0.1 + Math.PI * 0.5
      tx = Math.cos(angle) * 5.5
      tz = Math.sin(angle) * 4.0
      ty = 3.0 + Math.sin(t * 0.35) * 0.15
      ry = -0.5   // fixed facing
      rz = 0.1
      rx = 0
    } else {
      // Chapter IV: slow flyby, fixed facing
      const angle = t * 0.08 + Math.PI
      tx = Math.cos(angle) * 4.5
      tz = Math.sin(angle) * 4.5 + 2.0
      ty = 0.5 + Math.sin(t * 0.2) * 0.05
      ry = -2.0   // fixed facing toward camera
      rz = -0.05
      rx = 0
    }

    // Smooth lerp all transforms — higher factor = faster settle
    const L = 0.06
    carRef.current.position.x = lerp(carRef.current.position.x, tx, L)
    carRef.current.position.y = lerp(carRef.current.position.y, ty, L)
    carRef.current.position.z = lerp(carRef.current.position.z, tz, L)
    carRef.current.rotation.x = lerp(carRef.current.rotation.x, rx, L)
    carRef.current.rotation.y = lerp(carRef.current.rotation.y, ry, L)
    carRef.current.rotation.z = lerp(carRef.current.rotation.z, rz, L)

    const s = 0.5
    carRef.current.scale.x = lerp(carRef.current.scale.x, s, L)
    carRef.current.scale.y = lerp(carRef.current.scale.y, s, L)
    carRef.current.scale.z = lerp(carRef.current.scale.z, s, L)
  })

  return (
    <group>
      <carMetallicMaterial ref={carShaderRef} />
      <primitive ref={carRef} object={clonedScene} scale={0.5} />
    </group>
  )
}

/* ============ CLASS 12th BOOKS (Chapter II asset) ============ */
function Class12Books({ scrollProgress }) {
  const csBook = useGLTF('/models/book_cs.glb')
  const physicsBook = useGLTF('/models/book_physics.glb')
  const mathBook = useGLTF('/models/book_math.glb')
  const chemBook = useGLTF('/models/book_chemistry.glb')

  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Visibility: appear only during Chapter II (0.25 - 0.5)
    // Fade in: 0.2-0.25, Visible: 0.25-0.45, Fade out: 0.45-0.5
    const visibility = scrollProgress < 0.2 ? 0
      : scrollProgress < 0.25 ? (scrollProgress - 0.2) / 0.05
        : scrollProgress < 0.45 ? 1.0
          : scrollProgress < 0.5 ? 1.0 - (scrollProgress - 0.45) / 0.05
            : 0

    groupRef.current.visible = visibility > 0.01

    if (groupRef.current.visible) {
      // Gentle floating animation for the whole group
      groupRef.current.rotation.y = t * 0.1
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.2

      // Scale with fade
      const s = 0.8 * visibility
      groupRef.current.scale.set(s, s, s)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Computer Science - Top Right */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <primitive
          object={csBook.scene}
          position={[3.5, 2, 0]}
          scale={0.5}
          rotation={[0.5, -0.5, 0]}
        />
      </Float>

      {/* Physics - Bottom Left */}
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.6}>
        <primitive
          object={physicsBook.scene}
          position={[-3.5, -2, 1]}
          scale={0.5}
          rotation={[-0.2, 0.5, 0.2]}
        />
      </Float>

      {/* Math - Top Left */}
      <Float speed={3} rotationIntensity={0.4} floatIntensity={0.7}>
        <primitive
          object={mathBook.scene}
          position={[-3, 2.5, -1]}
          scale={0.5}
          rotation={[0.3, 0.8, -0.1]}
        />
      </Float>

      {/* Chemistry - Bottom Right */}
      <Float speed={2.2} rotationIntensity={0.7} floatIntensity={0.5}>
        <primitive
          object={chemBook.scene}
          position={[3, -1.5, -1]}
          scale={0.5}
          rotation={[-0.4, -0.3, 0.1]}
        />
      </Float>
    </group>
  )
}

/* ============ PROJECT MODELS (spread across all chapters) ============ */
const PROJECT_MODELS = [
  // Chapter I — Games
  { path: '/models/BasketballCourt.glb', pos: [-6, 3, -6], scale: 0.04, chapter: 0, rotSpeed: 0.003 },
  { path: '/models/Cone.glb', pos: [6, -2.5, -6], scale: 0.04, chapter: 0, rotSpeed: 0.005 },
  // Chapter II — Apps
  { path: '/models/TeacherChair.glb', pos: [-5.5, -1.5, -5], scale: 0.02, chapter: 1, rotSpeed: 0.004 },
  { path: '/models/WesternToilet.glb', pos: [5.5, 1.5, -5], scale: 0.06, chapter: 1, rotSpeed: 0.003 },
  // Chapter III — Open Source
  { path: '/models/PlanetBuilding.glb', pos: [5.5, 3, -6], scale: 0.02, chapter: 2, rotSpeed: 0.002 },
  { path: '/models/PlanetInsideStation.glb', pos: [-5.5, -2, -5], scale: 0.03, chapter: 2, rotSpeed: 0.004 },
  // Chapter IV — Welcome
  { path: '/models/CuboidLight.glb', pos: [5, 0.5, -5], scale: 0.08, chapter: 3, rotSpeed: 0.005 },
]

function SingleProjectModel({ config, scrollProgress }) {
  const { scene } = useGLTF(config.path)
  const ref = useRef()
  const cloned = useMemo(() => scene.clone(true), [scene])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const stage = scrollProgress * 4
    const ch = config.chapter

    // Each chapter occupies stage [ch, ch+1)
    // Fade in: ch-0.1 to ch+0.1, visible: ch+0.1 to ch+0.85, fade out: ch+0.85 to ch+1.05
    let vis = 0
    if (stage >= ch - 0.1 && stage < ch + 0.1) vis = (stage - (ch - 0.1)) / 0.2
    else if (stage >= ch + 0.1 && stage < ch + 0.85) vis = 1.0
    else if (stage >= ch + 0.85 && stage < ch + 1.05) vis = 1.0 - (stage - (ch + 0.85)) / 0.2

    vis = Math.max(0, Math.min(1, vis))
    ref.current.visible = vis > 0.01

    if (ref.current.visible) {
      const s = config.scale * vis
      ref.current.scale.set(s, s, s)
      ref.current.rotation.y += config.rotSpeed
      ref.current.position.y = config.pos[1] + Math.sin(t * 0.4 + ch) * 0.15

      cloned.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true
          child.material.opacity = vis
        }
      })
    }
  })

  return (
    <group ref={ref} position={config.pos}>
      <primitive object={cloned} />
    </group>
  )
}

function ProjectModels({ scrollProgress }) {
  return (
    <>
      {PROJECT_MODELS.map((cfg, i) => (
        <SingleProjectModel key={i} config={cfg} scrollProgress={scrollProgress} />
      ))}
    </>
  )
}

/* ============ MAIN SCENE ============ */
function Scene({ scrollProgress }) {
  return (
    <>
      <CameraController scrollProgress={scrollProgress} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[-5, -3, 5]} intensity={0.6} color="#667eea" />
      <pointLight position={[3, 5, -3]} intensity={0.4} color="#fabd2f" />
      <Stars radius={80} depth={60} count={1500} factor={3} fade speed={0.4} />
      <ParticleField scrollProgress={scrollProgress} />
      <Suspense fallback={<LoadingFallback />}>
        <AsteroidModel scrollProgress={scrollProgress} />
        <RacingCarModel scrollProgress={scrollProgress} />
        <Class12Books scrollProgress={scrollProgress} />
        <ProjectModels scrollProgress={scrollProgress} />
      </Suspense>
      <OrbitRing radius={5} tilt={2.5} scrollProgress={scrollProgress} />
      <OrbitRing radius={6} tilt={3.5} scrollProgress={scrollProgress} />
    </>
  )
}

/* ============ INTRO SCENE COMPONENT ============ */
export default function IntroScene({ onComplete }) {
  const containerRef = useRef()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [introComplete, setIntroComplete] = useState(false)

  const slides = [
    {
      label: 'Chapter I', title: 'It All Started With Games',
      text: 'From building 2D RPGs with massive open worlds to crafting futuristic racing experiences — I fell in love with creating digital worlds from scratch.'
    },
    {
      label: 'Chapter II', title: 'Then Came the Apps',
      text: 'I shifted to building Android apps that push boundaries — from GPU-accelerated Linux on mobile to kernel managers and CPU benchmarking tools.'
    },
    {
      label: 'Chapter III', title: 'Building for Everyone',
      text: 'Open source became my north star. Every project I build is for the community — free, transparent, and made to empower developers everywhere.'
    },
    {
      label: 'Chapter IV', title: 'Welcome to My World',
      text: 'Scroll down to explore my projects, skills, and everything I\'ve built on this journey.'
    }
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalHeight = containerRef.current.scrollHeight - window.innerHeight
      const scrolled = -rect.top
      const progress = Math.max(0, Math.min(1, scrolled / totalHeight))
      setScrollProgress(progress)

      if (progress > 0.05) setShowHint(false)
      else setShowHint(true)

      if (progress >= 0.98) {
        setIntroComplete(true)
        if (onComplete) onComplete()
      } else {
        setIntroComplete(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onComplete])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }
        })
      },
      { threshold: 0.5 }
    )
    const blocks = document.querySelectorAll('.intro-text-block')
    blocks.forEach(b => observer.observe(b))
    return () => blocks.forEach(b => observer.unobserve(b))
  }, [])

  return (
    <div className="intro-container" ref={containerRef}>
      <div className={`intro-canvas-wrapper ${introComplete ? 'fade-out' : ''}`}>
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]}>
          <Scene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      <div className="intro-scroll-content">
        {slides.map((slide, i) => (
          <div className="intro-slide" key={i}>
            <div className="intro-text-block" style={{ transition: `opacity 0.8s ease ${i * 0.1}s, transform 0.8s ease ${i * 0.1}s` }}>
              <div className="intro-label">{slide.label}</div>
              <h2>{slide.title}</h2>
              <p>{slide.text}</p>
            </div>
          </div>
        ))}
      </div>

      {showHint && (
        <div className="intro-scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      )}
    </div>
  )
}

useGLTF.preload('/models/earth.glb')
useGLTF.preload('/models/car.glb')
useGLTF.preload('/models/book_cs.glb')
useGLTF.preload('/models/book_physics.glb')
useGLTF.preload('/models/book_math.glb')
useGLTF.preload('/models/book_chemistry.glb')
PROJECT_MODELS.forEach(m => useGLTF.preload(m.path))
