import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackApi,validFeedback} from '../assets/js/public-feedback.js';

const config={url:'https://example.supabase.co',publishableKey:'sb_publishable_test'};
const entry={name:'Tester',rating:5,message:'A memorable trip'};
test('validation rejects whitespace, bounds and noninteger ratings',()=>{
  assert.ok(validFeedback(entry));
  for(const change of [{name:'   '},{name:'a'.repeat(101)},{rating:0},{rating:6},{rating:1.5},{message:'\n '},{message:'a'.repeat(1001)}])assert.equal(validFeedback({...entry,...change}),false);
});
test('configuration rejects privileged and missing keys',()=>{
  assert.throws(()=>feedbackApi({...config,publishableKey:'sb_secret_test'}));
  assert.throws(()=>feedbackApi({...config,publishableKey:''}));
});
test('REST insert sends only permitted fields and propagates server failure',async()=>{
  const api=feedbackApi(config,async(url,options)=>{
    assert.equal(options.method,'POST');
    assert.equal(options.headers.apikey,config.publishableKey);
    assert.equal(options.headers.Authorization,undefined);
    assert.equal(options.credentials,'omit');
    assert.equal(options.redirect,'error');
    assert.deepEqual(JSON.parse(options.body),entry);
    return new Response(null,{status:201});
  });
  await api.add({...entry,id:'forged',created_at:'forged'});
  await assert.rejects(feedbackApi(config,async()=>new Response(null,{status:403})).add(entry));
});
test('list uses stable keyset ordering, validates cursor and response',async()=>{
  const cursor={id:'00000000-0000-0000-0000-000000000001',created_at:'2026-11-10T00:00:00+00:00'};
  const api=feedbackApi(config,async url=>{
    assert.equal(url.searchParams.get('order'),'created_at.desc,id.desc');
    assert.equal(url.searchParams.get('limit'),'21');
    assert.equal(url.searchParams.get('or'),`(created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id}))`);
    return Response.json([{...entry,...cursor}]);
  });
  assert.equal((await api.list(cursor)).length,1);
  await assert.rejects(api.list({...cursor,id:'bad cursor'}));
  await assert.rejects(feedbackApi(config,async()=>Response.json({error:'bad'})).list());
});
