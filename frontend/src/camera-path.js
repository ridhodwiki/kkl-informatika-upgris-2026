export const CHECKPOINTS = [0, 0.32, 0.55, 0.72, 0.85, 1.0]

export const CAMERA_PATHS = {
  desktop: {
    position: [
      [5.0, 1.0, 11.8],
      [4.4, 1.25, 11.4],
      [2.5, 1.35, 10.3],
      [0, 1.0, 5.0],
      [0, 0.88, 0.4],
      [0, 0.85, -3.4],
    ],
    look: [
      [0.2, 0.05, 0],
      [0.1, 0.06, -0.3],
      [0.05, 0.25, -1.2],
      [0, 0.62, -3.2],
      [0, 0.85, -5.0],
      [0, 0.85, -8.5],
    ],
  },
  mobile: {
    position: [
      [0.8, 1.0, 11.8],
      [0.55, 1.15, 11.4],
      [0.25, 1.25, 10.7],
      [0, 0.98, 5.6],
      [0, 0.88, 0.6],
      [0, 0.85, -2.8],
    ],
    look: [
      [0, 0.05, 0],
      [0, 0.06, -0.3],
      [0, 0.2, -1.0],
      [0, 0.6, -3.0],
      [0, 0.85, -4.5],
      [0, 0.85, -7.5],
    ],
  },
}

export function smoothstep(t) {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * (3 - 2 * x)
}

function tangents(values) {
  const n = values.length
  const slopes = []
  for (let i = 0; i < n - 1; i += 1) slopes.push((values[i + 1] - values[i]) / (CHECKPOINTS[i + 1] - CHECKPOINTS[i]))
  const result = [0]
  for (let i = 1; i < n - 1; i += 1) {
    const a = slopes[i - 1]
    const b = slopes[i]
    if (a === 0 || b === 0 || Math.sign(a) !== Math.sign(b)) {
      result.push(0)
      continue
    }
    const w1 = 2 * (CHECKPOINTS[i + 1] - CHECKPOINTS[i]) + (CHECKPOINTS[i] - CHECKPOINTS[i - 1])
    const w2 = (CHECKPOINTS[i + 1] - CHECKPOINTS[i]) + 2 * (CHECKPOINTS[i] - CHECKPOINTS[i - 1])
    result.push((w1 + w2) / (w1 / a + w2 / b))
  }
  result.push(0)
  return result
}

const cache = new Map()
function curves(track) {
  if (!cache.has(track)) {
    const points = CAMERA_PATHS[track]
    const axes = (list) => [0, 1, 2].map((axis) => {
      const values = list.map((point) => point[axis])
      return { values, slopes: tangents(values) }
    })
    cache.set(track, { position: axes(points.position), look: axes(points.look) })
  }
  return cache.get(track)
}

function hermite({ values, slopes }, segment, t, h) {
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * values[segment]
    + (t3 - 2 * t2 + t) * h * slopes[segment]
    + (-2 * t3 + 3 * t2) * values[segment + 1]
    + (t3 - t2) * h * slopes[segment + 1]
}

export function samplePath(progress, track) {
  const p = Math.min(Math.max(progress, 0), 1)
  let segment = CHECKPOINTS.length - 2
  for (let index = 0; index < CHECKPOINTS.length - 1; index += 1) {
    if (p <= CHECKPOINTS[index + 1]) {
      segment = index
      break
    }
  }
  const h = CHECKPOINTS[segment + 1] - CHECKPOINTS[segment]
  const t = h === 0 ? 0 : (p - CHECKPOINTS[segment]) / h
  const { position, look } = curves(track)
  return {
    position: position.map((axis) => hermite(axis, segment, t, h)),
    look: look.map((axis) => hermite(axis, segment, t, h)),
  }
}
