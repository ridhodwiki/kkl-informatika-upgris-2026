import { smoothstep, tangents, hermite } from './camera-path.js'

export const WORLD_STOPS = [0, .17, .29, .43, .58, .73, .87, 1]
const positions = [[5,1,11.8],[0,1,4],[0,.85,-3.4],[6,8,-10],[8,9,-19],[7,7,-30],[5,4,-37],[3,3,-40]]
const targets = [[0,.1,0],[0,.7,-3],[0,.85,-8.5],[0,-1,-20],[0,-1,-25],[0,-.5,-40],[0,0,-46],[0,0,-47]]
const curves = [positions,targets].map(points=>[0,1,2].map(axis=>{
  const values=points.map(point=>point[axis])
  return {values,slopes:tangents(values,WORLD_STOPS)}
}))

export function vehiclePositions(progress) {
  return {busZ:-15-4*smoothstep((progress-.3)/.25),boatX:-2+4*smoothstep((progress-.45)/.25)}
}

export function worldProgress(top, height, viewport) {
  return Math.min(1, Math.max(0, -top / Math.max(1, height - viewport)))
}

export function sampleWorld(value, mobile = false) {
  const progress = Math.min(1, Math.max(0, value))
  let index = WORLD_STOPS.findIndex((stop, i) => i < WORLD_STOPS.length - 1 && progress <= WORLD_STOPS[i + 1])
  if (index < 0) index = WORLD_STOPS.length - 2
  const h = WORLD_STOPS[index + 1] - WORLD_STOPS[index]
  const t = (progress - WORLD_STOPS[index]) / h
  const blend = axes => axes.map(axis=>hermite(axis,index,t,h))
  const position = blend(curves[0])
  if (mobile) position[0] *= .55
  return { position, look: blend(curves[1]), chapter: progress < .34 ? 0 : progress < .73 ? 1 : 2 }
}
