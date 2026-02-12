import { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { Stars, useGLTF, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

/* ============ CUSTOM SHADER MATERIALS ============ */

/* Stage 1: Wireframe glow — digital/game dev origin story */
const WireframeGlowMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#fabd2f'),
    uColor2: new THREE.Color('#ff6b6b'),
    uOpacity: 1.0,
  },
  // vertex
  `
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vPosition = position;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uOpacity;
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
      float scanLine = sin(vPosition.y * 30.0 + uTime * 3.0) * 0.5 + 0.5;
      vec3 color = mix(uColor1, uColor2, scanLine * fresnel);
      float alpha = fresnel * 0.8 + scanLine * 0.2;
      gl_FragColor = vec4(color, alpha * uOpacity);
    }
  `
)

/* Stage 2: Holographic scan — tech/app building era */
const HologramMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#667eea'),
    uOpacity: 1.0,
  },
  // vertex
  `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vPosition = position;
      vNormal = normal;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.0);
      float scanLine = step(0.98, sin(vPosition.y * 60.0 + uTime * 5.0));
      float horizontalScan = smoothstep(-0.02, 0.02, sin(vPosition.y * 2.0 - uTime * 1.5));
      float grid = step(0.95, sin(vUv.x * 100.0)) + step(0.95, sin(vUv.y * 100.0));
      vec3 baseColor = uColor * (0.3 + fresnel * 0.7);
      vec3 finalColor = baseColor + vec3(scanLine * 0.5) + vec3(grid * 0.1);
      finalColor *= horizontalScan * 0.5 + 0.5;
      float alpha = fresnel * 0.6 + scanLine * 0.3 + 0.15;
      gl_FragColor = vec4(finalColor, alpha * uOpacity);
    }
  `
)

/* Stage 3: Emissive bloom — open source / community glow */
const EmissiveBloomMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#fabd2f'),
    uColor2: new THREE.Color('#4CAF50'),
    uOpacity: 1.0,
  },
  // vertex
  `
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vPosition = position;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uOpacity;
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
      float pulse = sin(uTime * 2.0) * 0.15 + 0.85;
      float wave = sin(vPosition.x * 5.0 + vPosition.y * 5.0 + uTime * 2.0) * 0.5 + 0.5;
      vec3 color = mix(uColor1, uColor2, wave);
      color += fresnel * vec3(0.3, 0.6, 0.2);
      float alpha = (0.4 + fresnel * 0.6) * pulse;
      gl_FragColor = vec4(color, alpha * uOpacity);
    }
  `
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

/* ============ NASA MODEL WITH STAGED SHADERS ============ */
function EarthModel({ scrollProgress }) {
  const { scene } = useGLTF('/models/earth.glb')
  const earthRef = useRef()
  const shaderRef1 = useRef()
  const shaderRef2 = useRef()
  const shaderRef3 = useRef()
  const originalMaterials = useRef(new Map())
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Store original materials on first render
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        originalMaterials.current.set(child.uuid, child.material)
      }
    })
  }, [clonedScene])

  // Determine which stage we're in based on scroll
  // 0-0.25: Stage 0 (wireframe glow)
  // 0.25-0.5: Stage 1 (original textured model revealed)
  // 0.5-0.75: Stage 2 (holographic scan)
  // 0.75-1.0: Stage 3 (emissive bloom → fades to original)
  useFrame((state) => {
    if (!earthRef.current) return
    const t = state.clock.elapsedTime

    // Rotation
    earthRef.current.rotation.y += 0.003

    // Bigger scale: base 3.5, grows to 4.5
    const baseScale = 3.5
    const s = baseScale + scrollProgress * 1.0
    earthRef.current.scale.set(s, s, s)

    // Gentle float
    earthRef.current.position.y = Math.sin(t * 0.4) * 0.15

    // Update shader uniforms
    if (shaderRef1.current) shaderRef1.current.uTime = t
    if (shaderRef2.current) shaderRef2.current.uTime = t
    if (shaderRef3.current) shaderRef3.current.uTime = t

    // Stage transitions
    const stage = scrollProgress * 4 // 0 to 4

    clonedScene.traverse((child) => {
      if (!child.isMesh) return

      if (stage < 1) {
        // Stage 0: Wireframe glow
        if (shaderRef1.current) {
          child.material = shaderRef1.current
          child.material.transparent = true
          child.material.side = THREE.DoubleSide
        }
      } else if (stage < 2) {
        // Stage 1: Original textured with reveal
        const original = originalMaterials.current.get(child.uuid)
        if (original) {
          child.material = original
        }
      } else if (stage < 3) {
        // Stage 2: Holographic scan
        if (shaderRef2.current) {
          child.material = shaderRef2.current
          child.material.transparent = true
          child.material.side = THREE.DoubleSide
        }
      } else {
        // Stage 3: Emissive bloom
        if (shaderRef3.current) {
          child.material = shaderRef3.current
          child.material.transparent = true
          child.material.side = THREE.DoubleSide
        }
      }
    })
  })

  return (
    <group>
      {/* Hidden shader material instances */}
      <wireframeGlowMaterial ref={shaderRef1} transparent side={THREE.DoubleSide} />
      <hologramMaterial ref={shaderRef2} transparent side={THREE.DoubleSide} />
      <emissiveBloomMaterial ref={shaderRef3} transparent side={THREE.DoubleSide} />

      <primitive
        ref={earthRef}
        object={clonedScene}
        scale={3.5}
        position={[0, 0, 0]}
      />
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

/* ============ MAIN SCENE ============ */
function Scene({ scrollProgress }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[-5, -3, 5]} intensity={0.6} color="#667eea" />
      <pointLight position={[3, 5, -3]} intensity={0.4} color="#fabd2f" />
      <Stars radius={80} depth={60} count={1500} factor={3} fade speed={0.4} />
      <ParticleField scrollProgress={scrollProgress} />
      <Suspense fallback={<LoadingFallback />}>
        <EarthModel scrollProgress={scrollProgress} />
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
      label: 'Chapter I',
      title: 'It All Started With Games',
      text: 'From building 2D RPGs with massive open worlds to crafting futuristic racing experiences — I fell in love with creating digital worlds from scratch.'
    },
    {
      label: 'Chapter II',
      title: 'Then Came the Apps',
      text: 'I shifted to building Android apps that push boundaries — from GPU-accelerated Linux on mobile to kernel managers and CPU benchmarking tools.'
    },
    {
      label: 'Chapter III',
      title: 'Building for Everyone',
      text: 'Open source became my north star. Every project I build is for the community — free, transparent, and made to empower developers everywhere.'
    },
    {
      label: 'Chapter IV',
      title: 'Welcome to My World',
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
