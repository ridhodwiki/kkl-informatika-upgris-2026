import { StrictMode, Component, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MeshoptDecoder } from '../node_modules/meshoptimizer/meshopt_decoder_reference.js'
import { pinProgress, segmentProgress } from './progress.js'
import { CAMERA_PATHS, samplePath, smoothstep } from './camera-path.js'
import { Environment } from './environment.jsx'
import './style.css'
import { initJourney } from './journey/bootstrap.js'
import { mountScene3 } from './learning/index.js'
import './navbar.css'

const container = document.getElementById('hero-3d-root')
const MODEL_URL = container?.dataset.modelUrl || '/assets/models/candi-bentar.glb'
const isMobile = () => window.innerWidth <= 850

function setHeroState(state) {
  const hero = document.getElementById('beranda')
  if (hero) {
    hero.dataset.diorama = state
    if (state === 'fallback') {
      hero.style.removeProperty('--diorama-progress')
    }
  }
}

function Gateway({ onPaint }) {
  const { scene } = useGLTF(MODEL_URL, false, false, (loader) => loader.setMeshoptDecoder(MeshoptDecoder))
  const { gl, invalidate } = useThree()
  const painted = useRef(false)
  const firstFrame = useRef(null)

  const { model, scale, offset, bounds } = useMemo(() => {
    const model = scene.clone(true)
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = 4.8 / size.y

    model.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })

    return {
      model,
      scale,
      offset: center.multiplyScalar(-scale),
      bounds: { size: size.multiplyScalar(scale).toArray(), center: [0, 0, 0] },
    }
  }, [scene])

  useFrame(() => {
    if (painted.current) return
    if (firstFrame.current === null) {
      firstFrame.current = gl.info.render.frame
      invalidate()
      return
    }
    if (gl.info.render.frame <= firstFrame.current) {
      invalidate()
      return
    }
    painted.current = true
    window.__DIORAMA_METRICS__ = {
      ...window.__DIORAMA_METRICS__,
      bounds,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      paintedAt: performance.now(),
    }
    onPaint()
  })

  return <group position={offset} scale={scale}><primitive object={model} /></group>
}

function CameraJourney({ progressRef, activeRef }) {
  const camera = useThree((state) => state.camera)
  const { invalidate, gl } = useThree()
  const currentPosition = useRef(new THREE.Vector3(...CAMERA_PATHS[isMobile() ? 'mobile' : 'desktop'].position[0]))
  const currentTarget = useRef(new THREE.Vector3(...CAMERA_PATHS[isMobile() ? 'mobile' : 'desktop'].look[0]))
  const targetPosition = useMemo(() => new THREE.Vector3(), [])
  const targetLook = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const progress = progressRef.current
    const sample = samplePath(progress, isMobile() ? 'mobile' : 'desktop')
    targetPosition.set(...sample.position)
    targetLook.set(...sample.look)

    const damping = 1 - Math.exp(-6 * delta)
    currentPosition.current.lerp(targetPosition, damping)
    currentTarget.current.lerp(targetLook, damping)

    camera.position.copy(currentPosition.current)
    camera.lookAt(currentTarget.current)

    const endZ = CAMERA_PATHS[isMobile() ? 'mobile' : 'desktop'].position.at(-1)[2]
    const journeyProgress = smoothstep((progress - 0.35) / 0.45)
    const dissolveProgress = Math.min(Math.max((currentPosition.current.z + 1.0) / (endZ + 1.0), 0), 1)
    const hero = document.getElementById('beranda')
    if (hero) {
      hero.style.setProperty('--diorama-progress', journeyProgress.toFixed(4))
      hero.style.setProperty('--diorama-dissolve', smoothstep(dissolveProgress).toFixed(4))
    }

    window.__DIORAMA_METRICS__ = {
      ...window.__DIORAMA_METRICS__,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      camera: camera.position.toArray(),
      look: currentTarget.current.toArray(),
    }

    const unsettled =
      camera.position.distanceToSquared(targetPosition) > 0.0001 ||
      currentTarget.current.distanceToSquared(targetLook) > 0.0001

    if (activeRef.current && unsettled) invalidate()
  })

  return null
}

function ScrollController({ progressRef, activeRef }) {
  const { invalidate } = useThree()

  useEffect(() => {
    const hero = document.getElementById('beranda')
    const about = document.getElementById('tentang')
    if (!hero || !about) return undefined

    const stage = hero.closest('.hero-stage')
    const header = document.querySelector('.site-header')
    let start = 0
    let end = 1
    let frame = 0

    const measureGeometry = () => {
      const headerH = header?.offsetHeight ?? 76
      document.documentElement.style.setProperty('--hero-sticky-top', `${headerH}px`)
      if (stage && about) {
        start = stage.getBoundingClientRect().top + window.scrollY - headerH
        const aboutTop = about.getBoundingClientRect().top + window.scrollY
        end = Math.max(start + stage.offsetHeight - hero.offsetHeight, aboutTop - headerH)
      }
    }

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        progressRef.current = stage
          ? pinProgress(window.scrollY, start, end)
          : segmentProgress(hero.getBoundingClientRect(), about.getBoundingClientRect())
        window.__DIORAMA_METRICS__ = {
          ...window.__DIORAMA_METRICS__,
          progress: progressRef.current,
        }
        if (activeRef.current) invalidate()
      })
    }

    const measure = () => {
      measureGeometry()
      update()
    }

    const observer = new ResizeObserver(measure)
    observer.observe(hero)
    observer.observe(about)
    if (stage) observer.observe(stage)
    if (header) observer.observe(header)

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    document.fonts?.ready.then(measure)
    document.querySelectorAll('img').forEach((image) => image.addEventListener('load', measure, { once: true }))
    measure()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', measure)
    }
  }, [invalidate, progressRef, activeRef])

  return null
}

function RendererGuard({ onFail }) {
  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const handleContextLost = (event) => {
      event.preventDefault()
      onFail()
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost)
  }, [gl, onFail])

  return null
}

class RenderBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFail()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function Diorama() {
  const progressRef = useRef(0)
  const activeRef = useRef(true)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [failed, setFailed] = useState(false)

  const fallback = () => {
    setHeroState('fallback')
    setFailed(true)
  }

  const painted = () => {
    const wrap = document.querySelector('.diorama-canvas-wrap')
    if (wrap) wrap.setAttribute('data-ready', 'true')
    setHeroState('active')
  }

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    const hero = document.getElementById('beranda')
    if (!hero || reduced || failed) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      activeRef.current = entry.isIntersecting
    }, { rootMargin: '120px 0px' })

    observer.observe(hero)
    return () => observer.disconnect()
  }, [reduced, failed])

  useEffect(() => {
    if (reduced || failed) setHeroState('fallback')
  }, [reduced, failed])

  useEffect(() => {
    return () => {
      const hero = document.getElementById('beranda')
      if (hero) {
        hero.style.removeProperty('--diorama-progress')
        hero.style.removeProperty('--diorama-dissolve')
      }
    }
  }, [])

  if (reduced || failed) return null

  return (
    <div className="diorama-canvas-wrap" data-ready="false" aria-hidden="true">
      <Canvas
        camera={{ position: CAMERA_PATHS[isMobile() ? 'mobile' : 'desktop'].position[0], fov: 38 }}
        dpr={[1, 1.35]}
        frameloop="demand"
        flat
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        fallback={<span />}
      >
        <fog attach="fog" args={['#f4f1e9', 11, 110]} />
        <hemisphereLight args={['#f7ead0', '#cbbfa6', 1.9]} />
        <directionalLight position={[-4, 7, 5]} intensity={2.8} color="#fff0cf" />
        <directionalLight position={[5, 3, -6]} intensity={0.8} color="#e3ece6" />
        <directionalLight position={[6, 4, 10]} intensity={0.9} color="#f4ead6" />
        <RendererGuard onFail={fallback} />
        <ScrollController progressRef={progressRef} activeRef={activeRef} />
        <CameraJourney progressRef={progressRef} activeRef={activeRef} />
        <Environment />
        <Gateway onPaint={painted} />
      </Canvas>
    </div>
  )
}

// Both functions guard against duplicate insertion and require #timeline to be
// present. They run synchronously at module evaluation time — the DOM is fully
// parsed before this deferred script executes, so there is no insertion race.
initJourney()
mountScene3()

if (container) {
  createRoot(container).render(
    <StrictMode>
      <RenderBoundary onFail={() => setHeroState('fallback')}>
        <Diorama />
      </RenderBoundary>
    </StrictMode>
  )
}
