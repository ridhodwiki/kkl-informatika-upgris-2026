document.addEventListener("DOMContentLoaded",()=>{
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const title=document.querySelector(".hero h1");
  if(title){
    title.style.opacity="0";
    title.style.transform="translateY(-16px)";
    title.style.transition="opacity .8s ease,transform .8s ease";
    setTimeout(()=>{title.style.opacity="1";title.style.transform="none";},180);
  }
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
});