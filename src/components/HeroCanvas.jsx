import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { Float, useGLTF, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

/* ============ IRIDESCENT OIL-SLICK SHADER ============ */
const IridescentMaterial = shaderMaterial(
    {
        uTime: 0,
        uFresnelPower: 3.0,
        uRainbowStrength: 1.0,
        uSpecularPower: 40.0,
        uLightPos: new THREE.Vector3(3, 3, 5),
    },
    // vertex
    `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vPosition = position;
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
    // fragment
    `
    uniform float uTime;
    uniform float uFresnelPower;
    uniform float uRainbowStrength;
    uniform float uSpecularPower;
    uniform vec3 uLightPos;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vUv;

    // Gruvbox-tuned thin-film iridescence
    vec3 iridescence(float cosTheta, float thickness) {
      float delta = thickness * cosTheta;
      // Warm amber / coral / muted purple palette
      vec3 color;
      color.r = 0.6 + 0.4 * cos(6.2831 * (delta * 0.8 + 0.0));
      color.g = 0.35 + 0.35 * cos(6.2831 * (delta * 0.8 + 0.15));
      color.b = 0.15 + 0.25 * cos(6.2831 * (delta * 0.8 + 0.45));
      return color;
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewDir);
      vec3 lightDir = normalize(uLightPos - vWorldPosition);

      // Fresnel
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);

      // Animated thin-film thickness
      float thickness = 2.0 + sin(uTime * 0.5 + vPosition.x * 3.0) * 0.5
                            + sin(uTime * 0.3 + vPosition.y * 4.0) * 0.3
                            + sin(uTime * 0.7 + vPosition.z * 2.0) * 0.4;

      // Iridescent color from thin-film
      float cosTheta = max(dot(normal, viewDir), 0.0);
      vec3 iriColor = iridescence(cosTheta, thickness) * uRainbowStrength;

      // Specular highlight — warm amber tint
      vec3 halfVec = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfVec), 0.0), uSpecularPower);

      // Diffuse
      float diffuse = max(dot(normal, lightDir), 0.0);

      // Base: warm dark amber surface
      vec3 baseColor = vec3(0.06, 0.04, 0.02);

      // Combine: warm base + iridescent shimmer + amber specular
      vec3 finalColor = baseColor * (0.3 + diffuse * 0.5)
                      + iriColor * (fresnel * 0.7 + 0.25)
                      + vec3(0.98, 0.74, 0.18) * spec * 1.2;

      // Edge glow — warm amber/coral
      finalColor += vec3(0.98, 0.42, 0.42) * fresnel * 0.25;
      finalColor += vec3(0.98, 0.74, 0.18) * fresnel * 0.15;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)

extend({ IridescentMaterial })

/* ============ PLANET WITH IRIDESCENT SHADER ============ */
function PlanetModel() {
    const { scene } = useGLTF('/models/planets.glb')
    const groupRef = useRef()
    const shaderRef = useRef()
    const clonedScene = useMemo(() => scene.clone(true), [scene])

    // Apply iridescent material to all meshes
    useMemo(() => {
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({ color: '#111' })
            }
        })
    }, [clonedScene])

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.004
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.12
        }
        if (shaderRef.current) {
            shaderRef.current.uTime = state.clock.elapsedTime
        }

        // Apply the iridescent shader to all meshes each frame
        if (shaderRef.current) {
            clonedScene.traverse((child) => {
                if (child.isMesh) {
                    child.material = shaderRef.current
                    child.material.side = THREE.DoubleSide
                }
            })
        }
    })

    return (
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.6}>
            <group ref={groupRef}>
                <iridescentMaterial ref={shaderRef} />
                <primitive object={clonedScene} scale={2.0} />
            </group>
        </Float>
    )
}

function FallbackGeometry() {
    const ref = useRef()
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.x = state.clock.elapsedTime * 0.15
            ref.current.rotation.y = state.clock.elapsedTime * 0.1
        }
    })
    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
            <mesh ref={ref}>
                <torusKnotGeometry args={[0.8, 0.3, 128, 32]} />
                <meshStandardMaterial color="#fabd2f" roughness={0.2} metalness={0.8} transparent opacity={0.15} />
            </mesh>
        </Float>
    )
}

export default function HeroCanvas() {
    return (
        <div className="hero-canvas">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.3} />
                <directionalLight position={[3, 3, 5]} intensity={1.5} color="#ffffff" />
                <pointLight position={[-4, -2, 3]} intensity={0.5} color="#667eea" />
                <pointLight position={[2, 4, -2]} intensity={0.4} color="#fabd2f" />
                <pointLight position={[0, -3, 4]} intensity={0.3} color="#ff6b6b" />
                <Suspense fallback={<FallbackGeometry />}>
                    <PlanetModel />
                </Suspense>
            </Canvas>
        </div>
    )
}

useGLTF.preload('/models/planets.glb')
