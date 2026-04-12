import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  createRosePetalTexture,
  createPollenTexture,
  createWisteriaPetalTexture,
  createDetailedRoseTexture,
} from '../../utils/botanicalTextures'
import useWindowSize from '../../hooks/useWindowSize'

// ─── Petal particle system ────────────────────────────────────────────────────

const PETAL_GROUPS = [
  { rgba: 'rgba(232,180,184,0.80)', sizeMult: 1.00, speedBase: 0.004, spreadZ: 3.5 },
  { rgba: 'rgba(196,126,133,0.70)', sizeMult: 0.82, speedBase: 0.005, spreadZ: 2.5 },
  { rgba: 'rgba(248,243,236,0.45)', sizeMult: 0.70, speedBase: 0.003, spreadZ: 1.5 },
]

function FloatingPetals({ count }) {
  const refs = useRef([null, null, null])

  const groups = useMemo(() => {
    return PETAL_GROUPS.map(({ rgba, sizeMult, speedBase, spreadZ }) => {
      const n = Math.floor(count / 3)
      const positions  = new Float32Array(n * 3)
      const speeds     = new Float32Array(n)
      const swayAmps   = new Float32Array(n)
      const swayOffset = new Float32Array(n)

      for (let i = 0; i < n; i++) {
        positions[i*3+0] = (Math.random() - 0.5) * 14
        positions[i*3+1] = (Math.random() - 0.5) * 8
        positions[i*3+2] = (Math.random() - 0.5) * spreadZ - 1
        speeds[i]     = speedBase + Math.random() * speedBase * 1.5
        swayAmps[i]   = 0.002 + Math.random() * 0.004
        swayOffset[i] = Math.random() * Math.PI * 2
      }
      return { n, positions, speeds, swayAmps, swayOffset, sizeMult }
    })
  }, [count])

  const textures = useMemo(
    () => PETAL_GROUPS.map(({ rgba }) => createRosePetalTexture(rgba)),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    groups.forEach((g, gi) => {
      const mesh = refs.current[gi]
      if (!mesh) return
      const pos = mesh.geometry.attributes.position.array
      for (let i = 0; i < g.n; i++) {
        pos[i*3+1] += g.speeds[i]
        pos[i*3+0] += Math.sin(t * 0.4 + g.swayOffset[i]) * g.swayAmps[i]
        if (pos[i*3+1] > 5) {
          pos[i*3+1] = -5
          pos[i*3+0] = (Math.random() - 0.5) * 14
        }
      }
      mesh.geometry.attributes.position.needsUpdate = true
    })
  })

  return (
    <>
      {groups.map((g, gi) => (
        <points key={gi} ref={(el) => (refs.current[gi] = el)}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={g.positions}
              count={g.n}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            map={textures[gi]}
            size={0.14 * g.sizeMult}
            transparent
            alphaTest={0.01}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      ))}
    </>
  )
}

// ─── Pollen / bokeh system ────────────────────────────────────────────────────

function PollenParticles({ count }) {
  const meshRef = useRef(null)

  const { positions, speeds, swayAmps, swayOffset } = useMemo(() => {
    const positions  = new Float32Array(count * 3)
    const speeds     = new Float32Array(count)
    const swayAmps   = new Float32Array(count)
    const swayOffset = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i*3+0] = (Math.random() - 0.5) * 16
      positions[i*3+1] = (Math.random() - 0.5) * 8
      positions[i*3+2] = (Math.random() - 0.5) * 4 - 2
      speeds[i]     = 0.0008 + Math.random() * 0.002
      swayAmps[i]   = 0.001 + Math.random() * 0.003
      swayOffset[i] = Math.random() * Math.PI * 2
    }
    return { positions, speeds, swayAmps, swayOffset }
  }, [count])

  const texture = useMemo(() => createPollenTexture(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t   = clock.elapsedTime
    const pos = mesh.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i*3+1] += speeds[i]
      pos[i*3+0] += Math.sin(t * 0.3 + swayOffset[i]) * swayAmps[i]
      if (pos[i*3+1] > 5) {
        pos[i*3+1] = -5
        pos[i*3+0] = (Math.random() - 0.5) * 16
      }
    }
    mesh.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.06}
        transparent
        alphaTest={0.005}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        opacity={0.75}
      />
    </points>
  )
}

// ─── Wisteria petals ──────────────────────────────────────────────────────────

function WisteriaPetals({ count }) {
  const meshRef = useRef(null)

  const { positions, speeds, swayAmps, swayOffset } = useMemo(() => {
    const positions  = new Float32Array(count * 3)
    const speeds     = new Float32Array(count)
    const swayAmps   = new Float32Array(count)
    const swayOffset = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i*3+0] = (Math.random() - 0.5) * 14
      positions[i*3+1] = (Math.random() - 0.5) * 8
      positions[i*3+2] = (Math.random() - 0.5) * 2 - 3
      speeds[i]     = 0.006 + Math.random() * 0.006
      swayAmps[i]   = 0.003 + Math.random() * 0.005
      swayOffset[i] = Math.random() * Math.PI * 2
    }
    return { positions, speeds, swayAmps, swayOffset }
  }, [count])

  const texture = useMemo(() => createWisteriaPetalTexture(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t   = clock.elapsedTime
    const pos = mesh.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i*3+1] += speeds[i]
      pos[i*3+0] += Math.sin(t * 0.5 + swayOffset[i]) * swayAmps[i]
      if (pos[i*3+1] > 5) {
        pos[i*3+1] = -5
        pos[i*3+0] = (Math.random() - 0.5) * 14
      }
    }
    mesh.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.10}
        transparent
        alphaTest={0.01}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Foreground rose sprite ───────────────────────────────────────────────────

function ForegroundRose({ isMobile }) {
  const spriteRef = useRef(null)
  const texture = useMemo(() => createDetailedRoseTexture(), [])
  const pos   = isMobile ? [1.2, -1.0, 1.0] : [2.2, -0.5, 1.0]
  const scale = isMobile ? 1.0 : 1.6

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!spriteRef.current) return
    spriteRef.current.position.y = pos[1] + Math.sin(t * 0.28) * 0.18
    spriteRef.current.material.rotation = t * 0.06
  })

  return (
    <sprite ref={spriteRef} position={pos} scale={[scale, scale, 1]}>
      <spriteMaterial map={texture} transparent alphaTest={0.01} depthWrite={false} opacity={0.82} />
    </sprite>
  )
}

// ─── Secondary rose sprite (left) ────────────────────────────────────────────

function SecondaryRose({ isMobile }) {
  const spriteRef = useRef(null)
  const texture = useMemo(() => createDetailedRoseTexture(), [])
  const pos   = isMobile ? [-1.2, -1.4, 0.5] : [-2.6, -1.2, 0.5]
  const scale = isMobile ? 0.75 : 1.1

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!spriteRef.current) return
    spriteRef.current.position.y = pos[1] + Math.sin(t * 0.22 + 1.4) * 0.14
    spriteRef.current.material.rotation = -t * 0.04
  })

  return (
    <sprite ref={spriteRef} position={pos} scale={[scale, scale, 1]}>
      <spriteMaterial map={texture} transparent alphaTest={0.01} depthWrite={false} opacity={0.6} />
    </sprite>
  )
}

// ─── Scene root ───────────────────────────────────────────────────────────────

function Scene({ isMobile }) {
  const petalCount    = isMobile ?  40 : 120
  const wisteriaCount = isMobile ?  15 :  45
  const pollenCount   = isMobile ?   0 :  60  // AdditiveBlending is GPU-expensive; skip on mobile

  return (
    <>
      {/* Garden lighting */}
      <ambientLight intensity={0.5} color="#C8D8C0" />
      <directionalLight position={[3, 5, 2]} intensity={1.8} color="#FFF5E8" />
      <pointLight position={[-4, 2, 1]} intensity={0.9} color="#E8B4B8" />
      <hemisphereLight skyColor="#D4DCCC" groundColor="#3A5030" intensity={0.4} />

      <FloatingPetals  count={petalCount} />
      {pollenCount > 0 && <PollenParticles count={pollenCount} />}
      <WisteriaPetals  count={wisteriaCount} />
      <ForegroundRose isMobile={isMobile} />
      <SecondaryRose  isMobile={isMobile} />
    </>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function GardenScene() {
  const { width } = useWindowSize()
  const isMobile  = width < 768

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Canvas
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
      camera={{ fov: 52, position: [0, 0.5, 6], near: 0.1, far: 120 }}
      dpr={isMobile ? [1, 1] : [1, 2]}
      performance={{ min: 0.5 }}
      frameloop={prefersReducedMotion ? 'never' : 'always'}
      aria-hidden="true"
    >
      <Scene key={isMobile ? 'mobile' : 'desktop'} isMobile={isMobile} />
    </Canvas>
  )
}
