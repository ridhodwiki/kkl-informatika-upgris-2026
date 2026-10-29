import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chapterProgress, sceneProgress } from '../src/learning/geometry.js'

test('scene progress clamps scroll travel across the section', () => {
  assert.equal(sceneProgress(700, 1000, 3000, 800), 0)
  assert.equal(sceneProgress(1600, 1000, 2200, 800), 0.5)
  assert.equal(sceneProgress(2500, 1000, 3000, 800), 1)
  assert.equal(sceneProgress(200, 1000, 3000, 800), 0)
  assert.equal(sceneProgress(4000, 1000, 3000, 800), 1)
  assert.equal(sceneProgress(1000, 1000, 800, 800), 0)
})

test('chapter progress clips within equal chapter segments', () => {
  assert.equal(chapterProgress(0, 0, 3), 0)
  assert.equal(chapterProgress(1 / 6, 0, 3), 0.5)
  assert.equal(chapterProgress(1 / 3, 0, 3), 1)
  assert.equal(chapterProgress(1 / 3, 1, 3), 0)
  assert.equal(chapterProgress(0.5, 1, 3), 0.5)
  assert.equal(chapterProgress(1, 2, 3), 1)
})
