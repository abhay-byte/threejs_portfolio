import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { useGLTF, shaderMaterial, OrbitControls, Environment, Float, Center } from '@react-three/drei'
import * as THREE from 'three'
import ImageLoader from './ImageLoader'

/* ============ CAR SHADER (Reused) ============ */
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

extend({ CarMetallicMaterial })

function RacingCar() {
    const { scene } = useGLTF('/models/car.glb')
    const carRef = useRef()
    const carShaderRef = useRef()
    const cloned = useMemo(() => scene.clone(true), [scene])

    useFrame((state) => {
        if (!carRef.current) return
        const t = state.clock.elapsedTime
        if (carShaderRef.current) {
            carShaderRef.current.uTime = t
            cloned.traverse((child) => {
                if (child.isMesh) {
                    child.material = carShaderRef.current
                    child.material.side = THREE.DoubleSide
                }
            })
        }
    })

    return (
        <group dispose={null}>
            <carMetallicMaterial ref={carShaderRef} />
            <primitive ref={carRef} object={cloned} />
        </group>
    )
}

function CarCanvas() {
    return (
        <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <Canvas camera={{ position: [5, 3, 10], fov: 45 }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <React.Suspense fallback={null}>
                    <Center>
                        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                            <RacingCar />
                        </Float>
                    </Center>
                    <Environment preset="city" />
                </React.Suspense>
                {/* Auto-rotate enabled, but user interaction disabled as it's a background */}
                <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} enablePan={false} enableRotate={false} />
            </Canvas>
        </div>
    )
}

const screenshots = [
    { src: '/images/fr-screenshot-1.jpg', alt: 'Gameplay Action' },
    { src: '/images/fr-screenshot-2.jpg', alt: 'Track Design' },
    { src: '/images/fr-screenshot-3.jpg', alt: 'Racing Mechanics' },
    { src: '/images/fr-screenshot-4.jpg', alt: 'Visual Effects' },
    { src: '/images/fr-screenshot-5.jpg', alt: 'Multiplayer Action' },
]

export default function FantasyRacing() {
    const sectionRef = useRef()

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    if (e.target.classList.contains('reveal')) {
                        if (e.isIntersecting) {
                            e.target.classList.add('visible')
                        }
                    }
                })
            },
            { threshold: 0.1 }
        )
        const reveals = sectionRef.current?.querySelectorAll('.reveal')
        reveals?.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    return (
        <section className="section" id="fantasy-racing" ref={sectionRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Background Car Layer */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                opacity: 0.2,
                pointerEvents: 'none'
            }}>
                <CarCanvas />
            </div>

            {/* Content Layer */}
            <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="section-header reveal">
                    <p className="section-label">Origin Story</p>
                    <h2 className="section-title">The Inspiration: Fantasy Racing</h2>
                    <div className="section-divider" />
                </div>

                <div className="fr-content reveal">
                    <div className="fr-description">
                        <h3>A High-Speed Neon Dream</h3>
                        <p>
                            The aesthetic of this portfolio is directly inspired by my game, <strong>Fantasy Racing</strong>.
                            It's a low-poly, anti-gravity racing game built with Unity, featuring vibrant neon visuals,
                            fluid vehicle physics, and a synth-wave soundtrack.
                        </p>
                        <p>
                            Developing this game taught me the fundamentals of 3D graphics, shader programming, and
                            game feel—skills I've translated into the web experiences I build today. The car model
                            floating in the background is the actual protagonist vehicle from the game!
                        </p>
                    </div>

                    <div className="fr-gallery">
                        {screenshots.map((shot, i) => (
                            <div key={i} className="fr-gallery-item">
                                <ImageLoader src={shot.src} alt={shot.alt} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
