import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { sampleWorld, worldProgress, vehiclePositions } from './world-path.js'
import './world.css'

const green = '#245e50', sand = '#d9b66f', paper = '#f4f1e9'

function Block({ position, size, color = green, rotation }) {
  return <mesh position={position} rotation={rotation}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.85}/></mesh>
}

function Tree({ x, z, scale = 1 }) {
  return <group position={[x,-2.4,z]} scale={scale}>
    <Block position={[0,.7,0]} size={[.15,1.4,.15]} color="#775f42"/>
    <mesh position={[0,1.7,0]}><coneGeometry args={[.7,1.8,7]}/><meshStandardMaterial color={green}/></mesh>
  </group>
}

function Miniatures({bus,boat}) {
  return <>
    <Block position={[0,-2.65,-23]} size={[20,.5,70]} color={paper}/>
    <Block position={[0,-2.39,-16]} size={[2.8,.05,34]} color="#c3b898"/>
    {Array.from({length:14},(_,i)=><Block key={i} position={[0,-2.35,-i*2]} size={[.07,.02,.65]} color={paper}/>)}
    {[-2, -8, -13, -29, -34, -40, -49].flatMap((z,i)=>[-1,1].map(side=><Tree key={`${z}-${side}`} x={side*(4+i%2)} z={z} scale={.85+(i%3)*.15}/>))}
    <group ref={bus} position={[-.65,-1.65,-15]} rotation={[0,Math.PI,0]}>
      <Block position={[0,0,0]} size={[1.1,1.15,2.7]} color={sand}/>
      <Block position={[0,.27,1.36]} size={[.85,.46,.03]} color={green}/>
      {[-1,1].map(side=><group key={side}>
        <Block position={[side*.56,.25,0]} size={[.02,.43,1.9]} color={green}/>
        {[-.85,.85].map(z=><mesh key={z} position={[side*.52,-.48,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.24,.24,.16,12]}/><meshStandardMaterial color="#253b34"/></mesh>)}
      </group>)}
    </group>
    <Block position={[0,-2.28,-25]} size={[13,.12,7]} color="#8dbbb4"/>
    {[-4,-2,0,2,4].map(x=><Block key={x} position={[x,-2.2,-25.8]} size={[1,.025,.06]} color="#d8e9df"/>)}
    <group ref={boat} position={[-2,-1.95,-25]} rotation={[0,Math.PI/2,0]}>
      <mesh scale={[1, .35, 2.1]}><cylinderGeometry args={[1,.65,1,6]}/><meshStandardMaterial color={green}/></mesh>
      <Block position={[0,.4,0]} size={[1.2,.65,1.9]} color={paper}/>
      <Block position={[0,.82,-.25]} size={[.9,.25,.85]} color={sand}/>
      <Block position={[0,.5,1]} size={[.8,.25,.03]} color={green}/>
    </group>
    <group position={[0,-2.3,-47]}>
      <Block position={[0,0,0]} size={[9,.25,7]} color="#d2c3a5"/>
      <Block position={[0,2,-3.4]} size={[9,4,.2]} color="#e5dbc5"/>
      <Block position={[-4.4,1,0]} size={[.2,2,7]} color="#e5dbc5"/>
      <Block position={[0,2.2,-3.23]} size={[4,2,.08]} color={green}/>
      <Block position={[0,2.2,-3.16]} size={[2.8,.04,.025]} color={sand}/>
      <Block position={[0,1.8,-3.16]} size={[1.8,.04,.025]} color={paper}/>
      {[-2.3,2.3].flatMap(x=>[-.8,1.6].map(z=><group key={`${x}-${z}`} position={[x,0,z]}>
        <Block position={[0,1,0]} size={[1.8,.16,1]} color={sand}/>
        <Block position={[0,.5,0]} size={[.15,1,.15]} color={green}/>
        <Block position={[0,.5,.85]} size={[.85,.15,.7]} color={green}/>
        <Block position={[0,.9,1.15]} size={[.85,.8,.12]} color={green}/>
      </group>))}
    </group>
  </>
}

function Travel({ root, fail, bus, boat }) {
  const { invalidate, gl } = useThree()
  const progress = useRef(0)
  useEffect(()=>{
    let visible = true
    const measure = ()=>{
      const rect=root.getBoundingClientRect()
      progress.current=worldProgress(rect.top,rect.height,innerHeight)
      if(visible)invalidate()
    }
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;root.dataset.inView=String(visible);if(visible)measure()})
    observer.observe(root)
    const lost=event=>{event.preventDefault();fail()}
    gl.domElement.addEventListener('webglcontextlost',lost)
    window.addEventListener('scroll',measure,{passive:true})
    window.addEventListener('resize',measure)
    measure()
    return ()=>{observer.disconnect();window.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);gl.domElement.removeEventListener('webglcontextlost',lost)}
  },[root,gl,invalidate,fail])
  useFrame(({camera})=>{
    const sample=sampleWorld(progress.current,innerWidth<768)
    camera.position.set(...sample.position)
    camera.lookAt(...sample.look)
    const vehicles=vehiclePositions(progress.current)
    if(bus.current)bus.current.position.z=vehicles.busZ
    if(boat.current)boat.current.position.x=vehicles.boatX
    root.dataset.chapter=String(sample.chapter)
    root.style.setProperty('--world-progress',progress.current)
    root.querySelectorAll('[data-world-panel]').forEach((panel,index)=>{panel.inert=index!==sample.chapter;panel.setAttribute('aria-hidden',String(index!==sample.chapter))})
    root.querySelectorAll('[data-world-link]').forEach((link,index)=>{
      if(index===sample.chapter)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current')
    })
  })
  return null
}

export function World({ Gateway }) {
  const root=document.querySelector('[data-scroll-world]')
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce), (max-height: 600px)').matches)
  const [failed,setFailed]=useState(false)
  const [light,setLight]=useState(()=>{try{return localStorage.getItem('kkl_world_light')==='true'}catch{return false}})
  const bus=useRef(),boat=useRef()
  const fail=()=>setFailed(true)
  useEffect(()=>{
    const button=root.querySelector('[data-world-lite]')
    if(!button)return
    button.hidden=false
    button.disabled=reduced||failed
    button.setAttribute('aria-pressed',String(light||reduced||failed))
    button.textContent=reduced||failed?'Tampilan tanpa animasi':light?'Aktifkan tampilan 3D':'Tampilan ringan'
    const toggle=()=>{
      const link=root.querySelectorAll('[data-world-link]')[Number(root.dataset.chapter)||0]
      if(link)history.replaceState(null,'',link.hash)
      try{localStorage.setItem('kkl_world_light',String(!light))}catch{}
      setLight(!light)
    }
    button.addEventListener('click',toggle)
    return ()=>button.removeEventListener('click',toggle)
  },[light,reduced,failed,root])
  useEffect(()=>{
    const query=matchMedia('(prefers-reduced-motion: reduce), (max-height: 600px)')
    const update=()=>setReduced(query.matches)
    query.addEventListener('change',update)
    return ()=>query.removeEventListener('change',update)
  },[])
  useEffect(()=>{
    if(reduced||failed||light){
      root.classList.remove('world-enabled')
      root.dataset.state='fallback'
      root.querySelectorAll('[data-world-panel]').forEach(panel=>{panel.inert=false;panel.removeAttribute('aria-hidden')})
      root.querySelectorAll('[data-world-link]').forEach(link=>link.removeAttribute('aria-current'))
      requestAnimationFrame(()=>window.dispatchEvent(new Event('world-ready')))
    }
    return ()=>{
      root.classList.remove('world-enabled')
      root.querySelectorAll('[data-world-panel]').forEach(panel=>{panel.inert=false;panel.removeAttribute('aria-hidden')})
    }
  },[reduced,failed,light,root])
  useEffect(()=>{
    const navigate=(focus=false)=>{
      const links=[...root.querySelectorAll('[data-world-link]')]
      const index=links.findIndex(link=>link.hash===location.hash)
      if(index<0)return
      const panel=document.getElementById(links[index].hash.slice(1))
      if(root.classList.contains('world-enabled')){
        const progress=[0,.48,.87][index]
        window.scrollTo({top:scrollY+root.getBoundingClientRect().top+progress*(root.offsetHeight-innerHeight),behavior:'instant'})
      }else panel.scrollIntoView({behavior:'instant'})
      if(focus)requestAnimationFrame(()=>requestAnimationFrame(()=>panel.querySelector('h1,h2')?.focus({preventScroll:true})))
    }
    const jump=event=>{
      const link=event.target.closest('[data-world-link]')
      if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return
      event.preventDefault()
      if(location.hash!==link.hash)history.pushState(null,'',link.hash)
      navigate(true)
    }
    const restore=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>navigate()))
    root.addEventListener('click',jump)
    window.addEventListener('hashchange',restore)
    window.addEventListener('popstate',restore)
    window.addEventListener('world-ready',restore)
    window.addEventListener('load',restore)
    return ()=>{root.removeEventListener('click',jump);window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore);window.removeEventListener('world-ready',restore);window.removeEventListener('load',restore)}
  },[root])
  if(reduced||failed||light)return null
  const ready=()=>{root.classList.add('world-enabled');root.dataset.state='ready';window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('world-ready'))}
  return <Canvas frameloop="demand" dpr={[1,1.35]} camera={{position:[5,1,11.8],fov:48}} gl={{antialias:true,alpha:false}} fallback={null}>
    <color attach="background" args={[paper]}/>
    <fog attach="fog" args={[paper,25,65]}/>
    <hemisphereLight args={['#fff3d8','#8aab98',2]}/>
    <directionalLight position={[8,15,8]} intensity={3} color="#fff1d4"/>
    <Suspense fallback={null}><Gateway onPaint={ready}/></Suspense>
    <Miniatures bus={bus} boat={boat}/>
    <Travel root={root} fail={fail} bus={bus} boat={boat}/>
  </Canvas>
}
