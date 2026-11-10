import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

test('static export scopes CSP to one project and preserves feedback configuration',async()=>{
  const root=await mkdtemp(join(tmpdir(),'kkl-feedback-build-'));
  const output=join(root,'static');
  try{
    await mkdir(join(output,'assets/js'),{recursive:true});
    await mkdir(join(root,'public/assets/js'),{recursive:true});
    for(const name of ['build.ps1','vercel.json'])await copyFile(new URL('../'+name,import.meta.url),join(output,name));
    await writeFile(join(output,'index.html'),'<!doctype html><title>Build fixture</title>');
    const config=join(output,'assets/js/feedback-config.js');
    const build=()=>execFileSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(output,'build.ps1')],{stdio:'pipe',windowsHide:true});
    for(const project of ['first-project','second-project','second-project']){
      const source=`export const feedbackConfig={url:'https://${project}.supabase.co',publishableKey:'sb_publishable_test'};`;
      await writeFile(config,source);
      build();
      assert.equal(await readFile(config,'utf8'),source);
      const vercel=JSON.parse(await readFile(join(output,'vercel.json'),'utf8'));
      const csp=vercel.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
      assert.deepEqual(csp.match(/https:\/\/[a-z0-9-]+\.supabase\.co/g),[`https://${project}.supabase.co`]);
      assert.ok(vercel.headers.find(h=>h.source==='/assets/js/feedback-config.js').headers[0].value.includes('must-revalidate'));
    }
    await writeFile(config,"export const feedbackConfig={url:'http://invalid.example',publishableKey:'sb_publishable_test'};");
    assert.throws(build);
  }finally{await rm(root,{recursive:true,force:true});}
});
