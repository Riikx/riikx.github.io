'use strict';
(() => {
  const viewer=document.createElement('dialog');viewer.className='presentation';
  viewer.setAttribute('aria-label','Apresentação das telas do projeto');
  viewer.innerHTML='<div class="presentation-toolbar"><span class="presentation-counter" aria-live="polite"></span><div><button class="presentation-fullscreen" type="button">Tela cheia ⛶</button><button class="presentation-close" type="button" aria-label="Fechar apresentação">Fechar ×</button></div></div><div class="presentation-stage"><button class="presentation-prev" type="button" aria-label="Tela anterior">←</button><img class="presentation-image" alt=""><button class="presentation-next" type="button" aria-label="Próxima tela">→</button></div><p class="presentation-caption" aria-live="polite"></p><p class="presentation-hint">← → para navegar · Esc para sair · deslize no celular</p>';
  document.body.append(viewer);
  let slides=[],index=0,returnFocus=null,touchX=null;
  const image=viewer.querySelector('.presentation-image');
  function render(){const slide=slides[index];image.src=slide.src;image.alt=slide.label;viewer.querySelector('.presentation-counter').textContent=`${index+1} / ${slides.length}`;viewer.querySelector('.presentation-caption').textContent=slide.label;}
  function next(direction){index=(index+direction+slides.length)%slides.length;render();}
  async function fullscreen(){try{if(!document.fullscreenElement&&viewer.requestFullscreen)await viewer.requestFullscreen();}catch{/* The viewport-sized viewer also works without fullscreen permission. */}}
  viewer.querySelector('.presentation-prev').addEventListener('click',()=>next(-1));
  viewer.querySelector('.presentation-next').addEventListener('click',()=>next(1));
  viewer.querySelector('.presentation-close').addEventListener('click',()=>viewer.close());
  viewer.querySelector('.presentation-fullscreen').addEventListener('click',fullscreen);
  viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();next(e.key==='ArrowLeft'?-1:1);}});
  viewer.addEventListener('close',()=>{if(document.fullscreenElement===viewer)document.exitFullscreen().catch(()=>{});if(returnFocus)returnFocus.focus();});
  image.addEventListener('touchstart',e=>{touchX=e.touches.length===1?e.touches[0].clientX:null;},{passive:true});
  image.addEventListener('touchend',e=>{if(touchX!==null&&e.changedTouches.length){const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>50)next(delta<0?1:-1);}touchX=null;},{passive:true});
  document.querySelectorAll('.support-gallery,.hair-gallery').forEach(gallery=>{
    const button=document.createElement('button');button.className='solid presentation-open';button.type='button';button.textContent='Apresentar telas ⛶';
    const figure=gallery.querySelector('figure');figure.before(button);
    button.addEventListener('click',()=>{
      const thumbnails=[...gallery.querySelectorAll('.concept-thumbnails button')];
      slides=thumbnails.map(b=>({src:b.querySelector('img').getAttribute('src'),label:b.getAttribute('aria-label').replace(/^Ver (proposta \d+: )?/, '')}));
      index=Math.max(0,thumbnails.findIndex(b=>b.getAttribute('aria-pressed')==='true'));returnFocus=button;render();viewer.showModal();fullscreen();
    });
    gallery.querySelector('.concept-main').style.cursor='zoom-in';
    gallery.querySelector('.concept-main').addEventListener('click',()=>button.click());
  });
})();
