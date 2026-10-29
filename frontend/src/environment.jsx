import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

const PAPER = '#f4f1e9'
const GROUND_Y = -2.44
const PATH_Y = -2.43
const SHADOW_Y = -2.425

function shadowTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size * 0.5)
  gradient.addColorStop(0, 'rgba(16, 58, 50, 0.28)')
  gradient.addColorStop(0.55, 'rgba(16, 58, 50, 0.12)')
  gradient.addColorStop(1, 'rgba(16, 58, 50, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function pathTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const alpha = ctx.createLinearGradient(0, 0, 0, size)
  alpha.addColorStop(0, 'rgba(207, 196, 173, 0)')
  alpha.addColorStop(.16, 'rgba(207, 196, 173, .44)')
  alpha.addColorStop(.78, 'rgba(207, 196, 173, .44)')
  alpha.addColorStop(1, 'rgba(207, 196, 173, 0)')
  ctx.fillStyle = alpha
  for (let y = 0; y < size; y += 1) {
    const t = y / (size - 1)
    const half = size * (.16 + t * .3)
    const feather = size * .08
    const gradient = ctx.createLinearGradient(size / 2 - half - feather, 0, size / 2 + half + feather, 0)
    gradient.addColorStop(0, 'rgba(207, 196, 173, 0)')
    gradient.addColorStop(feather / (half * 2 + feather * 2), 'rgba(207, 196, 173, .44)')
    gradient.addColorStop(1 - feather / (half * 2 + feather * 2), 'rgba(207, 196, 173, .44)')
    gradient.addColorStop(1, 'rgba(207, 196, 173, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(size / 2 - half - feather, y, half * 2 + feather * 2, 1)
  }
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = alpha
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function Environment() {
  const shadow = useMemo(() => shadowTexture(), [])
  const path = useMemo(() => pathTexture(), [])

  useEffect(() => () => {
    shadow.dispose()
    path.dispose()
  }, [shadow, path])

  return (
    <group>
      <mesh position={[0, GROUND_Y, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>
      <mesh position={[0, PATH_Y, -26]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 52]} />
        <meshBasicMaterial map={path} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0.15, SHADOW_Y, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.0, 6.0]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
