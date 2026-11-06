import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleWorld, worldProgress, WORLD_STOPS } from '../src/world-path.js'

test('world progress clamps and handles empty geometry',()=>{
  assert.equal(worldProgress(100,4000,1000),0)
  assert.equal(worldProgress(-1500,4000,1000),.5)
  assert.equal(worldProgress(-5000,4000,1000),1)
  assert.equal(worldProgress(0,0,0),0)
})
for(const mobile of [false,true])test(`world path continuous, reversible and clear of ground / gate (${mobile})`,()=>{
  for(const stop of WORLD_STOPS.slice(1,-1)){
    const before=sampleWorld(stop-1e-6,mobile),after=sampleWorld(stop+1e-6,mobile)
    for(const key of ['position','look'])before[key].forEach((value,axis)=>assert.ok(Math.abs(value-after[key][axis])<.001))
  }
  const forward=Array.from({length:1001},(_,i)=>sampleWorld(i/1000,mobile))
  for(let i=1000;i>=0;i--){
    const sample=sampleWorld(i/1000,mobile)
    assert.deepEqual(sample,forward[i])
    assert.ok(sample.position.every(Number.isFinite))
    assert.ok(sample.position[1]>.8)
    if(Math.abs(sample.position[2])<1)assert.ok(Math.abs(sample.position[0])<.1,'passes gate center')
    if(i>0)assert.ok(sample.position[2]<=forward[i-1].position[2],'no forward reversal')
  }
  assert.equal(sampleWorld(0).chapter,0)
  assert.equal(sampleWorld(.5).chapter,1)
  assert.equal(sampleWorld(1).chapter,2)
})
