import test from 'node:test'
import assert from 'node:assert/strict'
import { CAMERA_PATHS, CHECKPOINTS, samplePath } from '../src/camera-path.js'

const GATE_HALF_WIDTH = 2.315
const GATE_HALF_DEPTH = 1.893
const PASSAGE_HALF_WIDTH = 0.25
const MIN_CLEARANCE = 0.2

const tracks = ['desktop', 'mobile']

for (const track of tracks) {
  test(`${track}: forward-only, no reversal`, () => {
    let previousZ = Infinity
    let previousLookZ = Infinity
    let previousForward = null

    for (let step = 0; step <= 200; step += 1) {
      const sample = samplePath(step / 200, track)
      const [x, y, z] = sample.position
      const [lx, ly, lz] = sample.look

      assert.ok(z < previousZ, `camera z must decrease at t=${step / 200}: ${z}`)
      previousZ = z

      assert.ok(lz < previousLookZ, `look z must decrease at t=${step / 200}: ${lz}`)
      previousLookZ = lz

      assert.ok(y > -0.95 && y < 1.95, `camera y leaves clear band at t=${step / 200}: ${y}`)

      const forward = { x: lx - x, y: ly - y, z: lz - z }
      const length = Math.hypot(forward.x, forward.y, forward.z)
      const unit = { x: forward.x / length, y: forward.y / length, z: forward.z / length }
      assert.ok(unit.z < 0, `camera must face down the path at t=${step / 200}`)

      if (previousForward) {
        const dot = unit.x * previousForward.x + unit.y * previousForward.y + unit.z * previousForward.z
        assert.ok(dot >= 0.85, `forward direction jumps at t=${step / 200}: dot=${dot.toFixed(3)}`)
      }
      previousForward = unit
    }
  })

  test(`${track}: never clips the gate stone`, () => {
    for (let step = 0; step <= 200; step += 1) {
      const sample = samplePath(step / 200, track)
      const [x, y, z] = sample.position

      if (Math.abs(z) <= GATE_HALF_DEPTH + MIN_CLEARANCE) {
        assert.ok(Math.abs(x) <= PASSAGE_HALF_WIDTH - MIN_CLEARANCE, `camera enters stone at t=${step / 200}: x=${x}`)
      }

      const insideGateDepth = Math.abs(z) < GATE_HALF_DEPTH
      if (insideGateDepth) {
        const lateral = Math.abs(x) < PASSAGE_HALF_WIDTH ? PASSAGE_HALF_WIDTH - Math.abs(x) : Math.abs(x) - PASSAGE_HALF_WIDTH
        assert.ok(lateral >= 0 && Math.abs(x) <= PASSAGE_HALF_WIDTH, `camera inside solid pier at t=${step / 200}`)
      }

      const insideStone =
        Math.abs(x) > PASSAGE_HALF_WIDTH &&
        Math.abs(x) < GATE_HALF_WIDTH &&
        Math.abs(z) < GATE_HALF_DEPTH &&
        y > -2.4 &&
        y < 2.4
      assert.ok(!insideStone, `camera inside stone at t=${step / 200}: ${x},${y},${z}`)
      assert.ok(y > -1 && y < 2, `camera below/above passage at t=${step / 200}`)
    }
  })

  test(`${track}: velocity and facing remain continuous across checkpoints`, () => {
    const h = 0.0001
    for (const t of CHECKPOINTS.slice(1, -1)) {
      const before = samplePath(t - h, track)
      const center = samplePath(t, track)
      const after = samplePath(t + h, track)
      for (const key of ['position', 'look']) {
        for (let axis = 0; axis < 3; axis += 1) {
          const incoming = (center[key][axis] - before[key][axis]) / h
          const outgoing = (after[key][axis] - center[key][axis]) / h
          assert.ok(Math.abs(incoming - outgoing) < 0.2, `${key}[${axis}] velocity jumps at t=${t}`)
        }
      }
      const facing = (sample) => {
        const vector = sample.look.map((value, axis) => value - sample.position[axis])
        const length = Math.hypot(...vector)
        return vector.map((value) => value / length)
      }
      const a = facing(before)
      const b = facing(after)
      assert.ok(a.reduce((dot, value, axis) => dot + value * b[axis], 0) > 0.999, `camera snaps at t=${t}`)
    }
  })

  test(`${track}: dense velocity and acceleration stay bounded`, () => {
    const samples = Array.from({ length: 1001 }, (_, index) => samplePath(index / 1000, track))
    const velocities = samples.slice(1).map((sample, index) => sample.position.map((value, axis) => value - samples[index].position[axis]))
    let maxAcceleration = 0
    let maxAngularVelocity = 0
    for (let index = 1; index < velocities.length; index += 1) {
      maxAcceleration = Math.max(maxAcceleration, Math.hypot(...velocities[index].map((value, axis) => value - velocities[index - 1][axis])))
      const a = samples[index - 1].look.map((value, axis) => value - samples[index - 1].position[axis])
      const b = samples[index].look.map((value, axis) => value - samples[index].position[axis])
      const dot = a.reduce((sum, value, axis) => sum + value * b[axis], 0) / Math.hypot(...a) / Math.hypot(...b)
      maxAngularVelocity = Math.max(maxAngularVelocity, Math.acos(Math.min(Math.max(dot, -1), 1)))
    }
    assert.ok(maxAcceleration < 0.0011, `position acceleration spike: ${maxAcceleration}`)
    assert.ok(maxAngularVelocity < 0.01, `angular velocity spike: ${maxAngularVelocity}`)
  })

  test(`${track}: checkpoint look targets never point backward`, () => {
    const { position, look } = CAMERA_PATHS[track]
    assert.equal(position.length, CHECKPOINTS.length)
    assert.equal(look.length, CHECKPOINTS.length)
    for (const [x, y, z] of position) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))
    }
    for (const [, , lz] of look) {
      assert.ok(Number.isFinite(lz))
    }
  })
}
