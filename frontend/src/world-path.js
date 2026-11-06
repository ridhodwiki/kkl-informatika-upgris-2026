import { smoothstep } from './camera-path.js'

export const WORLD_STOPS = [0, .17, .29, .43, .58, .73, .87, 1]
const positions = [[5,1,11.8],[0,1,4],[0,.85,-3.4],[6,8,-10],[8,9,-19],[7,7,-30],[5,4,-37],[3,3,-40]]
const targets = [[0,.1,0],[0,.7,-3],[0,.85,-8.5],[0,-1,-20],[0,-1,-25],[0,-.5,-40],[0,0,-46],[0,0,-47]]

export function worldProgress(top, height, viewport) {
  return Math.min(1, Math.max(0, -top / Math.max(1, height - viewport)))
}

export function sampleWorld(value, mobile = false) {
  const progress = Math.min(1, Math.max(0, value))
  let index = WORLD_STOPS.findIndex((stop, i) => i < WORLD_STOPS.length - 1 && progress <= WORLD_STOPS[i + 1])
  if (index < 0) index = WORLD_STOPS.length - 2
  const t = smoothstep((progress - WORLD_STOPS[index]) / (WORLD_STOPS[index + 1] - WORLD_STOPS[index]))
  const blend = points => points[index].map((v, axis) => v + (points[index + 1][axis] - v) * t)
  const position = blend(positions)
  if (mobile) position[0] *= .55
  return { position, look: blend(targets), chapter: progress < .34 ? 0 : progress < .73 ? 1 : 2 }
}
