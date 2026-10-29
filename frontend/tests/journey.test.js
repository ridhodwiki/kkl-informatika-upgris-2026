import assert from 'node:assert/strict'
import { test } from 'node:test'
import { drawingStops, journeyProgress, normalizeRoute, splitRoute } from '../src/journey/places.js'

test('route extraction handles both separators and adjacent duplicates', () => {
  assert.deepEqual(splitRoute('Semarang -> Caruban'), ['Semarang', 'Caruban'])
  assert.deepEqual(splitRoute('Semarang \u2192 Caruban'), ['Semarang', 'Caruban'])
  assert.deepEqual(normalizeRoute([{ route: 'Semarang -> Caruban' }, { route: 'Caruban -> Ketapang' }, { route: 'Gilimanuk -> Denpasar' }]), ['Semarang', 'Caruban', 'Ketapang', 'Gilimanuk', 'Denpasar'])
})

test('drawing labels deduplicate without changing route order', () => {
  assert.deepEqual(drawingStops(['Semarang', 'Caruban', 'Caruban', 'Ketapang']), ['Semarang', 'Caruban', 'Ketapang'])
})

test('progress starts before entry, completes near the top and is clamped', () => {
  for (const viewport of [900, 844]) {
    assert.equal(journeyProgress(viewport, viewport), 0)
    assert.equal(journeyProgress(viewport * 0.9, viewport), 0)
    assert.equal(journeyProgress(viewport * 0.2, viewport), 1)
    assert.equal(journeyProgress(-viewport, viewport), 1)
    assert.ok(Math.abs(journeyProgress(viewport * 0.55, viewport) - 0.5) < 1e-10)
    let previous = 0
    for (let top = viewport; top >= -viewport; top -= 10) {
      const value = journeyProgress(top, viewport)
      assert.ok(value >= previous)
      previous = value
    }
  }
})

test('untrusted route text stays plain data', () => {
  const value = '<img src=x onerror=alert(1)>'
  assert.deepEqual(splitRoute(value), [value])
})
