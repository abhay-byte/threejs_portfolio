import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei'
import * as THREE from 'three'

/* ---- Particle Field ---- */
function ParticleField({ count = 500, scrollProgress }) {
  const mesh = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
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

/* ---- Morphing Blob ---- */
function MorphBlob({ scrollProgress }) {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.2
      ref.current.rotation.z = state.clock.elapsedTime * 0.15
      const s = 1 + scrollProgress * 0.5
      ref.current.scale.set(s, s, s)
    }
  })

  const color = useMemo(() => {
    return new THREE.Color('#fabd2f')
  }, [])

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.5}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.2, 12]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.15}
          metalness={0.9}
          distort={0.3 + scrollProgress * 0.2}
          speed={2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  )
}

/* ---- Orbit Ring ---- */
function OrbitRing({ radius = 2.5, scrollProgress }) {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
      ref.current.rotation.z = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.01, 16, 100]} />
      <meshBasicMaterial color="#fabd2f" transparent opacity={0.3 + scrollProgress * 0.2} />
    </mesh>
  )
}

/* ---- Connected Nodes ---- */
function ConnectedNodes({ scrollProgress }) {
  const groupRef = useRef()
  const nodePositions = useMemo(() => [
    [1.5, 1, 0], [-1.5, 0.5, 0.5], [0, -1.5, -0.5],
    [2, -0.5, 0.3], [-1, 1.5, -0.3], [0.5, 0, 1]
  ], [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
      const visibility = Math.max(0, (scrollProgress - 0.6) * 5)
      groupRef.current.children.forEach(c => {
        if (c.material) c.material.opacity = Math.min(visibility, 0.8)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#fabd2f" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

/* ---- Main Scene ---- */
function Scene({ scrollProgress }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#fabd2f" />
      <pointLight position={[-5, -5, 5]} intensity={0.4} color="#667eea" />
      <Stars radius={50} depth={50} count={1000} factor={3} fade speed={0.5} />
      <ParticleField scrollProgress={scrollProgress} />
      <MorphBlob scrollProgress={scrollProgress} />
      <OrbitRing scrollProgress={scrollProgress} />
      <ConnectedNodes scrollProgress={scrollProgress} />
    </>
  )
}

/* ---- IntroScene Component ---- */
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
      if (progress >= 0.98) {
        setIntroComplete(true)
        if (onComplete) onComplete()
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onComplete])

  /* Animate text blocks on scroll */
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
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]}>
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
