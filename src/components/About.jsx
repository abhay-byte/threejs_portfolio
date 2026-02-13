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

/* ============ 3D FACE MODEL (with glitch shader) ============ */
function FaceBackground() {
    const { scene } = useGLTF('/models/hitem3d.glb')
    const groupRef = useRef()
    const materialsRef = useRef([])

    const clonedScene = useMemo(() => {
        const c = scene.clone(true)
        const mats = []
        c.traverse((child) => {
            if (child.isMesh && child.material) {
                const mat = child.material.clone()
                mat.userData.shader = null
                mat.onBeforeCompile = (shader) => {
                    shader.uniforms.uTime = { value: 0 }
                    shader.uniforms.uGlitchIntensity = { value: 0.0 }

                    // Inject uniform declarations
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <common>',
                        `#include <common>
                        uniform float uTime;
                        uniform float uGlitchIntensity;`
                    )

                    // Vertex glitch: horizontal slice displacement
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        `#include <begin_vertex>
                        float glitchSlice = step(0.93, fract(sin(floor(transformed.y * 6.0 + uTime * 4.0) * 43758.5453))) * uGlitchIntensity;
                        transformed.x += glitchSlice * 0.6;
                        transformed.z += glitchSlice * 0.2;`
                    )

                    // Fragment: RGB split + scanlines
                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <common>',
                        `#include <common>
                        uniform float uTime;
                        uniform float uGlitchIntensity;`
                    )

                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <dithering_fragment>',
                        `#include <dithering_fragment>
                        // RGB split — strong color separation
                        float rgbShift = uGlitchIntensity * 0.04;
                        gl_FragColor.r = gl_FragColor.r + rgbShift * sin(uTime * 25.0 + gl_FragCoord.y * 0.15);
                        gl_FragColor.b = gl_FragColor.b - rgbShift * cos(uTime * 18.0 + gl_FragCoord.y * 0.2);
                        gl_FragColor.g = gl_FragColor.g + rgbShift * 0.3 * sin(uTime * 30.0);

                        // Scanlines — visible bars
                        float scanline = sin(gl_FragCoord.y * 2.0 + uTime * 8.0) * 0.06 * uGlitchIntensity;
                        gl_FragColor.rgb -= scanline;

                        // Occasional bright flash
                        float flash = step(0.99, fract(sin(uTime * 2.3) * 43758.5453)) * uGlitchIntensity * 0.25;
                        gl_FragColor.rgb += flash;`
                    )

                    mat.userData.shader = shader
                }
                child.material = mat
                mats.push(mat)
            }
        })
        materialsRef.current = mats
        return c
    }, [scene])

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.elapsedTime

        groupRef.current.rotation.y += 0.003
        groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.05
        groupRef.current.position.y = Math.sin(t * 0.3) * 0.05

        // Periodic glitch bursts (high frequency, nearly always active)
        const glitchCycle = Math.sin(t * 2.5) * Math.sin(t * 3.7)
        const intensity = glitchCycle > 0.0 ? glitchCycle * 2.5 : 0.0

        materialsRef.current.forEach((mat) => {
            if (mat.userData.shader) {
                mat.userData.shader.uniforms.uTime.value = t
                mat.userData.shader.uniforms.uGlitchIntensity.value = intensity
            }
        })
    })

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <primitive object={clonedScene} scale={2.8} />
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
            <div className="about-layout">
                <div className="about-left">
                    <div className="section-header reveal">
                        <p className="section-label">About</p>
                        <h2 className="section-title">Who I Am</h2>
                        <div className="section-divider" />
                    </div>

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

                <div className="about-right reveal">
                    <div className="about-canvas">
                        <Canvas camera={{ position: [0, 1.5, 7], fov: 45 }} dpr={1}>
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[3, 3, 5]} intensity={1.0} color="#ffffff" />
                            <Suspense fallback={<FaceFallback />}>
                                <FaceBackground />
                            </Suspense>
                        </Canvas>
                    </div>
                </div>
            </div>
        </section>
    )
}

useGLTF.preload('/models/hitem3d.glb')
