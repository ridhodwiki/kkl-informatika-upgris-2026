import { Component, Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'

class AssetBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Model({ name }) {
  const { scene } = useGLTF(`assets/models/kkl-${name}.glb`, false, false)
  const model = useMemo(() => scene.clone(true), [scene])
  return <primitive object={model} dispose={null}/>
}

export function Vehicle({ name, children }) {
  return <AssetBoundary fallback={children}>
    <Suspense fallback={children}><Model name={name}/></Suspense>
  </AssetBoundary>
}
