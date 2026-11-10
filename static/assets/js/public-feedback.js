import { feedbackConfig } from './feedback-config.js';

export function validFeedback({name,rating,message}) {
  return typeof name==='string' && name.trim().length>0 && name.length<=100 &&
    Number.isInteger(rating) && rating>=1 && rating<=5 &&
    typeof message==='string' && message.trim().length>0 && message.length<=1000;
}

export function feedbackApi(config, request=fetch) {
  const base=new URL(config.url);
  if(base.protocol!=='https:' && base.hostname!=='127.0.0.1')throw Error('Invalid URL');
  const key=config.publishableKey;
  let anon=false;
  try { anon=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon'; } catch {}
  if(!key.startsWith('sb_publishable_')&&!anon)throw Error('Publishable key required');
  const endpoint=new URL('/rest/v1/kkl_public_feedback',base);
  const headers={apikey:key};
  if(anon)headers.Authorization=`Bearer ${key}`;
  const send=async(url,options={})=>{
    const response=await request(url,{...options,headers:{...headers,...options.headers},credentials:'omit',redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Feedback request failed');
    return response;
  };
  return {
    async list(cursor) {
      const url=new URL(endpoint);
      url.searchParams.set('select','id,name,rating,message,created_at');
      url.searchParams.set('order','created_at.desc,id.desc');
      url.searchParams.set('limit','21');
      if(cursor){
        if(!/^[0-9a-f-]{36}$/i.test(cursor.id)||!/^[0-9T:.+Z-]+$/.test(cursor.created_at))throw Error('Invalid cursor');
        url.searchParams.set('or',`(created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id}))`);
      }
      const rows=await (await send(url)).json();
      if(!Array.isArray(rows)||rows.length>21||rows.some(row=>!validFeedback(row)||!/^[0-9a-f-]{36}$/i.test(row.id)||!/^[0-9T:.+Z-]+$/.test(row.created_at)))throw Error('Invalid response');
      return rows;
    },
    async add(entry) {
      if(!validFeedback(entry))throw Error('Invalid feedback');
      await send(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name:entry.name.trim(),rating:entry.rating,message:entry.message.trim()})});
    }
  };
}

export function mountPublicFeedback(root,config=feedbackConfig) {
  const form=root.querySelector('[data-public-feedback-form]');
  const list=root.querySelector('[data-public-feedback-list]');
  const status=root.querySelector('[data-public-feedback-status]');
  const notice=form.querySelector('[data-public-feedback-notice]');
  const submit=form.querySelector('button[type=submit]');
  const refresh=root.querySelector('[data-feedback-refresh]');
  const more=root.querySelector('[data-feedback-more]');
  let api;
  try { api=feedbackApi(config); } catch {
    status.textContent='Feedback publik belum aktif. Catatan pribadi tetap dapat digunakan di bawah.';
    return;
  }
  let cursor=null,loading=null,sending=false;
  const sync=()=>{submit.disabled=sending;refresh.disabled=more.disabled=Boolean(loading)||sending;form.setAttribute('aria-busy',String(sending));list.setAttribute('aria-busy',String(Boolean(loading)));};
  const card=entry=>{
    const article=document.createElement('article');article.className='feedback-card';
    const header=document.createElement('div');header.className='feedback-card-head';
    const name=document.createElement('strong');name.textContent=entry.name;
    const stars=document.createElement('span');stars.className='stars';stars.textContent='★'.repeat(entry.rating)+'☆'.repeat(5-entry.rating);stars.setAttribute('aria-label',`Rating ${entry.rating} dari 5`);
    const body=document.createElement('p');body.textContent=entry.message;
    header.append(name,stars);article.append(header,body);return article;
  };
  const load=reset=>{
    if(loading)return loading;
    status.textContent='Memuat feedback…';
    loading=(async()=>{
      try{
        const rows=await api.list(reset?null:cursor);
        const page=rows.slice(0,20);
        if(reset)list.replaceChildren();
        page.forEach(entry=>list.append(card(entry)));
        cursor=page.at(-1)||cursor;
        more.hidden=rows.length<=20;
        status.textContent=list.children.length?`${list.children.length} feedback ditampilkan.`:'Belum ada feedback. Jadilah yang pertama berbagi cerita.';
      }catch{status.textContent='Feedback belum dapat dimuat. Coba tombol Muat ulang; daftar yang sudah tampil tetap tersedia.';}
      finally{loading=null;sync();}
    })();
    sync();return loading;
  };
  refresh.addEventListener('click',()=>load(true));
  more.addEventListener('click',()=>load(false));
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending)return;
    const data=new FormData(form);
    const entry={name:String(data.get('name')||'').trim(),rating:Number(data.get('rating')),message:String(data.get('message')||'').trim()};
    notice.hidden=false;
    if(!validFeedback(entry)){notice.textContent='Isi nama, rating 1–5, dan pesan dengan teks yang valid.';notice.focus();return;}
    sending=true;sync();notice.textContent='Mengirim feedback…';
    try{
      await api.add(entry);form.reset();
      notice.textContent='Terima kasih! Feedback kamu sudah dikirim dan dapat dilihat pengunjung lain.';
      await loading;await load(true);
    }catch{notice.textContent='Pengiriman belum terkonfirmasi. Isian tetap tersedia. Muat ulang daftar sebelum mencoba mengirim lagi.';}
    finally{sending=false;sync();notice.focus();}
  });
  load(true);
}

if(typeof document!=='undefined')document.querySelectorAll('[data-public-feedback]').forEach(root=>mountPublicFeedback(root));
