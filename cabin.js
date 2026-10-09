'use strict';
(() => {
  const panel=document.querySelector('.panel'),driveCanvas=document.querySelector('#drive');
  const toolbar=document.createElement('div');toolbar.className='cabin-switch';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Câmera do simulador');
  toolbar.innerHTML='<button type="button" data-camera="top" aria-pressed="true">↧ Vista de cima</button><button type="button" data-camera="cabin" aria-pressed="false">◉ Vista da cabine</button>';
  panel.querySelector('.panel-top').after(toolbar);
  const host=document.createElement('div');host.className='cabin-view';host.hidden=true;
  host.innerHTML='<p class="cabin-message" role="status">Carregando a cabine do trator…</p><div class="cabin-hud" aria-hidden="true"><span class="cabin-guide">LINHA DE GUIA</span><span class="cabin-heading">MANUAL</span></div>';
  driveCanvas.after(host);
  let active=false,renderer,scene,camera,tractor,sky,ambient,sun,headlights=[],visible=true;
  let renderedYaw=null,lastRenderTime=0;
  let lookBack=0;
  let lampAssembly;
  const beamPivots=[];
  let roofLampAssembly;
  let onFoot=false,walker={x:0,z:0,yaw:0},drag=null;
  const exitButton=document.createElement('button');exitButton.type='button';exitButton.className='cabin-exit';exitButton.textContent='F · Sair do trator';exitButton.disabled=true;toolbar.append(exitButton);
  const walkingHelp=document.createElement('p');walkingHelp.className='walking-help';walkingHelp.setAttribute('role','status');walkingHelp.hidden=true;host.append(walkingHelp);
  function clearKeys(){driveCanvas.dispatchEvent(new Event('blur'));}
  function enter(){onFoot=false;window.portfolioOnFoot=false;lookBack=0;walkingHelp.hidden=true;exitButton.textContent='F · Sair do trator';clearKeys();}
  function toggleFoot(){
    if(!active||!renderer||!tractor)return;
    const T=window.portfolioTractor3D.THREE;
    if(onFoot){if(Math.hypot(walker.x-tractor.position.x,walker.z-tractor.position.z)>3){walkingHelp.textContent='Aproxime-se do trator para entrar com F.';return;}enter();}
    else{
      const state=window.portfolioDriveState;
      if(state?.auto)document.querySelector('#auto').click();
      const side=new T.Vector3(-1.9,0,-.5);tractor.localToWorld(side);
      walker={x:side.x,z:side.z,yaw:tractor.rotation.y+Math.PI/2};
      onFoot=true;window.portfolioOnFoot=true;clearKeys();walkingHelp.hidden=false;exitButton.textContent='F · Entrar no trator';
    }
    renderer.domElement.focus();
  }
  exitButton.addEventListener('click',toggleFoot);
  window.addEventListener('keydown',event=>{
    if(!active||!renderer||document.querySelector('dialog[open]')||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    if(event.key.toLowerCase()==='f'){event.preventDefault();if(!event.repeat)toggleFoot();return;}
    if(onFoot&&['w','a','s','d'].includes(event.key.toLowerCase())){event.preventDefault();window.portfolioWalkingKeys.add(event.key.toLowerCase());}
  });
  window.addEventListener('keyup',event=>window.portfolioWalkingKeys?.delete(event.key.toLowerCase()));

  const message=host.querySelector('.cabin-message');
  const worldWidth=40,worldDepth=25;
  const toWorld=(x,y)=>({x:(x-.5)*worldWidth,z:(y-.5)*worldDepth});
  function choose(mode){active=mode==='cabin';window.portfolioCabinActive=active;host.hidden=!active;driveCanvas.hidden=active;
    if(!active&&onFoot)enter();
    toolbar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.camera===mode)));
    host.querySelector('.cabin-guide').textContent='↑ AVANÇAR · ↓ RÉ · ← → VIRAR';
    if(active){if(window.portfolioTractor3D)setup();else document.dispatchEvent(new CustomEvent('portfolio:load-tractor'));if(renderer){resize();window.renderCabinView(window.portfolioDriveState);}}
  }
  toolbar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.camera)));
  function resize(){if(!renderer||!host.clientWidth)return;renderer.setSize(host.clientWidth,320,false);camera.aspect=host.clientWidth/320;camera.updateProjectionMatrix();}
  function setup(){
    if(renderer)return;
    const asset=window.portfolioTractor3D;if(!asset)return;
    const T=asset.THREE;
    try{
      renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
      renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Vista em primeira pessoa da cabine. Use as setas para conduzir o trator.');
      renderer.domElement.addEventListener('keydown',event=>{if(event.key.startsWith('Arrow')){event.preventDefault();driveCanvas.dispatchEvent(new KeyboardEvent('keydown',{key:event.key}));}});
      renderer.domElement.addEventListener('keyup',event=>driveCanvas.dispatchEvent(new KeyboardEvent('keyup',{key:event.key})));
      renderer.domElement.addEventListener('blur',()=>driveCanvas.dispatchEvent(new Event('blur')));
      renderer.domElement.addEventListener('pointerdown',event=>{if(!onFoot)return;drag={id:event.pointerId,x:event.clientX};renderer.domElement.setPointerCapture(event.pointerId);renderer.domElement.focus();});
      renderer.domElement.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;walker.yaw-=(event.clientX-drag.x)*.005;drag.x=event.clientX;});
      ['pointerup','pointercancel','lostpointercapture'].forEach(name=>renderer.domElement.addEventListener(name,()=>drag=null));
      renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();message.hidden=false;message.textContent='A visualização 3D foi interrompida. Use a vista de cima ou atualize a página.';});
      host.prepend(renderer.domElement);scene=new T.Scene();sky=new T.Color('#7eaaaf');scene.background=sky;scene.fog=new T.Fog('#7eaaaf',25,70);
      camera=new T.PerspectiveCamera(76,1,.025,100);
      ambient=new T.HemisphereLight(0xcde8ff,0x47432b,2);sun=new T.DirectionalLight(0xffe4b5,2.5);sun.position.set(12,20,-8);scene.add(ambient,sun);
      const ground=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:0x79613c,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
      const cropGround=new T.Mesh(new T.PlaneGeometry(worldWidth*.87,worldDepth*.56),new T.MeshStandardMaterial({color:0x4f482c,roughness:1}));cropGround.rotation.x=-Math.PI/2;cropGround.position.y=.006;scene.add(cropGround);
      cropGround.receiveShadow=true;
      // Instanced stalks and leaves keep the field light enough for mobile.
      const stalkCount=7*38;
      const stalks=new T.InstancedMesh(new T.CylinderGeometry(.022,.028,1.3,4),new T.MeshStandardMaterial({color:0x668a32,roughness:1}),stalkCount);
      const leaves=new T.InstancedMesh(new T.PlaneGeometry(.13,.8),new T.MeshStandardMaterial({color:0x83a943,side:T.DoubleSide,roughness:1}),stalkCount*4);
      const dummy=new T.Object3D();let n=0,l=0;
      for(let row=0;row<=6;row++)for(let stem=0;stem<38;stem++){
        const p=toWorld(.08+row*.14,.23+stem/37*.54);
        dummy.position.set(p.x,.65,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();stalks.setMatrixAt(n++,dummy.matrix);
        for(let leaf=0;leaf<4;leaf++){const a=leaf*Math.PI/2+row*.2;dummy.position.set(p.x+Math.sin(a)*.23,.78+(leaf%2)*.28,p.z+Math.cos(a)*.23);dummy.rotation.set(.65,a,.25);dummy.updateMatrix();leaves.setMatrixAt(l++,dummy.matrix);}
      }
      scene.add(stalks,leaves);
      tractor=asset.model.clone(true);scene.add(tractor);

      const bounds=new T.Box3().setFromObject(tractor);const lift=-bounds.min.y;
      tractor.userData.groundLift=lift;
      tractor.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
      lampAssembly=new T.Group();lampAssembly.name='Tractor_Headlights';tractor.add(lampAssembly);
      const lampHeight=bounds.min.y+1.1;
      tractor.updateMatrixWorld(true);
      const frontRay=new T.Raycaster();
      const bodyMeshes=[];
      tractor.traverse(node=>{if(node.isMesh&&/BODY_Cuz/i.test(node.name))bodyMeshes.push(node);});
      const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
      const glowContext=glowCanvas.getContext('2d'),gradient=glowContext.createRadialGradient(32,32,0,32,32,32);
      gradient.addColorStop(0,'rgba(255,250,215,1)');gradient.addColorStop(.2,'rgba(255,241,179,.6)');gradient.addColorStop(1,'rgba(255,230,150,0)');glowContext.fillStyle=gradient;glowContext.fillRect(0,0,64,64);
      const glowTexture=new T.CanvasTexture(glowCanvas);
      for(const x of [-.22,.22]){
        // The outer bounds include wheels/weights. Anchor each lamp to the hood itself.
        frontRay.set(new T.Vector3(x,lampHeight,bounds.max.z+1),new T.Vector3(0,0,-1));
        const surface=frontRay.intersectObjects(bodyMeshes,false)[0];
        if(!surface)continue;
        const front=surface.point.z+.008;
        const light=new T.SpotLight(0xffefc2,38,22,Math.PI/9,.65,1.3);
        light.position.set(x,lampHeight,front);light.target.position.set(x,lampHeight-.9,front+12);
        light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.05;light.shadow.camera.far=22;light.shadow.bias=-.0004;
        lampAssembly.add(light,light.target);headlights.push(light);
        const housing=new T.Mesh(new T.CylinderGeometry(.075,.075,.07,12),new T.MeshStandardMaterial({color:0x263025,roughness:.7}));housing.rotation.x=Math.PI/2;housing.position.copy(light.position);housing.position.z-=.045;tractor.add(housing);
        const lens=new T.Mesh(new T.SphereGeometry(.052,12,8),new T.MeshBasicMaterial({color:0xfff2c4,toneMapped:false}));lens.position.copy(light.position);lampAssembly.add(lens);
        const glow=new T.Sprite(new T.SpriteMaterial({map:glowTexture,color:0xffefbe,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.position.copy(light.position);glow.position.z+=.035;glow.scale.set(.4,.4,1);lampAssembly.add(glow);
        const beam=new T.Mesh(new T.ConeGeometry(2.4,10,24,1,true),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexShader:'varying vec2 beamUV; void main(){beamUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 beamUV; void main(){float fade=pow(beamUV.y,2.0)*0.045;gl_FragColor=vec4(1.0,0.92,0.65,fade);}'}));
        const beamPivot=new T.Group();beamPivot.position.copy(light.position);beamPivot.rotation.x=.075;beam.rotation.x=-Math.PI/2;beam.position.z=5;beamPivot.add(beam);lampAssembly.add(beamPivot);
        beamPivots.push(beamPivot);
      }
      // Roof lamps illuminate only with high beam, anchored to the roof's front surface.
      roofLampAssembly=new T.Group();roofLampAssembly.name='Tractor_Roof_High_Beams';tractor.add(roofLampAssembly);
      const bodyBounds=new T.Box3();bodyMeshes.forEach(mesh=>bodyBounds.union(new T.Box3().setFromObject(mesh)));
      const roofLampHeight=bodyBounds.max.y-.28;
      for(const x of [-.28,.28]){
        frontRay.set(new T.Vector3(x,roofLampHeight,bounds.max.z+1),new T.Vector3(0,0,-1));
        const roofSurface=frontRay.intersectObjects(bodyMeshes,false)[0];
        if(!roofSurface)continue;
        const origin=new T.Vector3(x,roofLampHeight,roofSurface.point.z+.012);
        const light=new T.SpotLight(0xf5f7de,48,35,Math.PI/8,.7,1.3);
        light.position.copy(origin);light.target.position.set(x,origin.y-.8,origin.z+24);roofLampAssembly.add(light,light.target);
        const lens=new T.Mesh(new T.SphereGeometry(.045,12,8),new T.MeshBasicMaterial({color:0xfff8dc,toneMapped:false}));lens.position.copy(origin);roofLampAssembly.add(lens);
        const halo=new T.Sprite(new T.SpriteMaterial({map:glowTexture,color:0xfff3cc,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.position.copy(origin);halo.position.z+=.015;halo.scale.set(.32,.32,1);roofLampAssembly.add(halo);
        const beam=new T.Mesh(new T.ConeGeometry(3.2,16,24,1,true),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexShader:'varying vec2 beamUV; void main(){beamUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 beamUV; void main(){gl_FragColor=vec4(0.95,0.97,0.8,pow(beamUV.y,2.0)*0.025);}'}));
        const pivot=new T.Group();pivot.position.copy(origin);pivot.rotation.x=.034;beam.rotation.x=-Math.PI/2;beam.position.z=8;pivot.add(beam);roofLampAssembly.add(pivot);
      }
      const guideMaterial=new T.LineDashedMaterial({color:0xdcfa87,dashSize:.3,gapSize:.25,transparent:true,opacity:.65});
      for(let lane=0;lane<6;lane++){const a=toWorld(.15+lane*.14,.22),b=toWorld(.15+lane*.14,.78);const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(a.x,.03,a.z),new T.Vector3(b.x,.03,b.z)]),guideMaterial);line.computeLineDistances();scene.add(line);}
      message.hidden=true;exitButton.disabled=false;resize();
    }catch(error){message.hidden=false;message.textContent='Não foi possível abrir a cabine 3D. A vista de cima continua disponível.';if(renderer){renderer.dispose();renderer.domElement.remove();}renderer=null;}
  }
  window.renderCabinView=state=>{
    if(!active||!visible||!renderer||!state||document.hidden)return;
    const T=window.portfolioTractor3D.THREE,p=toWorld(state.x,state.y);
    tractor.position.set(p.x,tractor.userData.groundLift,p.z);
    // The original tractor's longitudinal axis is Z; map motion is X/Y.
    const heading=Math.atan2(Math.sin(state.angle)*worldDepth/state.fieldHeight,Math.cos(state.angle)*worldWidth/state.fieldWidth);
    const targetYaw=Math.PI/2-heading,now=performance.now();
    const elapsed=lastRenderTime?Math.min((now-lastRenderTime)/1000,.05):0;lastRenderTime=now;
    if(renderedYaw===null)renderedYaw=targetYaw;
    const difference=Math.atan2(Math.sin(targetYaw-renderedYaw),Math.cos(targetYaw-renderedYaw));
    renderedYaw+=difference*(1-Math.exp(-9*elapsed));

    tractor.rotation.y=renderedYaw;
    tractor.updateMatrixWorld(true);
    if(onFoot){
      const keys=window.portfolioWalkingKeys;
      walker.yaw+=(Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight')))*elapsed*1.5;
      const forward=Number(keys.has('ArrowUp')||keys.has('w'))-Number(keys.has('ArrowDown')||keys.has('s'));
      const strafe=Number(keys.has('d'))-Number(keys.has('a'));
      const length=Math.max(1,Math.hypot(forward,strafe)),speed=elapsed*2.4/length;
      const x=Math.max(-24,Math.min(24,walker.x+(Math.sin(walker.yaw)*forward-Math.cos(walker.yaw)*strafe)*speed));
      const z=Math.max(-16,Math.min(16,walker.z+(Math.cos(walker.yaw)*forward+Math.sin(walker.yaw)*strafe)*speed));
      if(Math.hypot(x-tractor.position.x,z-tractor.position.z)>1.45){walker.x=x;walker.z=z;}
      camera.position.set(walker.x,1.65,walker.z);camera.lookAt(walker.x+Math.sin(walker.yaw)*4,1.62,walker.z+Math.cos(walker.yaw)*4);
      const nearby=Math.hypot(walker.x-tractor.position.x,walker.z-tractor.position.z)<=3;
      const hint=nearby?'F · Entrar no trator | Setas ou WASD para caminhar · Arraste para olhar':'Aproxime-se do trator para entrar · Setas ou WASD para caminhar · Arraste para olhar';
      if(walkingHelp.textContent!==hint)walkingHelp.textContent=hint;
    }else{
      const targetLook=state.reversing?Math.PI:0;
      lookBack+=(targetLook-lookBack)*(1-Math.exp(-3.2*elapsed));
      const eye=new T.Vector3(0,.72,-.52);
      // Turn the driver's head around the eye position, without rotating the tractor.
      const look=new T.Vector3(Math.sin(lookBack)*4,.62,-.52+Math.cos(lookBack)*4);
      tractor.localToWorld(eye);tractor.localToWorld(look);camera.position.copy(eye);camera.lookAt(look);
    }
    sky.set(state.night?'#07111d':'#7eaaaf');scene.fog.color.copy(sky);ambient.intensity=state.night?.28:2;sun.intensity=state.night?.08:2.5;
    lampAssembly.visible=state.headlightMode>0;
    const high=state.headlightMode===2;
    roofLampAssembly.visible=high;
    headlights.forEach(light=>{light.intensity=high?65:38;light.distance=high?35:22;light.target.position.y=light.position.y-(high?.25:.9);light.target.position.z=light.position.z+(high?22:12);if(light.shadow.camera.far!==light.distance){light.shadow.camera.far=light.distance;light.shadow.camera.updateProjectionMatrix();}});
    beamPivots.forEach(beam=>{beam.rotation.x=high?.015:.075;beam.scale.set(high?1.25:1,high?1.25:1,high?1.7:1);});
    host.querySelector('.cabin-heading').textContent=onFoot?'A PÉ':state.auto?'PILOTO AUTOMÁTICO':state.reversing?'RÉ · OLHANDO PARA TRÁS':'MANUAL';
    renderer.render(scene,camera);
  };
  window.addEventListener('portfolio:tractor-ready',()=>{if(active){setup();window.renderCabinView(window.portfolioDriveState);}});
  window.addEventListener('portfolio:tractor-error',()=>{message.hidden=false;message.textContent='Não foi possível carregar o modelo. Volte à vista de cima ou tente novamente.';});
  new ResizeObserver(()=>{resize();if(active)window.renderCabinView(window.portfolioDriveState);}).observe(host);
  new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);}).observe(panel);
})();
