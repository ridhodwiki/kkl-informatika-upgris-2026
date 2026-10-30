document.addEventListener("DOMContentLoaded",()=>{
 if(!document.body.classList.contains("public-page"))return;
 document.body.classList.add("js-ready");
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
const galleryImages=[...document.querySelectorAll(".gallery-card img")].filter(image=>!image.closest("[aria-hidden=\"true\"]"));
let lightboxIndex=0;
let restoredFocus=null;
const showImage=index=>{
  if(!dialog||!galleryImages.length)return;
  lightboxIndex=(index+galleryImages.length)%galleryImages.length;
  const image=galleryImages[lightboxIndex];
  dialog.querySelector("img").src=image.currentSrc||image.src;
  dialog.querySelector("img").alt=image.alt;
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
      sectionLinks.forEach(link=>link.classList.toggle("is-active",new URL(link.href).hash===`#${entry.target.id}`));
    });
  },{rootMargin:"-20% 0px -65%",threshold:0});
  sections.forEach(section=>sectionObserver.observe(section));
}
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
const revealEls=document.querySelectorAll(".reveal");
if(reduced||!("IntersectionObserver" in window)){
  revealEls.forEach(el=>el.classList.add("visible"));
}else{
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add("visible");
      io.unobserve(entry.target);
    });
  },{rootMargin:"0px 0px -8% 0px",threshold:.14});
  revealEls.forEach((el,i)=>{
    el.style.transitionDelay=Math.min(i*70,560)+"ms";
    io.observe(el);
  });
}

// Filter perjalanan per hari
const tabs=document.querySelectorAll(".day-tab");
const days=document.querySelectorAll(".journey-day");
tabs.forEach(tab=>{
  tab.addEventListener("click",()=>{
    const day=tab.getAttribute("data-day");
    tabs.forEach(t=>{t.classList.remove("is-active");t.setAttribute("aria-pressed","false");});
    tab.classList.add("is-active");tab.setAttribute("aria-pressed","true");
    days.forEach(d=>{d.classList.toggle("hidden",day!=="all"&&d.getAttribute("data-day")!==day);});
  });
 });
  document.querySelectorAll('.gallery-rail-wrap').forEach(wrap=>{
    const rail=wrap.querySelector('.gallery-rail');
    const previous=wrap.querySelector('.gallery-rail-prev');
    const next=wrap.querySelector('.gallery-rail-next');
    const originals=[...rail.children];
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
      if(originals.length<2)return;
      const width=loopWidth();
      if(rail.scrollLeft<width)reposition(width);
      else if(rail.scrollLeft>=width*2)reposition(-width);
    };
    const scheduleNormalize=()=>{
      clearTimeout(normalizeTimer);
      normalizeTimer=setTimeout(normalize,120);
    };
    const update=()=>{
      const overflow=originals.length>1&&loopWidth()>rail.clientWidth;
      previous.disabled=!overflow;
      next.disabled=!overflow;
    };
    rail.addEventListener('scroll',scheduleNormalize,{passive:true});
    rail.addEventListener('scrollend',normalize);
    previous.addEventListener('click',()=>rail.scrollBy({left:-getStep(),behavior:reduced?'auto':'smooth'}));
    next.addEventListener('click',()=>rail.scrollBy({left:getStep(),behavior:reduced?'auto':'smooth'}));
    window.addEventListener('resize',()=>{rail.classList.add('is-repositioning');rail.scrollLeft=loopWidth();requestAnimationFrame(()=>rail.classList.remove('is-repositioning'));update();});
    requestAnimationFrame(()=>{rail.scrollLeft=loopWidth();update();});
  });
});