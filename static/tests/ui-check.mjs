import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'..');
let feedbackFixture=false,failRead=false,failWrite=false,publicPosts=0;
const fixtureRows=Array.from({length:23},(_,i)=>({id:`00000000-0000-0000-0000-${String(23-i).padStart(12,'0')}`,name:i?'Visitor '+i:'<img src=x onerror=alert(1)>',rating:5,message:i?'A public memory':'<script>alert(1)</script>',created_at:'2026-11-10T00:00:00+00:00'}));
const server=createServer(async(req,res)=>{
  try {
    const requestUrl=new URL(req.url,'http://localhost');
    if(feedbackFixture&&requestUrl.pathname==='/assets/js/feedback-config.js'){
      res.setHeader('Content-Type','text/javascript');
      res.end(`export const feedbackConfig={url:'http://127.0.0.1:${server.address().port}',publishableKey:'sb_publishable_test'};`);return;
    }
    if(feedbackFixture&&requestUrl.pathname==='/rest/v1/kkl_public_feedback'){
      res.setHeader('Content-Type','application/json');
      if(req.method==='POST'){
        publicPosts++;let body='';for await(const chunk of req)body+=chunk;
        await new Promise(r=>setTimeout(r,150));
        if(failWrite){res.writeHead(503);res.end('{}');return;}
        fixtureRows.unshift({...JSON.parse(body),id:'00000000-0000-0000-0000-000000000099',created_at:'2026-11-11T00:00:00+00:00'});
        res.writeHead(201);res.end();return;
      }
      if(failRead){res.writeHead(503);res.end('{}');return;}
      const cursor=requestUrl.searchParams.get('or')?.match(/id\.lt\.([0-9a-f-]+)/)?.[1];
      const start=cursor?fixtureRows.findIndex(row=>row.id===cursor)+1:0;
      res.end(JSON.stringify(fixtureRows.slice(start,start+21)));return;
    }
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
  assert.equal(await evaluate(`document.querySelector('[data-public-feedback-form] button[type=submit]').disabled&&document.querySelector('[data-public-feedback-status]').textContent.includes('belum aktif')`),true,'unconfigured service stays disabled');
  assert.equal(await evaluate(`Boolean(document.querySelector('.loading-overlay .lottie-container'))`),true,'entrance overlay markup present');
  for(const width of [375,768,1440]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),true,`overflow at ${width}`);
  }
  assert.equal(await evaluate(`(()=>{const i=document.querySelector('.gallery-search input');i.value='Pandawa';i.dispatchEvent(new Event('input'));return [...document.querySelectorAll('.gallery-card:not([hidden]):not([aria-hidden])')].length})()`),2);
  assert.equal(await evaluate(`(()=>{document.querySelector('.gallery-card:not([hidden]):not([aria-hidden]) img').click();document.querySelector('[data-lightbox-next]').click();return document.querySelector('[data-lightbox-counter]').textContent==='2 / 2'&&document.querySelector('#public-lightbox img').alt.includes('Pandawa')})()`),true,'lightbox stays within search results');
  await evaluate(`document.querySelector('#public-lightbox').close()`);
  assert.equal(await evaluate(`(()=>{const i=document.querySelector('.gallery-search input');i.value='zzzz-no-result';i.dispatchEvent(new Event('input'));return document.querySelector('.gallery-search [role=status]').textContent.includes('Tidak ada')})()`),true);
  assert.equal(await evaluate(`(()=>{document.querySelector('.gallery-search button').click();return [...document.querySelectorAll('.gallery-card:not([aria-hidden])')].every(c=>!c.hidden)})()`),true);
  await evaluate(`window.scrollTo(0,1000);new Promise(r=>setTimeout(r,150))`);
  assert.equal(await evaluate(`document.querySelector('.back-to-top').classList.contains('is-visible')`),true,'reduced-motion scroll');
  const fill=`const f=document.querySelector('[data-static-feedback]');f.elements.name.value='Tester';f.elements.message.value='Cerita uji';f.elements.rating.value='5';`;
  assert.equal(await evaluate(`(()=>{${fill}f.elements.name.value='   ';f.requestSubmit();return f.elements.message.value==='Cerita uji'&&document.querySelector('[data-feedback-thanks]').classList.contains('alert-error')})()`),true,'whitespace retains input');
  assert.equal(await evaluate(`(()=>{${fill}const original=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')};f.requestSubmit();Storage.prototype.setItem=original;return f.elements.message.value==='Cerita uji'&&document.querySelector('[data-feedback-thanks]').textContent.includes('belum dapat')})()`),true,'storage failure retains input');
  assert.equal(await evaluate(`(()=>{${fill}f.requestSubmit();return f.elements.message.value===''&&JSON.parse(localStorage.getItem('kkl_upgris_2026_feedbacks')).length===1&&document.querySelector('[data-feedback-thanks]').textContent.includes('tidak dikirim')})()`),true,'local save');
  assert.equal(await evaluate(`(()=>{${fill}for(let i=0;i<20;i++){f.elements.name.value='Tester';f.elements.message.value='Catatan '+i;f.elements.rating.value='5';f.requestSubmit()}return JSON.parse(localStorage.getItem('kkl_upgris_2026_feedbacks')).length===21})()`),true,'older notes retained past 20');
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:profile});
  await evaluate(`document.querySelector('[data-download-notes]').click()`);
  let downloaded;
  for(let i=0;i<30;i++){try{downloaded=JSON.parse(await readFile(join(profile,'catatan-kkl-bali.json'),'utf8'));break}catch{await new Promise(r=>setTimeout(r,100))}}
  assert.equal(downloaded?.length,21,'download contains all notes');
  assert.equal(await evaluate(`(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')};document.querySelector('[data-local-notes] button').click();Storage.prototype.setItem=original;return JSON.parse(localStorage.getItem('kkl_upgris_2026_feedbacks')).length===21})()`),true,'failed deletion retains data');
  assert.equal(await evaluate(`(()=>{document.querySelector('[data-local-notes] button').click();return JSON.parse(localStorage.getItem('kkl_upgris_2026_feedbacks')).length===20&&document.querySelectorAll('[data-local-notes] .feedback-card').length===20})()`),true,'delete persists');
  assert.equal(await evaluate(`[...document.querySelectorAll('iframe')].every(i=>i.loading==='lazy')`),true);
  assert.equal(await evaluate(`document.querySelectorAll('[data-world-panel]:not([aria-hidden])').length`),3,'reduced motion exposes all chapters');
  assert.equal(await evaluate(`performance.getEntriesByType('resource').some(r=>/kkl-(bus|ferry)\\.glb/.test(r.name))`),false,'reduced motion avoids vehicle downloads');
  await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);
  for(let i=0;i<150;i++){
    if(await evaluate(`document.querySelector('[data-scroll-world]').dataset.state==='ready'`))break;
    await new Promise(r=>setTimeout(r,100));
  }
  assert.equal(await evaluate(`document.querySelector('[data-scroll-world]').dataset.state`),'ready','3D ready');
  await evaluate(`document.querySelectorAll('[data-world-link]')[1].click();document.querySelectorAll('[data-world-link]')[2].click();history.back();new Promise(r=>setTimeout(r,250))`);
  assert.equal(await evaluate(`location.hash==='#world-travel'&&document.querySelector('[data-scroll-world]').dataset.chapter==='1'`),true,'Back restores chapter');
  await evaluate(`history.forward();new Promise(r=>setTimeout(r,250))`);
  assert.equal(await evaluate(`location.hash==='#world-learning'&&document.querySelector('[data-scroll-world]').dataset.chapter==='2'`),true,'Forward restores chapter');
  const beforeReload=await evaluate('performance.timeOrigin');
  await command('Page.reload',{ignoreCache:true});
  for(let i=0;i<100;i++){if(await evaluate(`performance.timeOrigin!==${beforeReload}&&document.querySelector('[data-scroll-world]')?.dataset.state==='ready'`))break;await new Promise(r=>setTimeout(r,100))}
  await new Promise(r=>setTimeout(r,150));
  assert.equal(await evaluate(`document.querySelector('[data-scroll-world]').dataset.chapter`),'2','direct chapter URL after reload');
  await evaluate(`document.querySelector('[data-world-lite]').click();new Promise(r=>setTimeout(r,150))`);
  assert.equal(await evaluate(`!document.querySelector('[data-scroll-world] canvas')&&localStorage.getItem('kkl_world_light')==='true'`),true,'light mode releases canvas');
  await command('Page.reload',{ignoreCache:true});
  await new Promise(r=>setTimeout(r,600));
  assert.equal(await evaluate(`document.querySelector('[data-world-lite]').getAttribute('aria-pressed')==='true'&&!document.querySelector('[data-scroll-world] canvas')`),true,'light preference persists');
  await evaluate(`document.querySelector('[data-world-lite]').click()`);
  for(let i=0;i<100;i++){if(await evaluate(`document.querySelector('[data-scroll-world]')?.dataset.state==='ready'`))break;await new Promise(r=>setTimeout(r,100))}
  const screenshots=await mkdtemp(join(tmpdir(),'kkl-world-review-'));
  await evaluate(`document.querySelector('.loading-overlay')?.click();new Promise(r=>setTimeout(r,500))`);
  assert.equal(await evaluate(`['bus','ferry'].every(name=>performance.getEntriesByType('resource').some(r=>r.name.endsWith('kkl-'+name+'.glb')&&r.decodedBodySize>0))`),true,'both CAD models downloaded');
  for(const [width,height] of [[1440,900],[768,900],[375,900],[375,667]]){
    await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
    for(const chapter of [0,1,2,1,0]){
      await evaluate(`document.querySelectorAll('[data-world-link]')[${chapter}].click();new Promise(r=>setTimeout(r,450))`);
      assert.equal(await evaluate(`Number(document.querySelector('[data-scroll-world]').dataset.chapter)`),chapter,'jump and reverse');
      assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),true,'world overflow');
      assert.equal(await evaluate(`(()=>{const panel=document.querySelector('[data-world-panel="${chapter}"]');const box=panel.getBoundingClientRect();return !panel.inert&&box.top>=0&&box.bottom<=innerHeight})()`),true,'chapter readable');
      assert.equal(await evaluate(`document.querySelector('[data-world-panel="${chapter}"]').getBoundingClientRect().bottom<document.querySelector('.world-controls').getBoundingClientRect().top`),true,`controls clear of chapter at ${width}x${height}`);
      const {data}=await command('Page.captureScreenshot',{format:'png'});
      await writeFile(join(screenshots,`${width}-${height}-${chapter}.png`),Buffer.from(data,'base64'));
    }
  }
  for(const [progress,chapter] of [[.2,0],[.5,1],[.9,2],[.5,1],[0,0]]){
    await evaluate(`(()=>{const root=document.querySelector('[data-scroll-world]');scrollTo({top:scrollY+root.getBoundingClientRect().top+${progress}*(root.offsetHeight-innerHeight),behavior:'instant'})})();new Promise(r=>setTimeout(r,100))`);
    assert.equal(await evaluate(`Number(document.querySelector('[data-scroll-world]').dataset.chapter)`),chapter,'native scroll drives chapters');
  }
  await evaluate(`document.querySelector('.world-controls>a').click();new Promise(r=>setTimeout(r,1200))`);
  assert.equal(await evaluate(`Math.abs(document.querySelector('#timeline').getBoundingClientRect().top)<200`),true,'skip reaches timeline');
  await evaluate(`document.querySelector('[data-scroll-world] canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();new Promise(r=>setTimeout(r,200))`);
  assert.equal(await evaluate(`!document.querySelector('[data-scroll-world]').classList.contains('world-enabled')&&[...document.querySelectorAll('[data-world-panel]')].every(p=>!p.inert)`),true,'context loss fallback');
  await command('Network.enable');
  await command('Network.setBlockedURLs',{urls:['*kkl-bus.glb*','*kkl-ferry.glb*']});
  const beforeVehicleFailure=await evaluate('performance.timeOrigin');
  await command('Page.reload',{ignoreCache:true});
  for(let i=0;i<100;i++){if(await evaluate(`performance.timeOrigin!==${beforeVehicleFailure}&&document.querySelector('[data-scroll-world]')?.dataset.state==='ready'`))break;await new Promise(r=>setTimeout(r,100))}
  await evaluate(`document.querySelectorAll('[data-world-link]')[1].click();new Promise(r=>setTimeout(r,300))`);
  assert.equal(await evaluate(`document.querySelector('[data-scroll-world]').dataset.state==='ready'&&document.querySelector('[data-scroll-world]').dataset.chapter==='1'`),true,'missing vehicles preserve interactive world');
  await command('Network.setBlockedURLs',{urls:['*candi-bentar.glb*']});
  await command('Page.reload',{ignoreCache:true});
  await new Promise(r=>setTimeout(r,1500));
  assert.equal(await evaluate(`!document.querySelector('[data-scroll-world]').classList.contains('world-enabled')&&[...document.querySelectorAll('[data-world-panel]')].every(p=>!p.inert)`),true,'missing model fallback');
  feedbackFixture=true;
  await command('Page.reload',{ignoreCache:true});
  for(let i=0;i<60;i++){if(await evaluate(`document.querySelectorAll('[data-public-feedback-list] article').length===20`))break;await new Promise(r=>setTimeout(r,100))}
  assert.equal(await evaluate(`document.querySelectorAll('[data-public-feedback-list] article').length`),20,'public page size');
  await evaluate(`document.querySelector('.loading-overlay')?.click()`);
  for(const width of [375,1440]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
    await evaluate(`document.fonts.ready.then(()=>new Promise(r=>setTimeout(r,600)))`);
    await evaluate(`document.querySelector('#feedback').scrollIntoView({behavior:'instant'});new Promise(r=>setTimeout(r,600))`);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.public-feedback-heading')).display`),'flex','feedback stylesheet loaded');
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),true,'feedback fits viewport');
    const {data}=await command('Page.captureScreenshot',{format:'png'});
    await writeFile(join(screenshots,`feedback-${width}.png`),Buffer.from(data,'base64'));
  }
  assert.equal(await evaluate(`document.querySelector('[data-public-feedback-list]').querySelector('script,img')===null`),true,'public content rendered as text');
  await evaluate(`document.querySelector('[data-feedback-more]').click();new Promise(r=>setTimeout(r,150))`);
  assert.equal(await evaluate(`document.querySelectorAll('[data-public-feedback-list] article').length===23&&document.querySelector('[data-feedback-more]').hidden`),true,'public pagination');
  failRead=true;
  await evaluate(`document.querySelector('[data-feedback-refresh]').click();new Promise(r=>setTimeout(r,150))`);
  assert.equal(await evaluate(`document.querySelectorAll('[data-public-feedback-list] article').length===23&&document.querySelector('[data-public-feedback-status]').textContent.includes('belum dapat')`),true,'read error retains list');
  failRead=false;
  const publicFill=`const f=document.querySelector('[data-public-feedback-form]');f.elements.name.value='Public tester';f.elements.rating.value='5';f.elements.message.value='Shared public feedback';`;
  assert.equal(await evaluate(`(()=>{${publicFill}f.elements.name.value='  ';f.requestSubmit();return f.elements.message.value==='Shared public feedback'&&document.querySelector('[data-public-feedback-notice]').textContent.includes('valid')})()`),true,'public whitespace validation');
  failWrite=true;
  await evaluate(`(()=>{${publicFill}f.requestSubmit()})();new Promise(r=>setTimeout(r,350))`);
  assert.equal(await evaluate(`document.querySelector('[data-public-feedback-form]').elements.message.value`),'Shared public feedback','failed public send retains input');
  failWrite=false;const beforePosts=publicPosts;
  await evaluate(`(()=>{${publicFill}f.requestSubmit();f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))})();new Promise(r=>setTimeout(r,450))`);
  assert.equal(publicPosts-beforePosts,1,'duplicate submit prevented');
  assert.equal(await evaluate(`document.querySelector('[data-public-feedback-form]').elements.message.value===''&&document.querySelector('[data-public-feedback-list] article p').textContent==='Shared public feedback'`),true,'public send resets only on success');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('kkl_upgris_2026_feedbacks')).length`),20,'public send leaves private notes untouched');
  const {browserContextId}=await send('Target.createBrowserContext');
  const other=await send('Target.createTarget',{url:`http://127.0.0.1:${server.address().port}/`,browserContextId});
  const attached=await send('Target.attachToTarget',{targetId:other.targetId,flatten:true});
  let visibleElsewhere=false;
  for(let i=0;i<60;i++){
    const result=await send('Runtime.evaluate',{expression:`document.querySelector('[data-public-feedback-list] article p')?.textContent==='Shared public feedback'&&!localStorage.getItem('kkl_upgris_2026_feedbacks')`,returnByValue:true},attached.sessionId);
    if(result.result?.value){visibleElsewhere=true;break}await new Promise(r=>setTimeout(r,100));
  }
  assert.equal(visibleElsewhere,true,'feedback visible in separate browser context');
  await send('Target.disposeBrowserContext',{browserContextId});
  await command('Emulation.setScriptExecutionDisabled',{value:true});
  await command('Page.reload',{ignoreCache:true});
  await new Promise(r=>setTimeout(r,700));
  assert.equal(await evaluate(`document.querySelectorAll('[data-world-panel]').length===3&&!document.querySelector('[data-scroll-world]').classList.contains('world-enabled')`),true,'no-JS content');
  console.log(`World screenshots: ${screenshots}`);
  console.log('PASS: responsive UI, gallery, feedback, lazy iframe, world chapters/scroll/skip, reduced motion, WebGL/model failure and no-JS fallback');
  await send('Browser.close');
}finally{
  ws?.close();chrome.kill();server.close();
  await new Promise(r=>setTimeout(r,500));
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
