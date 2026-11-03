import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'..');
const server=createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
    if(!path.startsWith(root+ '\\'))throw Error('Outside root');
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
    res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');
    res.end(await readFile(path));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=await mkdtemp(join(tmpdir(),'kkl-ui-'));
const chrome=spawn(process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
  '--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','about:blank'
],{windowsHide:true});
let ws;
try{
  const endpoint=await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(Error('Chrome startup timed out')),15000);
    chrome.on('error',reject);
    chrome.stderr.on('data',data=>{output+=data;const match=output.match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  });
  ws=new WebSocket(endpoint);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;const pending=new Map();
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const {resolve,reject,timer}=pending.get(m.id);clearTimeout(timer);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}});
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>reject(Error(method+' timed out')),15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params,sessionId}));});
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const command=(method,params)=>send(method,params,sessionId);
  const evaluate=async expression=>{
    const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
  for(let i=0;i<60;i++){
    if(await evaluate(`Boolean(document.querySelector('.gallery-search'))`))break;
    await new Promise(r=>setTimeout(r,100));
  }
  assert.equal(await evaluate(`Boolean(document.querySelector('.gallery-search'))`),true);
  for(const width of [375,768,1440]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),true,`overflow at ${width}`);
  }
  assert.equal(await evaluate(`(()=>{const i=document.querySelector('.gallery-search input');i.value='Pandawa';i.dispatchEvent(new Event('input'));return [...document.querySelectorAll('.gallery-card:not([hidden]):not([aria-hidden])')].length})()`),2);
  assert.equal(await evaluate(`(()=>{const i=document.querySelector('.gallery-search input');i.value='zzzz-no-result';i.dispatchEvent(new Event('input'));return document.querySelector('.gallery-search [role=status]').textContent.includes('Tidak ada')})()`),true);
  assert.equal(await evaluate(`(()=>{document.querySelector('.gallery-search button').click();return [...document.querySelectorAll('.gallery-card:not([aria-hidden])')].every(c=>!c.hidden)})()`),true);
  await evaluate(`window.scrollTo(0,1000);new Promise(r=>setTimeout(r,150))`);
  assert.equal(await evaluate(`document.querySelector('.back-to-top').classList.contains('is-visible')`),true,'reduced-motion scroll');
  const fill=`const f=document.querySelector('[data-static-feedback]');f.elements.name.value='Tester';f.elements.message.value='Cerita uji';f.elements.rating.value='5';`;
  assert.equal(await evaluate(`(()=>{${fill}f.elements.name.value='   ';f.requestSubmit();return f.elements.message.value==='Cerita uji'&&document.querySelector('[data-feedback-thanks]').classList.contains('alert-error')})()`),true,'whitespace retains input');
  assert.equal(await evaluate(`(()=>{${fill}const original=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')};f.requestSubmit();Storage.prototype.setItem=original;return f.elements.message.value==='Cerita uji'&&document.querySelector('[data-feedback-thanks]').textContent.includes('belum dapat')})()`),true,'storage failure retains input');
  assert.equal(await evaluate(`(()=>{${fill}f.requestSubmit();return f.elements.message.value===''&&JSON.parse(localStorage.getItem('kkl_upgris_2026_feedbacks')).length===1&&document.querySelector('[data-feedback-thanks]').textContent.includes('tidak dikirim')})()`),true,'local save');
  assert.equal(await evaluate(`[...document.querySelectorAll('iframe')].every(i=>i.loading==='lazy')`),true);
  console.log('PASS: responsive widths, gallery search/reset/empty, reduced-motion scroll, feedback validation/storage failure/success, lazy iframe');
  await send('Browser.close');
}finally{
  ws?.close();chrome.kill();server.close();
  await new Promise(r=>setTimeout(r,500));
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
