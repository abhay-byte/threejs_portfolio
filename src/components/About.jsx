import { useEffect, useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const skills = [
    'Android (Kotlin)', 'React', 'Three.js', 'Node.js', 'Flutter',
    'Unity / C#', 'Python', 'Linux / Shell', 'WebGL', 'Firebase',
    'Jetpack Compose', 'Git', 'Figma', 'GSAP', 'Docker'
]

const stats = [
    { number: '10+', label: 'Projects' },
    { number: '5+', label: 'Open Source' },
    { number: '2', label: 'F-Droid Apps' },
    { number: '∞', label: 'Curiosity' },
]

/* ============ 3D FACE MODEL (rotating background) ============ */
function FaceBackground() {
    const { scene } = useGLTF('/models/hitem3d.glb')
    const groupRef = useRef()
    const clonedScene = useMemo(() => {
        const c = scene.clone(true)
        c.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone()
                child.material.transparent = true
                child.material.opacity = 0.15
                child.material.depthWrite = false
            }
        })
        return c
    }, [scene])

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.003
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
        }
    })

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <primitive object={clonedScene} scale={3.0} />
        </group>
    )
}

function FaceFallback() {
    const ref = useRef()
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.2
        }
    })
    return (
        <mesh ref={ref}>
            <icosahedronGeometry args={[1.5, 2]} />
            <meshBasicMaterial color="#fabd2f" wireframe transparent opacity={0.05} />
        </mesh>
    )
}

export default function About() {
    const sectionRef = useRef()

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) e.target.classList.add('visible')
                })
            },
            { threshold: 0.15 }
        )
        const reveals = sectionRef.current?.querySelectorAll('.reveal')
        reveals?.forEach(el => observer.observe(el))
        return () => reveals?.forEach(el => observer.unobserve(el))
    }, [])

    return (
        <section className="section" id="about" ref={sectionRef}>
            {/* 3D face rotating in the background */}
            <div className="about-canvas">
                <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[3, 3, 5]} intensity={0.8} color="#ffffff" />
                    <pointLight position={[-3, -2, 4]} intensity={0.3} color="#fabd2f" />
                    <Suspense fallback={<FaceFallback />}>
                        <FaceBackground />
                    </Suspense>
                </Canvas>
            </div>

            <div className="section-header reveal">
                <p className="section-label">About</p>
                <h2 className="section-title">Who I Am</h2>
                <div className="section-divider" />
            </div>

            <div className="about-grid">
                <div className="about-text reveal">
                    <p>
                        I&apos;m <strong>Abhay Raj</strong>, an open source enthusiast and <strong>FOSS developer</strong>,
                        passionate about community-driven development and making software accessible for everyone.
                    </p>
                    <p>
                        From crafting immersive game worlds in Unity to building powerful Android tools like
                        <strong> FluxLinux</strong> (GPU-accelerated Linux on mobile) and <strong>FinalBenchmark</strong>
                        (comprehensive CPU benchmarking), I love pushing the boundaries of what&apos;s possible on every platform.
                    </p>
                    <p>
                        I believe in building in public, contributing to the open source ecosystem, and creating tools that
                        empower developers worldwide.
                    </p>

                    <div className="about-stats">
                        {stats.map((s, i) => (
                            <div className="stat-card" key={i}>
                                <div className="stat-number">{s.number}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="reveal">
                    <p className="section-label" style={{ marginBottom: 16 }}>Tech Stack</p>
                    <div className="skills-grid">
                        {skills.map((skill, i) => (
                            <span className="skill-tag" key={i}>{skill}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

useGLTF.preload('/models/hitem3d.glb')
