import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'

function FloatingGeometry() {
    const meshRef = useRef()

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.15
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
        }
    })

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
            <mesh ref={meshRef}>
                <torusKnotGeometry args={[0.8, 0.3, 128, 32]} />
                <MeshDistortMaterial
                    color="#fabd2f"
                    roughness={0.2}
                    metalness={0.8}
                    distort={0.15}
                    speed={1.5}
                    transparent
                    opacity={0.15}
                />
            </mesh>
        </Float>
    )
}

export default function HeroCanvas() {
    return (
        <div className="hero-canvas">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.3} />
                <pointLight position={[3, 3, 3]} intensity={0.6} color="#fabd2f" />
                <FloatingGeometry />
            </Canvas>
        </div>
    )
}
