'use strict';
(() => {
 const api=window.ortoDemo,$=s=>api.dialog.querySelector(s),bar=document.createElement('div');bar.className='drone-3d-controls';
 bar.innerHTML='<button class="solid drone-3d-toggle" type="button">Voo em 3D ↗</button><button class="solid drone-3d-play" type="button" hidden>Iniciar voo 3D</button><button class="quiet drone-3d-reset" type="button" hidden>Reiniciar voo 3D</button><select class="drone-3d-camera" aria-label="Câmera do voo" hidden><option value="follow">Seguir o drone</option><option value="onboard">Câmera do drone</option></select><span class="drone-3d-status" role="status">Abra um orto para ver o voo sobre ele.</span>';
 api.canvas.before(bar);
 const host=document.createElement('div');host.className='drone-3d-host';host.hidden=true;api.canvas.after(host);
 let active=false,loading=false,renderer,scene,camera,drone,ground,T,texture,last=0,progress=0,flying=false,props=[],yaw=0,drag=null,currentImage=null;
 const toWorld=p=>new T.Vector3((p.x-.5)*40,4,(p.y-.5)*40*api.image.naturalHeight/api.image.naturalWidth);
 function report(text){$('.drone-3d-status').textContent=text;}
 async function setup(){
  if(renderer)return;
  T=window.portfolioTractor3D?.THREE||await import('https://esm.sh/three@0.180.0');
  renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','Voo 3D simulado sobre um ortomosaico plano. Arraste para girar a câmera.');host.append(renderer.domElement);
  scene=new T.Scene();scene.background=new T.Color('#9bb5bd');scene.fog=new T.Fog('#9bb5bd',60,140);camera=new T.PerspectiveCamera(58,1,.05,200);camera.position.set(0,12,16);
  scene.add(new T.HemisphereLight(0xffffff,0x526c48,2));const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(10,25,5);scene.add(sun);
  ground=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide}));ground.rotation.x=-Math.PI/2;scene.add(ground);
  drone=new T.Group();const body=new T.Mesh(new T.BoxGeometry(.65,.22,.9),new T.MeshStandardMaterial({color:0xd7e6d3,metalness:.3,roughness:.5}));drone.add(body);
  for(const x of [-.75,.75])for(const z of [-.7,.7]){const arm=new T.Mesh(new T.CylinderGeometry(.035,.035,1.05,6),new T.MeshStandardMaterial({color:0x273a2a}));arm.position.set(x/2,0,z/2);arm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(x,0,z).normalize());drone.add(arm);const rotor=new T.Group();rotor.position.set(x,.1,z);for(const angle of [0,Math.PI/2]){const blade=new T.Mesh(new T.BoxGeometry(.85,.018,.08),new T.MeshStandardMaterial({color:0x263327}));blade.rotation.y=angle;rotor.add(blade);}props.push(rotor);drone.add(rotor);const lamp=new T.Mesh(new T.SphereGeometry(.04,6,6),new T.MeshBasicMaterial({color:x<0?0xdcfa87:0xff795e}));lamp.position.set(x,0,z);drone.add(lamp);}
  const gimbal=new T.Mesh(new T.SphereGeometry(.12,10,10),new T.MeshStandardMaterial({color:0x172019}));gimbal.position.set(0,-.25,.2);drone.add(gimbal);scene.add(drone);
  renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);});renderer.domElement.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId){yaw+=(e.clientX-drag.x)*.006;drag.x=e.clientX;}});['pointerup','pointercancel','lostpointercapture'].forEach(event=>renderer.domElement.addEventListener(event,()=>drag=null));
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();flying=false;report('Visualização interrompida. Volte ao mapa 2D e atualize a página.');});
 }
 function updateImage(){if(!renderer||!api.image||currentImage===api.image)return;currentImage=api.image;if(texture)texture.dispose();texture=new T.Texture(api.image);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;ground.material.map=texture;ground.material.needsUpdate=true;ground.scale.y=api.image.naturalHeight/api.image.naturalWidth;progress=0;flying=false;}
 function resize(){if(!renderer||!host.clientWidth)return;renderer.setSize(host.clientWidth,440,false);camera.aspect=host.clientWidth/440;camera.updateProjectionMatrix();}
 function restore(){active=false;flying=false;host.hidden=true;api.canvas.hidden=false;$('.drone-3d-toggle').textContent='Voo em 3D ↗';['.drone-3d-play','.drone-3d-reset','.drone-3d-camera'].forEach(s=>$(s).hidden=true);$('.edit-lines').disabled=false;$('.drone-start').disabled=!api.image?false:true;}
 $('.drone-3d-toggle').addEventListener('click',async()=>{if(active){restore();return;}if(loading)return;if(!api.image){report('Primeiro abra o orto GB ou outra imagem.');return;}loading=true;report('Preparando voo 3D…');
  try{await setup();updateImage();active=true;host.hidden=false;api.canvas.hidden=true;$('.drone-3d-toggle').textContent='Voltar ao mapa 2D';['.drone-3d-play','.drone-3d-reset','.drone-3d-camera'].forEach(s=>$(s).hidden=false);$('.edit-lines').disabled=true;$('.drone-start').disabled=true;resize();report('Voo demonstrativo sobre imagem plana, sem modelo de elevação.');}
  catch(error){if(renderer){renderer.dispose();renderer.domElement.remove();renderer=null;}report('Não foi possível carregar o 3D. O mapa 2D continua disponível.');}finally{loading=false;}
 });
 $('.drone-3d-play').addEventListener('click',()=>{if(progress>=api.route.length-1)progress=0;flying=!flying;$('.drone-3d-play').textContent=flying?'Pausar voo 3D':'Continuar voo 3D';});
 $('.drone-3d-reset').addEventListener('click',()=>{progress=0;flying=false;$('.drone-3d-play').textContent='Iniciar voo 3D';report('Rota reiniciada.');});
 window.addEventListener('orto:image',()=>{if(active){updateImage();resize();}});$('.orto-clear').addEventListener('click',restore);api.dialog.addEventListener('close',()=>{flying=false;$('.drone-3d-play').textContent='Continuar voo 3D';});
 new ResizeObserver(resize).observe(host);
 function frame(time){const delta=last?Math.min((time-last)/1000,.05):0;last=time;if(active&&api.dialog.open&&!document.hidden&&renderer){
  if(flying){progress=Math.min(api.route.length-1,progress+delta*.42*Number($('.drone-speed').value));if(progress>=api.route.length-1){flying=false;$('.drone-3d-play').textContent='Repetir voo 3D';report('Voo 3D concluído · captura e altitude simuladas.');}}
  const i=Math.min(Math.floor(progress),api.route.length-2),t=progress-i,a=toWorld(api.route[i]),b=toWorld(api.route[i+1]);drone.position.lerpVectors(a,b,t);drone.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);props.forEach(p=>p.rotation.y+=delta*(flying?35:4));
  if($('.drone-3d-camera').value==='onboard'){drone.visible=false;camera.position.copy(drone.position).add(new T.Vector3(0,.15,0));camera.lookAt(drone.position.x+Math.sin(drone.rotation.y)*4,0,drone.position.z+Math.cos(drone.rotation.y)*4);}
  else{drone.visible=true;const desired=drone.position.clone().add(new T.Vector3(Math.sin(yaw)*8,8,Math.cos(yaw)*8));camera.position.lerp(desired,1-Math.exp(-5*delta));camera.lookAt(drone.position);}
  try{renderer.render(scene,camera);}catch{report('O navegador bloqueou a textura. Abra a imagem pelo botão Abrir meu orto.');flying=false;}
 }requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
})();
