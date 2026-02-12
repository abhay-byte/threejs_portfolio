import { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { Stars, useGLTF, shaderMaterial } from '@react-three/drei'
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

/* ============ RACING CAR MODEL (visible in all chapters) ============ */
function RacingCarModel({ scrollProgress }) {
  const { scene } = useGLTF('/models/car.glb')
  const carRef = useRef()
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    const chromeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#c0c0c0'),
      metalness: 0.95,
      roughness: 0.08,
      emissive: new THREE.Color('#fabd2f'),
      emissiveIntensity: 0.15,
      envMapIntensity: 2.0,
    })
    clone.traverse((child) => {
      if (child.isMesh) child.material = chromeMat
    })
    return clone
  }, [scene])

  useFrame((state) => {
    if (!carRef.current) return
    const t = state.clock.elapsedTime
    const stage = scrollProgress * 4 // 0=ChI, 1=ChII, 2=ChIII, 3=ChIV

    carRef.current.visible = true
    const s = 0.5
    carRef.current.scale.set(s, s, s)

    if (stage < 1) {
      // Chapter I: orbit right side, higher up
      const angle = t * 0.3
      carRef.current.position.x = Math.cos(angle) * 6.5
      carRef.current.position.z = Math.sin(angle) * 6.5
      carRef.current.position.y = 2.0 + Math.sin(t * 0.6) * 0.2
      carRef.current.rotation.y = -angle - Math.PI / 2
      carRef.current.rotation.z = -0.12
      carRef.current.rotation.x = 0
    } else if (stage < 2) {
      // Chapter II: parked lower-left, gently floating
      const targetX = -5.5
      const targetZ = 3.0
      const targetY = -1.5 + Math.sin(t * 0.5) * 0.15
      carRef.current.position.x += (targetX - carRef.current.position.x) * 0.04
      carRef.current.position.z += (targetZ - carRef.current.position.z) * 0.04
      carRef.current.position.y += (targetY - carRef.current.position.y) * 0.04
      carRef.current.rotation.y += (0.8 - carRef.current.rotation.y) * 0.04
      carRef.current.rotation.z += (0.1 - carRef.current.rotation.z) * 0.04
      carRef.current.rotation.x = Math.sin(t * 0.3) * 0.02
    } else if (stage < 3) {
      // Chapter III: sweeping arc top-right
      const angle = t * 0.25 + Math.PI * 0.5
      carRef.current.position.x = Math.cos(angle) * 5.5
      carRef.current.position.z = Math.sin(angle) * 4.0
      carRef.current.position.y = 3.0 + Math.sin(t * 0.7) * 0.3
      carRef.current.rotation.y = -angle - Math.PI / 2
      carRef.current.rotation.z = 0.15
      carRef.current.rotation.x = Math.sin(t * 0.5) * 0.05
    } else {
      // Chapter IV: slow flyby close to camera
      const angle = t * 0.15 + Math.PI
      carRef.current.position.x = Math.cos(angle) * 4.5
      carRef.current.position.z = Math.sin(angle) * 4.5 + 2.0
      carRef.current.position.y = 0.5 + Math.sin(t * 0.4) * 0.1
      carRef.current.rotation.y = -angle - Math.PI / 2
      carRef.current.rotation.z = -0.08
      carRef.current.rotation.x = 0
    }
  })

  return <primitive ref={carRef} object={clonedScene} scale={0.5} />
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
