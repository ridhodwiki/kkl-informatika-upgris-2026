document.addEventListener("DOMContentLoaded",()=>{ 
 if(!document.body.classList.contains("public-page"))return; 
 document.body.classList.add("js-ready"); 
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches; 
(async()=>{
const overlay=document.querySelector(".loading-overlay");
if(!overlay){return}
if(reduced||!("IntersectionObserver" in window)||!("customElements" in window)){
  overlay.classList.add("is-hidden");
  return;
}
if(!overlay.querySelector(".loading-skip-hint")){
  const hint=document.createElement("span");
  hint.className="loading-skip-hint";
  hint.textContent="Klik di mana saja untuk melewati";
  overlay.appendChild(hint);
}
const hideOverlay=()=>{
  clearTimeout(timeout);
  overlay.classList.add("is-hidden");
  window.removeEventListener("keydown",onKey);
};
const onKey=e=>{if(e.key==="Escape")hideOverlay()};
overlay.addEventListener("click",hideOverlay,{once:true});
window.addEventListener("keydown",onKey);
const timeout=setTimeout(hideOverlay,4200);
if(!customElements.get("dotlottie-player")&&!document.querySelector('script[src*="dotlottie-player"]')){
  const s=document.createElement("script");
  s.src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs";
  s.type="module";
  s.onerror=hideOverlay;
  document.head.appendChild(s);
}
try{await Promise.race([customElements.whenDefined("dotlottie-player"),new Promise((_,j)=>setTimeout(j,2500))])}catch{hideOverlay();return}

const container=overlay.querySelector(".lottie-container");
if(!container){hideOverlay();return}
const player=document.createElement("dotlottie-player");
player.addEventListener("complete",hideOverlay,{once:true});
player.addEventListener("error",hideOverlay,{once:true});
player.setAttribute("background","transparent");
player.setAttribute("speed","1.8");
player.setAttribute("src","assets/animations/visiting-abroad.lottie");
player.speed=1.8;
player.loop=false;
player.autoplay=true;
player.style.width="100%";
player.style.height="100%";
container.appendChild(player);
})();

const navToggle=document.querySelector(".nav-toggle"); 
 const nav=document.querySelector("#public-nav");
 let navPreviousFocus=null;
navToggle?.addEventListener("click",()=>{
   const expanded=navToggle.getAttribute("aria-expanded")==="true";
   navPreviousFocus=expanded?null:document.activeElement;
   navToggle.setAttribute("aria-expanded",String(!expanded));
   nav?.classList.toggle("is-open",!expanded);
 });
 navToggle?.addEventListener("keydown",event=>{
   if(event.key!=="Escape")return;
   event.preventDefault();
   nav?.classList.remove("is-open");
   navToggle.setAttribute("aria-expanded","false");
   (navPreviousFocus||navToggle).focus();
   navPreviousFocus=null;
 });
 nav?.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
   nav.classList.remove("is-open");
   navToggle.setAttribute("aria-expanded","false");
   navPreviousFocus=null;
 }));

const dialog=document.querySelector("#public-lightbox");
if(dialog&&!dialog.querySelector("[data-lightbox-meta]")){
  const meta=document.createElement("div");
  meta.className="lightbox-meta";
  meta.setAttribute("data-lightbox-meta","");
  meta.innerHTML='<div class="lightbox-header"><strong data-lightbox-title></strong><span class="lightbox-counter" data-lightbox-counter></span></div><span class="lightbox-sub" data-lightbox-sub></span><p class="lightbox-desc" data-lightbox-desc></p>';
  dialog.appendChild(meta);
}
const galleryImages=[...document.querySelectorAll(".gallery-card img")].filter(image=>!image.closest("[aria-hidden=\"true\"]"));
let lightboxIndex=0;
let restoredFocus=null;
const showImage=index=>{
  if(!dialog||!galleryImages.length)return;
  lightboxIndex=(index+galleryImages.length)%galleryImages.length;
  const image=galleryImages[lightboxIndex];
  const dialogImg=dialog.querySelector("img");
  if(!reduced){
    dialogImg.classList.add("is-switching");
    setTimeout(()=>dialogImg.classList.remove("is-switching"),140);
  }
  dialogImg.src=image.currentSrc||image.src;
  dialogImg.alt=image.alt;
  const card=image.closest(".gallery-card");
  const titleEl=dialog.querySelector("[data-lightbox-title]");
  const counterEl=dialog.querySelector("[data-lightbox-counter]");
  const subEl=dialog.querySelector("[data-lightbox-sub]");
  const descEl=dialog.querySelector("[data-lightbox-desc]");
  if(titleEl)titleEl.textContent=card?.querySelector("figcaption strong")?.textContent||image.alt||"";
  if(counterEl)counterEl.textContent=`${lightboxIndex+1} / ${galleryImages.length}`;
  if(subEl){
    const dest=card?.querySelector("figcaption span")?.textContent||"";
    const loc=card?.querySelector("figcaption small")?.textContent||"";
    subEl.textContent=[dest,loc].filter(Boolean).join(" · ");
    subEl.hidden=!subEl.textContent;
  }
  if(descEl){
    descEl.textContent=card?.querySelector("figcaption p")?.textContent||"";
    descEl.hidden=!descEl.textContent;
  }
};
const openLightbox=index=>{
  if(!dialog)return;
  restoredFocus=document.activeElement;
  showImage(index);
  dialog.showModal();
  dialog.querySelector("button").focus();
};
galleryImages.forEach((image,index)=>{
  image.tabIndex=0;
  image.setAttribute("role","button");
  image.setAttribute("aria-label",`Buka foto: ${image.alt}`);
  image.addEventListener("click",()=>openLightbox(index));
  image.addEventListener("keydown",event=>{
    if(event.key==="Enter"||event.key===" "){
      event.preventDefault();
      openLightbox(index);
    }
  });
});
nav?.addEventListener("keydown",event=>{
   if(event.key!=="Escape")return;
   event.preventDefault();
   nav.classList.remove("is-open");
   navToggle?.setAttribute("aria-expanded","false");
   navToggle?.focus();
 });
 nav?.addEventListener("click",event=>{
  if(!event.target.closest("a"))return;
  nav.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded","false");
});
const sectionLinks=[...document.querySelectorAll('#public-nav a[href*="#"]')];
const sections=sectionLinks.map(link=>document.querySelector(new URL(link.href).hash)).filter(Boolean);
if("IntersectionObserver" in window){
  const sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      sectionLinks.forEach(link=>{
        const active=new URL(link.href).hash===`#${entry.target.id}`;
        link.classList.toggle("is-active",active);
        if(active)link.setAttribute("aria-current","location");
        else link.removeAttribute("aria-current");
      });
      movePill();
    });
  },{rootMargin:"-20% 0px -65%",threshold:0});
  sections.forEach(section=>sectionObserver.observe(section));
}

// Sliding pill under the active nav link (hidden on mobile, where nav wraps).
const pill=document.querySelector(".nav-pill");
function movePill(){
  if(!pill)return;
  const active=nav?.querySelector("a.is-active");
  if(window.innerWidth<=850||!active||!active.offsetWidth){pill.classList.remove("is-on");return;}
  pill.style.width=active.offsetWidth+"px";
  pill.style.transform=`translateX(${active.offsetLeft}px)`;
  pill.classList.add("is-on");
}
movePill();
dialog?.addEventListener("click",event=>{
  if(event.target===dialog||event.target.closest("[data-lightbox-close]"))dialog.close();
  if(event.target.closest("[data-lightbox-prev]"))showImage(lightboxIndex-1);
  if(event.target.closest("[data-lightbox-next]"))showImage(lightboxIndex+1);
});
dialog?.addEventListener("close",()=>restoredFocus?.focus());
dialog?.addEventListener("keydown",event=>{
  if(event.key==="ArrowLeft"){event.preventDefault();showImage(lightboxIndex-1);}
  if(event.key==="ArrowRight"){event.preventDefault();showImage(lightboxIndex+1);}
});
let touchStartX=0;
let touchStartY=0;
dialog?.addEventListener("touchstart",event=>{
  const t=event.changedTouches?.[0];
  if(!t)return;
  touchStartX=t.clientX;
  touchStartY=t.clientY;
},{passive:true});
dialog?.addEventListener("touchend",event=>{
  const t=event.changedTouches?.[0];
  if(!t)return;
  const dx=t.clientX-touchStartX;
  const dy=t.clientY-touchStartY;
  if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.3){
    if(dx<0)showImage(lightboxIndex+1);
    else showImage(lightboxIndex-1);
  }
},{passive:true});

const revealEls=document.querySelectorAll(".reveal");
if(reduced||!("IntersectionObserver" in window)||!("customElements" in window)){
  revealEls.forEach(el=>el.classList.add("visible"));
}else{
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const el=entry.target;
      el.classList.add("visible");
      el.addEventListener("transitionend",()=>{el.style.transitionDelay="";},{once:true});
      io.unobserve(el);
    });
  },{rootMargin:"0px 0px -6% 0px",threshold:.01});
  const delays=new Map();
  revealEls.forEach(el=>{
    const parent=el.parentElement;
    const i=delays.get(parent)||0;
    delays.set(parent,i+1);
    el.style.transitionDelay=Math.min(i*70,560)+"ms";
    io.observe(el);
  });
}

// Count-up for numbers marked with data-count-to (static markup keeps the real
// number as text, so no-JS visitors still see it).
document.querySelectorAll("[data-count-to]").forEach(el=>{
  const target=parseInt(el.getAttribute("data-count-to"),10);
  if(!Number.isFinite(target))return;
  if(reduced||!("IntersectionObserver" in window))return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      io.unobserve(el);
      const start=performance.now();
      const tick=now=>{
        const p=Math.min(1,(now-start)/900);
        el.textContent=String(Math.round(target*(1-Math.pow(1-p,3))));
        if(p<1)requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },{threshold:.6});
  io.observe(el);
});

// Scroll-driven chrome: compact header + top progress bar + back-to-top + timeline progress rail.
const header=document.querySelector(".site-header");
if(header&&!header.querySelector(".scroll-progress-bar")){
  const bar=document.createElement("div");
  bar.className="scroll-progress-bar";
  bar.setAttribute("aria-hidden","true");
  header.appendChild(bar);
}
let backToTop=document.querySelector(".back-to-top");
if(!backToTop){
  backToTop=document.createElement("button");
  backToTop.type="button";
  backToTop.className="back-to-top";
  backToTop.setAttribute("aria-label","Kembali ke atas");
  backToTop.textContent="↑";
  backToTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:reduced?"auto":"smooth"}));
  document.body.appendChild(backToTop);
}
const journey=document.querySelector(".journey-days");
let heroSticky="";
const applyScrollState=()=>{
  header?.classList.toggle("is-scrolled",window.scrollY>40);
  const maxScroll=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
  const pageProgress=Math.min(1,Math.max(0,window.scrollY/maxScroll));
  header?.style.setProperty("--page-scroll",pageProgress.toFixed(4));
  backToTop?.classList.toggle("is-visible",window.scrollY>650);
  if(header){
    const h=Math.round(header.getBoundingClientRect().height)+"px";
    if(h!==heroSticky){heroSticky=h;document.documentElement.style.setProperty("--hero-sticky-top",h);}
  }
  if(!journey)return;
  const rect=journey.getBoundingClientRect();
  const line=window.innerHeight*0.72;
  const raw=rect.height?(line-rect.top)/rect.height:1;
  const progress=reduced?1:Math.min(1,Math.max(0,raw));
  journey.style.setProperty("--progress",progress.toFixed(3));
  journey.querySelectorAll(".journey-day").forEach(day=>{
    day.classList.toggle("is-reached",reduced||day.getBoundingClientRect().top<=line);
  });
};
{
  let ticking=false;
  const schedule=()=>{
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(()=>{applyScrollState();ticking=false;});
  };
  applyScrollState();
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
}
// Re-measure after web fonts settle: a fallback font can wrap the mobile
// header into two rows and leave --hero-sticky-top 40px too tall.
window.addEventListener("load",()=>{applyScrollState();movePill();});
document.fonts?.ready.then(()=>{applyScrollState();movePill();}).catch(()=>{});
window.addEventListener("resize",movePill,{passive:true});

// Filter perjalanan per hari dengan animasi transisi halus
const tabs=document.querySelectorAll(".day-tab");
const days=document.querySelectorAll(".journey-day");
tabs.forEach(tab=>{
  tab.addEventListener("click",()=>{
    const day=tab.getAttribute("data-day");
    tabs.forEach(t=>{t.classList.remove("is-active");t.setAttribute("aria-pressed","false");});
    tab.classList.add("is-active");tab.setAttribute("aria-pressed","true");
    days.forEach(d=>{
      const shouldHide=day!=="all"&&d.getAttribute("data-day")!==day;
      d.classList.toggle("hidden",shouldHide);
      if(!shouldHide&&!reduced){
        d.classList.remove("is-filtering");
        void d.offsetWidth;
        d.classList.add("is-filtering");
      }
    });
    requestAnimationFrame(applyScrollState);
  });
 });
  document.querySelectorAll('.gallery-rail-wrap').forEach(wrap=>{
    const rail=wrap.querySelector('.gallery-rail');
    const previous=wrap.querySelector('.gallery-rail-prev');
    const next=wrap.querySelector('.gallery-rail-next');
    const originals=[...rail.children];
    let filtering=false;
    let normalizeTimer;
    if(originals.length>1){
      originals.forEach(card=>{
        const clone=card.cloneNode(true);
        clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
        clone.setAttribute('aria-hidden','true');
        const cloneImage=clone.querySelector("img");
        cloneImage?.setAttribute("tabindex","-1");
        cloneImage?.removeAttribute("role");
        cloneImage?.removeAttribute("aria-label");
        cloneImage?.addEventListener("click",()=>openLightbox(originals.indexOf(card)));
        rail.append(clone);
      });
      originals.slice().reverse().forEach(card=>{
        const clone=card.cloneNode(true);
        clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
        clone.setAttribute('aria-hidden','true');
        const cloneImage=clone.querySelector("img");
        cloneImage?.setAttribute("tabindex","-1");
        cloneImage?.removeAttribute("role");
        cloneImage?.removeAttribute("aria-label");
        cloneImage?.addEventListener("click",()=>openLightbox(originals.indexOf(card)));
        rail.prepend(clone);
      });
    }
    const getStep=()=>{
      const card=rail.querySelector('.gallery-card');
      const styles=getComputedStyle(rail);
      return (card?.getBoundingClientRect().width||240)+(parseFloat(styles.columnGap||styles.gap)||20);
    };
    const loopWidth=()=>{
      if(originals.length<2)return 0;
      return rail.children[originals.length].offsetLeft-rail.children[0].offsetLeft;
    };
    const reposition=offset=>{
      rail.classList.add('is-repositioning');
      rail.scrollTo({left:rail.scrollLeft+offset,behavior:'instant'});
      requestAnimationFrame(()=>rail.classList.remove('is-repositioning'));
    };
    const normalize=()=>{
      if(filtering||originals.length<2)return;
      const width=loopWidth();
      if(rail.scrollLeft<width)reposition(width);
      else if(rail.scrollLeft>=width*2)reposition(-width);
    };
    const scheduleNormalize=()=>{
      clearTimeout(normalizeTimer);
      normalizeTimer=setTimeout(normalize,120);
    };
    const update=()=>{
      const overflow=filtering?rail.scrollWidth>rail.clientWidth:originals.length>1&&loopWidth()>rail.clientWidth;
      previous.disabled=!overflow;
      next.disabled=!overflow;
    };
    rail.addEventListener('scroll',scheduleNormalize,{passive:true});
    rail.addEventListener('scrollend',normalize);
    previous.addEventListener('click',()=>rail.scrollBy({left:-getStep(),behavior:reduced?'auto':'smooth'}));
    next.addEventListener('click',()=>rail.scrollBy({left:getStep(),behavior:reduced?'auto':'smooth'}));
    window.addEventListener('resize',()=>{rail.classList.add('is-repositioning');rail.scrollLeft=filtering?0:loopWidth();requestAnimationFrame(()=>rail.classList.remove('is-repositioning'));update();});
    requestAnimationFrame(()=>{rail.scrollLeft=loopWidth();update();});
    if(wrap.closest('#galeri')){
      const controls=document.createElement('div');
      controls.className='gallery-search';
      const label=document.createElement('label');
      label.textContent='Cari foto berdasarkan judul atau lokasi';
      const input=document.createElement('input');
      input.type='search';
      input.placeholder='Contoh: Pandawa, Denpasar';
      label.append(input);
      const clear=document.createElement('button');
      clear.type='button';
      clear.className='btn btn-ghost';
      clear.textContent='Hapus pencarian';
      const status=document.createElement('p');
      status.setAttribute('role','status');
      controls.append(label,clear,status);
      wrap.before(controls);
      const search=()=>{
        const query=input.value.trim().toLocaleLowerCase('id');
        filtering=Boolean(query);
        clearTimeout(normalizeTimer);
        let count=0;
        [...rail.children].forEach(card=>{
          const original=originals.includes(card);
          const match=card.textContent.toLocaleLowerCase('id').includes(query);
          card.hidden=filtering&&(!original||!match);
          if(original&&!card.hidden)count++;
        });
        status.textContent=count?`${count} foto ditemukan.`:'Tidak ada foto yang cocok. Coba kata lain atau hapus pencarian.';
        rail.classList.add('is-repositioning');
        rail.scrollLeft=filtering?0:loopWidth();
        requestAnimationFrame(()=>{rail.classList.remove('is-repositioning');update();});
      };
      input.addEventListener('input',search);
      clear.addEventListener('click',()=>{input.value='';search();input.focus();});
      search();
    }
  });

  // Live character counter on feedback textarea
  document.querySelectorAll('.feedback-form textarea[name="message"]').forEach(textarea=>{
    const max=parseInt(textarea.getAttribute('maxlength')||'1000',10);
    let counter=textarea.parentElement?.querySelector('.char-counter');
    if(!counter&&textarea.parentElement){
      counter=document.createElement('small');
      counter.className='char-counter';
      counter.setAttribute('aria-live','polite');
      textarea.parentElement.appendChild(counter);
    }
    const updateCount=()=>{
      if(counter)counter.textContent=`${textarea.value.length} / ${max}`;
    };
    textarea.addEventListener('input',updateCount);
    textarea.form?.addEventListener('reset',()=>setTimeout(updateCount,0));
    updateCount();
  });

  // Helper to build a feedback card DOM element safely
  const createFeedbackCard=({name,rating,message},isNew=false)=>{
    const card=document.createElement('article');
    card.className='feedback-card'+(isNew?' is-new':'');
    const head=document.createElement('div');
    head.className='feedback-card-head';
    const strong=document.createElement('strong');
    strong.textContent=name;
    const stars=document.createElement('span');
    stars.className='stars';
    const r=Math.min(5,Math.max(1,parseInt(rating,10)||5));
    stars.setAttribute('aria-label',`Rating ${r} dari 5`);
    stars.textContent='★'.repeat(r)+'☆'.repeat(5-r);
    head.append(strong,stars);
    const body=document.createElement('p');
    body.textContent=message;
    card.append(head,body);
    return card;
  };

  // Static (Vercel) build has no backend: accept the form locally, persist in localStorage, and render immediately.
  const STORAGE_KEY='kkl_upgris_2026_feedbacks';
  document.querySelectorAll('form[data-static-feedback]').forEach(form=>{
    const save=form.querySelector('[data-local-save]');
    if(save)save.disabled=false;
    const thanks=form.querySelector('[data-feedback-thanks]');
    const layout=form.closest('.feedback-layout');
    let list=layout?.querySelector('.feedback-list');
    const ensureList=()=>{
      if(!list&&layout){
        list=document.createElement('div');
        list.className='feedback-list';
        layout.appendChild(list);
      }
      return list;
    };
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      if(Array.isArray(saved)&&saved.length){
        const targetList=ensureList();
        saved.forEach(item=>{
          if(item&&item.name&&item.message)targetList?.prepend(createFeedbackCard(item,false));
        });
      }
    }catch{}
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const fd=new FormData(form);
      const name=String(fd.get('name')||'').trim();
      const rating=Number(fd.get('rating'));
      const message=String(fd.get('message')||'').trim();
      const announce=(message,error=false)=>{
        if(!thanks)return;
        thanks.textContent=message;
        thanks.classList.toggle('alert-success',!error);
        thanks.classList.toggle('alert-error',error);
        thanks.hidden=false;
        thanks.focus();
      };
      if(!name||name.length>100||!message||message.length>1000||!Number.isInteger(rating)||rating<1||rating>5){
        announce('Isi nama dan cerita dengan teks, serta pilih rating 1 sampai 5. Isian kamu belum disimpan.',true);
        return;
      }
      {
        const entry={name,rating,message};
        try{
          const prev=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
          const next=Array.isArray(prev)?[...prev,entry].slice(-20):[entry];
          localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
        }catch{
          announce('Catatan belum dapat disimpan di browser ini. Isian tetap tersedia; salin ceritamu atau coba lagi setelah penyimpanan browser diizinkan.',true);
          return;
        }
        ensureList()?.prepend(createFeedbackCard(entry,true));
      }
      form.reset();
      announce('Catatan tersimpan di browser ini saja, tidak dikirim kepada admin atau pengunjung lain.');
    });
  });
});
