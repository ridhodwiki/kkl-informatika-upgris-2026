import { pinProgress, segmentProgress } from '../src/progress.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('segment progress maps hero-to-about viewport tops', () => {
  assert.equal(segmentProgress({ top: 0 }, { top: 400 }), 0)
  assert.equal(segmentProgress({ top: -200 }, { top: 200 }), 0.5)
  assert.equal(segmentProgress({ top: -400 }, { top: 0 }), 1)
  assert.equal(segmentProgress({ top: 100 }, { top: 100 }), 0)
  assert.equal(segmentProgress({ top: -50 }, { top: -100 }), 0)
})

test('pin progress maps the sticky hero scroll range', () => {
  assert.equal(pinProgress(0, 0, 1000), 0)
  assert.equal(pinProgress(500, 0, 1000), 0.5)
  assert.equal(pinProgress(1000, 0, 1000), 1)
  assert.equal(pinProgress(-100, 0, 1000), 0)
  assert.equal(pinProgress(1200, 0, 1000), 1)
  assert.equal(pinProgress(10, 20, 20), 0)
})