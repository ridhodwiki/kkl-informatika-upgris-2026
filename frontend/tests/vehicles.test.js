import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Box3, Vector3 } from 'three'

for (const name of ['bus', 'ferry']) test(`${name}: self-contained lightweight GLB fits the travel scene`, async () => {
  const bytes = await readFile(new URL(`../../public/assets/models/kkl-${name}.glb`, import.meta.url))
  assert.ok(bytes.length < 80_000)
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
  assert.ok(json.buffers.every(buffer => !buffer.uri))
  assert.equal(json.images?.length ?? 0, 0)
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  const box = new Box3().setFromObject(gltf.scene)
  const size = box.getSize(new Vector3())
  assert.ok(size.x > 1 && size.x < 2)
  assert.ok(size.z > 2.5 && size.z < 4.3)
  assert.ok(size.y > 1 && size.y < 1.6)
  if (name === 'bus') assert.ok(Math.abs(box.min.y + .72) < .01, 'wheels meet the road')
  else assert.ok(Math.abs(box.min.y + .2) < .01, 'hull meets the water')
  let triangles = 0, meshes = 0
  gltf.scene.traverse(object => {
    if (!object.isMesh) return
    meshes++
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3
  })
  assert.ok(meshes < 30)
  assert.ok(triangles < 4000)
  console.log(`${name}: ${bytes.length} bytes, ${meshes} meshes, ${triangles} triangles`)
})
