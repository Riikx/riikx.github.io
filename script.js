'use strict';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const terrain = document.querySelector('#terrain'), tc = terrain.getContext('2d');
let world = 'campo', tw = 1, th = 1;
function fit(canvas) {
  const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  const width=r.width || canvas.parentElement.clientWidth;
  const height=r.height || (canvas.id==='drive'?300:canvas.parentElement.clientHeight);
  canvas.width = Math.round(width*d); canvas.height = Math.round(height*d);
  canvas.getContext('2d').setTransform(d,0,0,d,0,0);
  return [width,height];
}
function terrainFrame(time=0) {
  renderWorldScene(tc,tw,th,world,time,reduced);
}
document.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>{world=b.dataset.world;document.querySelectorAll('[data-world]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});document.querySelector('#world-label').textContent=world==='campo'?'01 — CAMPO':'02 — DIGITAL';document.querySelector('#scene-word').innerHTML=world==='campo'?'cultivar<br>possibilidades.':'programar<br>possibilidades.';terrainFrame();}));
const projects={
  training:{category:'01 / TECNOLOGIA AGRÍCOLA · APRENDIZADO',title:'Treinamento de piloto',description:'Um site para explorar sistemas de piloto automático agrícola: componentes, conexões e diagnóstico. O projeto aproxima o aprendizado técnico de uma experiência interativa.',features:['Simulador de montagem','Diagnóstico por sintomas','Visualização 3D','HTML / CSS / JavaScript']},
  support:{category:'02 / TECNOLOGIA AGRÍCOLA · SUPORTE',title:'Piloto Ajuda',description:'Portal de suporte agrícola com chamados, mensagens, histórico, frotas e licenças. Os repositórios consultados incluem implementações em Python/Flask e Next.js/React.',features:['Chamados técnicos','Gestão de frotas','Histórico de atendimento','Flask · React']},
  invite:{category:'03 / DESENVOLVIMENTO WEB · EVENTOS',title:'Convite digital',description:'Um convite de aniversário pensado como experiência: envelope animado, apresentação do evento, confirmação de presença e área administrativa.',features:['Envelope animado','Confirmação de presença','Área administrativa','React / Vite']}
};
const dialog=document.querySelector('#project');
document.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>{const p=projects[b.dataset.project];document.querySelector('#category').textContent=p.category;document.querySelector('#title').textContent=p.title;document.querySelector('#description').textContent=p.description;document.querySelector('#features').replaceChildren(...p.features.map(f=>{const span=document.createElement('span');span.textContent=f;return span;}));dialog.showModal();}));
document.querySelectorAll('.close,.close-bottom').forEach(b=>b.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
const drive=document.querySelector('#drive'),dc=drive.getContext('2d');
const startPosition={x:.15,y:.13};
let dw=1,dh=1,pos={...startPosition},angle=Math.PI/2,path=[{...startPosition}],distance=0,auto=false,targetIndex=0;
const held=new Set();
window.portfolioWalkingKeys=held;
const cabinControls={heading:Math.PI/2,speed:0,turn:0,lookBehind:false};
let previousCabinMode=false;
const route=[];
const lanes=Array.from({length:6},(_,i)=>.15+i*.14);
lanes.forEach((x,index)=>{
  const downward=index%2===0;
  route.push({x,y:downward?.22:.78});
  route.push({x,y:downward?.78:.22});
  if(index<lanes.length-1){
    const center=x+.07,edge=downward?.78:.22;
    // A half ellipse keeps the entire turn on the headland.
    for(let step=1;step<=24;step++){
      const phase=step/24*Math.PI;
      route.push({x:center-.07*Math.cos(phase),y:edge+(downward?1:-1)*.09*Math.sin(phase)});
    }
  }
});
route.push({x:lanes[5],y:.13});
function move(dx,dy){const old={...pos};pos.x=Math.max(.035,Math.min(.965,pos.x+dx));pos.y=Math.max(.045,Math.min(.955,pos.y+dy));const length=Math.hypot(pos.x-old.x,pos.y-old.y);if(length){angle=Math.atan2(dy*dh,dx*dw);path.push({...pos});if(path.length>5000)path.shift();distance+=length*100;document.querySelector('#distance').textContent=`${Math.round(distance)} m de ideias`;}}
const fieldCanvas=document.createElement('canvas');
const nightMask=document.createElement('canvas');
let night=false;
let headlightMode=0;
const lightControls=document.createElement('div');
lightControls.className='field-light-switch';
lightControls.setAttribute('role','group');lightControls.setAttribute('aria-label','Iluminação do campo');
lightControls.innerHTML='<button type="button" data-night="false" aria-pressed="true">☀ Dia</button><button type="button" data-night="true" aria-pressed="false">☾ Noite</button>';
document.querySelector('.drive .actions').after(lightControls);
lightControls.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
  night=button.dataset.night==='true';
  headlightMode=night?1:0;updateHeadlightLabel();
  lightControls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('.panel').classList.toggle('night-field',night);
  driveFrame();
}));
const lightToggle=document.createElement('button');lightToggle.type='button';lightToggle.className='quiet headlight-toggle';
lightControls.after(lightToggle);
function updateHeadlightLabel(){lightToggle.textContent=['L · Faróis desligados','L · Farol baixo','L · Farol alto'][headlightMode];lightToggle.setAttribute('aria-label',lightToggle.textContent+' — clique para alternar');}
function cycleHeadlights(){headlightMode=(headlightMode+1)%3;updateHeadlightLabel();driveFrame();}
lightToggle.addEventListener('click',cycleHeadlights);updateHeadlightLabel();
window.addEventListener('keydown',event=>{
  if(event.key.toLowerCase()!=='l'||event.repeat||event.ctrlKey||event.altKey||event.metaKey||document.querySelector('dialog[open]')||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  const area=document.querySelector('.panel').getBoundingClientRect();
  if(area.bottom<=0||area.top>=innerHeight)return;
  event.preventDefault();cycleHeadlights();
});
function drawNight(){
  const c=nightMask.getContext('2d');
  c.clearRect(0,0,dw,dh);c.fillStyle='rgba(2,8,18,.78)';c.fillRect(0,0,dw,dh);
  c.save();c.translate(pos.x*dw,pos.y*dh);c.rotate(angle);
  const length=headlightMode===2?Math.min(dw*.5,240):Math.min(dw*.33,155),scale=Math.min(1,dw/450),nose=14*scale;
  c.globalCompositeOperation='destination-out';
  for(const side of headlightMode===0?[]:[-1,1]){
    c.save();c.translate(nose,side*4*scale);
    const beam=c.createLinearGradient(0,0,length,0);
    beam.addColorStop(0,'rgba(0,0,0,.96)');beam.addColorStop(.5,'rgba(0,0,0,.7)');beam.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=beam;c.beginPath();c.moveTo(0,-2);c.lineTo(length,-length*.29+side*8);c.lineTo(length,length*.29+side*8);c.lineTo(0,2);c.closePath();c.fill();c.restore();
  }
  c.restore();dc.drawImage(nightMask,0,0,dw,dh);
}
function drawField(){
  fieldCanvas.width=Math.ceil(dw);fieldCanvas.height=Math.ceil(dh);
  const c=fieldCanvas.getContext('2d');
  c.fillStyle='#51432b';c.fillRect(0,0,dw,dh);
  // Soil texture is deterministic, so the ground does not flicker.
  for(let i=0;i<650;i++){const x=((i*73)%997)/997*dw,y=((i*137)%991)/991*dh;c.fillStyle=i%2?'#baa57515':'#201e1830';c.fillRect(x,y,2,1);}
  c.fillStyle='#302d1d';c.fillRect(dw*.065,dh*.22,dw*.87,dh*.56);
  for(let row=0;row<=6;row++){
    const x=(.08+row*.14)*dw;
    c.fillStyle='#24371b';c.fillRect(x-dw*.018,dh*.22,dw*.036,dh*.56);
    for(let y=dh*.24;y<dh*.78;y+=12){
      const lean=Math.sin(row*11+y)*2;
      c.strokeStyle='#6d8d36';c.lineWidth=1.3;c.beginPath();c.moveTo(x,y+5);c.lineTo(x+lean,y-6);c.stroke();
      c.strokeStyle='#8ca84a';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-7,y-8,x-9,y-4);c.moveTo(x,y+1);c.quadraticCurveTo(x+7,y-6,x+9,y-7);c.stroke();
      c.strokeStyle='#426b2b';c.beginPath();c.moveTo(x,y+3);c.quadraticCurveTo(x-6,y-2,x-8,y+1);c.moveTo(x,y+3);c.quadraticCurveTo(x+6,y,x+7,y-2);c.stroke();
    }
  }
  c.strokeStyle='#c7b68b35';c.lineWidth=1;c.setLineDash([4,7]);
  [.13,.87].forEach(y=>{c.beginPath();c.moveTo(dw*.035,dh*y);c.lineTo(dw*.965,dh*y);c.stroke();});
  c.setLineDash([]);c.fillStyle='#d4c6a3';c.font='9px Segoe UI, sans-serif';c.fillText('CARREADOR / CABECEIRA',12,dh*.07);c.fillText('CANA PLANTADA · CORREDORES DE GUIA',12,dh*.97);
}
window.addEventListener('portfolio:tractor-ready',()=>{window.portfolioTractorLoadError=false;driveFrame();});
window.addEventListener('portfolio:tractor-error',()=>{window.portfolioTractorLoadError=true;driveFrame();});
function driveFrame(){
  window.portfolioDriveState={x:pos.x,y:pos.y,angle,night,headlightMode,auto,distance,fieldWidth:dw,fieldHeight:dh,
    reversing:!auto&&Boolean(window.portfolioCabinActive)&&cabinControls.lookBehind,
    steering:!auto&&Boolean(window.portfolioCabinActive)?cabinControls.turn/.85:0};
  if(window.renderCabinView)window.renderCabinView(window.portfolioDriveState);
  dc.drawImage(fieldCanvas,0,0,dw,dh);
  if(night)drawNight();
  if(auto){dc.save();dc.strokeStyle='#dcfa8750';dc.setLineDash([4,6]);dc.lineWidth=1;dc.beginPath();dc.moveTo(pos.x*dw,pos.y*dh);route.slice(targetIndex).forEach(p=>dc.lineTo(p.x*dw,p.y*dh));dc.stroke();dc.restore();}
  dc.strokeStyle='#dcfa87';dc.lineWidth=2;dc.lineJoin='round';dc.beginPath();path.forEach((p,i)=>i?dc.lineTo(p.x*dw,p.y*dh):dc.moveTo(p.x*dw,p.y*dh));dc.stroke();
  dc.save();dc.translate(pos.x*dw,pos.y*dh);dc.rotate(angle);const scale=Math.min(1,dw/450);dc.scale(scale,scale);
  if(window.portfolioTractorSprite){
    dc.rotate(-Math.PI/2);dc.drawImage(window.portfolioTractorSprite,-22,-22,44,44);dc.restore();return;
  }
  dc.restore();
  dc.save();dc.fillStyle='#dcefa8';dc.font='12px Segoe UI, sans-serif';dc.textAlign='center';
  dc.fillText(window.portfolioTractorLoadError?'Não foi possível carregar o trator 3D. Atualize para tentar novamente.':'Carregando trator 3D…',dw/2,dh/2);
  dc.restore();
}
function setAuto(value){auto=value;document.querySelector('#auto').setAttribute('aria-pressed',String(value));document.querySelector('#auto').textContent=value?'Pausar piloto automático ↗':'Ativar piloto automático ↗';document.querySelector('#mode').textContent=value?'PILOTO AUTOMÁTICO':'MANUAL';}
document.querySelector('#auto').addEventListener('click',()=>{if(!auto){if(targetIndex>=route.length){pos={...startPosition};path=[{...pos}];targetIndex=0;}const inCrop=pos.y>.22&&pos.y<.78;const lane=lanes.reduce((best,x,i)=>Math.abs(x-pos.x)<Math.abs(lanes[best]-pos.x)?i:best,0);if(inCrop){pos.x=lanes[lane];path.push({...pos});targetIndex=lane*26+1;}else if(targetIndex===0){pos={...startPosition};path=[{...pos}];}held.clear();}setAuto(!auto);});
document.querySelector('#reset').addEventListener('click',()=>{setAuto(false);pos={...startPosition};path=[{...pos}];angle=Math.PI/2;cabinControls.heading=Math.PI/2;cabinControls.speed=0;cabinControls.turn=0;cabinControls.lookBehind=false;distance=0;targetIndex=0;held.clear();document.querySelector('#distance').textContent='0 m de ideias';driveFrame();});
drive.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();held.add(e.key);setAuto(false);}});drive.addEventListener('keyup',e=>held.delete(e.key));drive.addEventListener('blur',()=>held.clear());
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.key);setAuto(false);});['pointerup','pointercancel','lostpointercapture','blur'].forEach(name=>b.addEventListener(name,()=>held.delete(b.dataset.key)));b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();held.add(b.dataset.key);setAuto(false);}});b.addEventListener('keyup',()=>held.delete(b.dataset.key));});
let last=0;
function frame(time){
  const delta=Math.min((time-last)/1000,.05);last=time;
  if(!document.hidden){
    if(!reduced)terrainFrame(time);
    const cabinMode=Boolean(window.portfolioCabinActive);
    if(cabinMode!==previousCabinMode){held.clear();cabinControls.speed=0;cabinControls.turn=0;cabinControls.heading=Math.atan2(Math.sin(angle)*25/dh,Math.cos(angle)*40/dw);cabinControls.lookBehind=false;previousCabinMode=cabinMode;}
    if(window.portfolioOnFoot){
      if(auto)setAuto(false);
      cabinControls.speed=0;cabinControls.turn=0;cabinControls.lookBehind=false;
    }else if(auto){
      cabinControls.lookBehind=false;
      cabinControls.speed=0;cabinControls.turn=0;
      const t=route[targetIndex],dx=t.x-pos.x,dy=t.y-pos.y,length=Math.hypot(dx,dy),step=delta*.2;
      if(length<=step){move(dx,dy);targetIndex++;if(targetIndex>=route.length)setAuto(false);}else move(dx/length*step,dy/length*step);
      cabinControls.heading=Math.atan2(Math.sin(angle)*25/dh,Math.cos(angle)*40/dw);
    }else if(cabinMode){
      if(held.has('ArrowDown')&&!held.has('ArrowUp'))cabinControls.lookBehind=true;
      if(held.has('ArrowUp'))cabinControls.lookBehind=false;
      const movement=stepCabinControls(cabinControls,held,delta);
      move(movement.dx,movement.dy);
      // Reverse changes travel direction, never the driver's viewing direction.
      angle=Math.atan2(Math.sin(cabinControls.heading)*dh/25,Math.cos(cabinControls.heading)*dw/40);
    }else{
      const s=delta*.3;move((Number(held.has('ArrowRight'))-Number(held.has('ArrowLeft')))*s,(Number(held.has('ArrowDown'))-Number(held.has('ArrowUp')))*s);
    }
    driveFrame();
  }
  requestAnimationFrame(frame);
}
function resize(){[tw,th]=fit(terrain);[dw,dh]=fit(drive);nightMask.width=Math.ceil(dw);nightMask.height=Math.ceil(dh);drawField();terrainFrame();driveFrame();}
window.addEventListener('resize',resize);window.addEventListener('blur',()=>held.clear());document.addEventListener('visibilitychange',()=>held.clear());resize();requestAnimationFrame(frame);
