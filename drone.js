'use strict';
(() => {
  const node=document.createElement('button');node.className='node drone-node';node.innerHTML='<i>⌘</i><span><small>05 / DEMONSTRAÇÃO</small>Drone & linhas ↗</span>';document.querySelector('.map').append(node);
  const dialog=document.createElement('dialog');dialog.className='drone-demo';dialog.setAttribute('aria-label','Demonstração de voo e reconstrução de linhas');
  dialog.innerHTML='<button class="close" aria-label="Fechar demonstração">×</button><p class="eyebrow">05 / DRONE × AGRICULTURA DE PRECISÃO</p><h2>Do voo à linha.</h2><p class="drone-disclaimer">DEMONSTRAÇÃO · Campo ilustrativo, capturas e desvios fictícios. Sem processamento fotogramétrico ou medição real.</p><div class="drone-layout"><aside><p class="eyebrow">01 / PLANEJE O LEVANTAMENTO</p><label>Área de captura<select class="drone-area"><option value="full">Talhão completo</option><option value="center">Faixa central</option></select></label><label>Velocidade da simulação<input class="drone-speed" type="range" min="1" max="3" value="1" step="1"></label><div class="actions"><button class="solid drone-start">Iniciar voo ↗</button><button class="quiet drone-reset">Recomeçar</button></div><p class="drone-status" role="status">Pronto para decolar.</p><progress class="drone-progress" value="0" max="100" aria-label="Progresso do voo"></progress><div class="drone-stats"><span>CAPTURAS SIMULADAS<b class="drone-count">0</b></span><span>COBERTURA DA ROTA<b class="drone-coverage">0%</b></span></div><div class="drone-compare" hidden><p class="eyebrow">02 / COMPARE AS LINHAS</p><label><input class="drone-original" type="checkbox" checked> Linha original <span class="original-key"></span></label><label><input class="drone-rebuilt" type="checkbox" checked> Linha reconstruída <span class="rebuilt-key"></span></label><label>Modo de comparação<select class="drone-view"><option value="overlay">Sobreposição</option><option value="split">Antes / depois</option></select></label><label class="drone-split-label" hidden>Divisão da imagem<input class="drone-split" type="range" min="5" max="95" value="50"></label><label>Linha analisada<select class="drone-line"><option value="0">Linha 1</option><option value="1">Linha 2</option><option value="2">Linha 3</option><option value="3">Linha 4</option><option value="4">Linha 5</option><option value="5">Linha 6</option></select></label><div class="drone-result"><span>DESVIO MÉDIO ILUSTRATIVO</span><b class="drone-deviation"></b><small>Valores gerados para demonstrar a comparação.</small></div></div></aside><div><div class="drone-map-toolbar"><span class="drone-map-title">ROTA DE VOO / VISTA SUPERIOR</span><button class="quiet drone-fullscreen">Ampliar ⛶</button></div><canvas class="drone-map" role="img" aria-label="Talhão demonstrativo com rota do drone e comparação de linhas"></canvas><div class="drone-map-legend"><span>Talhão ilustrativo · Sem coordenadas geográficas</span><span class="drone-map-note">A rota representa o voo; as linhas agrícolas aparecem após a captura.</span></div><p class="note">Em um levantamento real, a comparação depende de imagens processadas, georreferenciamento e validação da precisão. Aqui, a imagem e as linhas são desenhadas para apresentar o fluxo de trabalho.</p></div></div>';
  document.body.append(dialog);
  const imageControls=document.createElement('div');imageControls.className='drone-image-controls';
  imageControls.innerHTML='<label>Detalhe da linha<select class="drone-zoom"><option value="1">Visão geral</option><option value="4" selected>Aproximar 4×</option><option value="8">Aproximar 8×</option></select></label>';
  dialog.querySelector('.drone-map').after(imageControls);
  imageControls.append(dialog.querySelector('.drone-split-label'));
  const ortoControls=document.createElement('div');ortoControls.className='orto-controls';
  ortoControls.innerHTML='<label class="solid orto-open">Abrir meu orto ↗<input type="file" class="orto-file" accept="image/png,image/jpeg,image/webp"></label><button type="button" class="quiet orto-clear" hidden>Usar campo demonstrativo</button><p class="orto-status" role="status">Você pode abrir uma imagem PNG, JPG ou WebP do seu computador.</p>';
  imageControls.before(ortoControls);
  const $=s=>dialog.querySelector(s),canvas=$('.drone-map'),ctx=canvas.getContext('2d');
  let width=1,height=1,route=[],travel=0,running=false,complete=false,shots=0,last=0;
  let ortoImage=null,ortoURL=null,ortoRequest=0;
  let detectedStreets=[],detectWorker=null;
  const detectionControls=document.createElement('div');detectionControls.className='cane-detect-controls';detectionControls.hidden=true;
  detectionControls.innerHTML='<button type="button" class="solid detect-cane">Traçar linhas sobre a cana ↗</button><label><input class="detect-visible" type="checkbox" checked> Mostrar linhas sugeridas</label><p class="detect-status" role="status">Detecção experimental pela imagem. Confira os traçados antes de usar.</p>';
  ortoControls.after(detectionControls);
  function clearDetection(){detectedStreets=[];if(detectWorker){detectWorker.terminate();detectWorker=null;}$('.detect-cane').disabled=false;$('.detect-status').textContent='Detecção experimental pela imagem. Confira os traçados antes de usar.';}
  const ortoInput=$('.orto-file');
  function showOrto(image,name){
    clearDetection();detectionControls.hidden=false;
    ['.drone-original','.drone-rebuilt','.drone-line'].forEach(selector=>$(selector).closest('label').hidden=true);$('.drone-result').hidden=true;
    ortoImage=image;$('.orto-clear').hidden=false;
    window.dispatchEvent(new CustomEvent('orto:image',{detail:{name,image}}));
    $('.orto-status').textContent=name+' · Imagem real; linhas e desvios da demonstração permanecem fictícios.';
    $('.drone-zoom').value='1';$('.drone-original').checked=false;$('.drone-rebuilt').checked=false;
    complete=true;travel=route.length-1;finish();
    $('.drone-map-title').textContent='SEU ORTO / PRÉVIA VISUAL';
    $('.drone-map-note').textContent='Sem alinhamento geográfico · Linhas demonstrativas desligadas';
    $('.drone-status').textContent='Imagem carregada. Nenhuma linha real foi extraída ou comparada.';
    draw();
  }
  const exampleButton=document.createElement('button');exampleButton.type='button';exampleButton.className='solid';exampleButton.textContent='Ver orto GB ↗';
  ortoControls.prepend(exampleButton);
  exampleButton.addEventListener('click',()=>{
    const request=++ortoRequest,image=new Image();$('.orto-status').textContent='Carregando GB.jpg…';
    image.onload=()=>{if(request!==ortoRequest)return;if(ortoURL)URL.revokeObjectURL(ortoURL);ortoURL=null;showOrto(image,'GB.jpg');};
    image.onerror=()=>{if(request===ortoRequest)$('.orto-status').textContent='Não foi possível abrir GB.jpg. Use Abrir meu orto para selecionar o arquivo.';};
    image.src='assets/orto/GB.jpg';
  });
  ortoInput.addEventListener('change',()=>{
    const file=ortoInput.files[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){ $('.orto-status').textContent='Use PNG, JPG ou WebP. Exporte GeoTIFF para uma imagem antes de abrir.';return;}
    const request=++ortoRequest,url=URL.createObjectURL(file),image=new Image();
    $('.orto-status').textContent='Carregando sua imagem…';
    image.onload=()=>{
      if(request!==ortoRequest){URL.revokeObjectURL(url);return;}
      if(ortoURL)URL.revokeObjectURL(ortoURL);ortoURL=url;ortoImage=image;
      showOrto(image,file.name);ortoInput.value='';
    };
    image.onerror=()=>{URL.revokeObjectURL(url);if(request===ortoRequest)$('.orto-status').textContent='Não foi possível abrir essa imagem. Tente uma versão PNG ou JPG menor.';};
    image.src=url;
  });
  $('.orto-clear').addEventListener('click',()=>{ortoRequest++;clearDetection();detectionControls.hidden=true;['.drone-original','.drone-rebuilt','.drone-line'].forEach(selector=>$(selector).closest('label').hidden=false);$('.drone-result').hidden=false;if(ortoURL)URL.revokeObjectURL(ortoURL);ortoURL=null;ortoImage=null;$('.orto-clear').hidden=true;$('.orto-status').textContent='Campo demonstrativo restaurado.';$('.drone-reset').click();});
  $('.detect-visible').addEventListener('change',draw);
  $('.detect-cane').addEventListener('click',async()=>{
    if(!ortoImage)return;
    const request=ortoRequest;$('.detect-cane').disabled=true;$('.detect-status').textContent='Analisando a direção das fileiras e localizando o centro das canas…';
    await new Promise(resolve=>setTimeout(resolve,30));
    try{
      const analysis=document.createElement('canvas'),scale=Math.min(1,720/Math.max(ortoImage.naturalWidth,ortoImage.naturalHeight));analysis.width=Math.round(ortoImage.naturalWidth*scale);analysis.height=Math.round(ortoImage.naturalHeight*scale);
      const context=analysis.getContext('2d',{willReadFrequently:true});context.drawImage(ortoImage,0,0,analysis.width,analysis.height);
      const pixels=context.getImageData(0,0,analysis.width,analysis.height).data;
      const result=await new Promise((resolve,reject)=>{
        const source=detectCaneStreets.toString()+';onmessage=e=>{try{postMessage(detectCaneStreets(e.data.pixels,e.data.width,e.data.height));}catch(error){postMessage({error:error.message});}}';
        const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
        try{detectWorker=new Worker(url);URL.revokeObjectURL(url);detectWorker.onmessage=e=>{detectWorker.terminate();detectWorker=null;e.data.error?reject(Error(e.data.error)):resolve(e.data);};detectWorker.onerror=()=>{detectWorker.terminate();detectWorker=null;reject(Error('Não foi possível analisar a imagem.'));};detectWorker.postMessage({pixels,width:analysis.width,height:analysis.height},[pixels.buffer]);}
        catch{URL.revokeObjectURL(url);try{resolve(detectCaneStreets(pixels,analysis.width,analysis.height));}catch(error){reject(error);}}
      });
      if(request!==ortoRequest)return;
      detectedStreets=result.lines;$('.detect-visible').checked=true;
      window.dispatchEvent(new CustomEvent('orto:lines'));
      $('.detect-status').textContent=result.lines.length?`${result.lines.length} fileiras de cana sugeridas · direção ${result.angle.toFixed(1)}°. Confira falhas, curvas e carreadores.`:'Não encontrei fileiras com padrão suficiente nesta imagem. Tente outra área do orto.';
      $('.drone-map-note').textContent='Ciano: fileiras de cana sugeridas pela imagem · Sem validação de precisão';draw();
    }catch(error){if(request===ortoRequest)$('.detect-status').textContent=error.name==='SecurityError'?'O navegador bloqueou a leitura desta imagem local. Clique em Abrir meu orto e selecione GB.jpg para permitir a análise.':'Não foi possível analisar o orto. Tente uma imagem menor ou outra área.';}
    finally{if(request===ortoRequest)$('.detect-cane').disabled=false;}
  });
  function drawDetected(){
    if(!$('.detect-visible').checked||!detectedStreets.length)return;
    const split=$('.drone-view').value==='split',edge=Number($('.drone-split').value)/100*width;
    ctx.save();if(split){ctx.beginPath();ctx.rect(edge,0,width-edge,height);ctx.clip();}comparisonTransform();
    const scale=Math.min(width/ortoImage.naturalWidth,height/ortoImage.naturalHeight),w=ortoImage.naturalWidth*scale,h=ortoImage.naturalHeight*scale,left=(width-w)/2,top=(height-h)/2;
    ctx.strokeStyle='#61f6e1';ctx.lineWidth=1.5/Number($('.drone-zoom').value);
    detectedStreets.forEach(points=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(left+p.x*w,top+p.y*h):ctx.moveTo(left+p.x*w,top+p.y*h));ctx.stroke();});ctx.restore();
    if(split){ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(edge,0);ctx.lineTo(edge,height);ctx.stroke();ctx.fillStyle='#061e1ae0';ctx.fillRect(edge-18,height/2-16,36,32);ctx.fillStyle='#fff';ctx.font='18px Segoe UI';ctx.fillText('↔',edge-10,height/2+6);}
  }
  const crop={left:.1,right:.9,top:.12,bottom:.88};
  const lanes=Array.from({length:6},(_,i)=>.19+i*.124);
  const fieldWidthMeters=60; // Illustrative scale only, not a geographic measurement.
  const offset=(y,line)=>.008*Math.sin(y*15+line*.8)+.005*Math.sin(y*31+line)+.003;
  function buildRoute(){route=[];const central=$('.drone-area').value==='center'; $('.drone-line').value=central?'2':'0'; [...$('.drone-line').options].forEach((option,i)=>option.disabled=central&&i!==2&&i!==3); const left=central?.34:.13,right=central?.66:.87;for(let row=0;row<7;row++){const y=.16+row*.112;route.push({x:row%2?right:left,y});route.push({x:row%2?left:right,y});}travel=0;shots=0;complete=false;running=false;$('.drone-compare').hidden=true;$('.drone-area').disabled=false;$('.drone-start').textContent='Iniciar voo ↗';$('.drone-status').textContent='Pronto para decolar.';updateStats();draw();}
  function updateStats(){const percentage=complete?100:Math.floor(travel/(route.length-1)*100);$('.drone-progress').value=percentage;$('.drone-count').textContent=shots;$('.drone-coverage').textContent=percentage+'%';}
  function fit(){const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
  function field(){if(ortoImage){ctx.fillStyle='#0c160c';ctx.fillRect(0,0,width,height);const scale=Math.min(width/ortoImage.naturalWidth,height/ortoImage.naturalHeight),w=ortoImage.naturalWidth*scale,h=ortoImage.naturalHeight*scale;ctx.drawImage(ortoImage,(width-w)/2,(height-h)/2,w,h);return;}ctx.fillStyle='#6b5837';ctx.fillRect(0,0,width,height);for(let i=0;i<1000;i++){ctx.fillStyle=i%3?'#d3c08b0b':'#10200b12';ctx.fillRect(((i*71)%997)/997*width,((i*139)%991)/991*height,3,2);}ctx.fillStyle='#344c27';ctx.fillRect(crop.left*width,crop.top*height,(crop.right-crop.left)*width,(crop.bottom-crop.top)*height);for(let row=0;row<=6;row++){const x=(.128+row*.124)*width;ctx.fillStyle=row%2?'#657c36':'#597132';ctx.fillRect(x-width*.027,crop.top*height,width*.054,(crop.bottom-crop.top)*height);for(let y=crop.top*height;y<crop.bottom*height;y+=7){ctx.strokeStyle='#93a65770';ctx.beginPath();ctx.moveTo(x-8,y+3);ctx.lineTo(x,y-2);ctx.lineTo(x+8,y+3);ctx.stroke();}}ctx.strokeStyle='#e8e5ce66';ctx.setLineDash([6,5]);ctx.strokeRect(crop.left*width,crop.top*height,(crop.right-crop.left)*width,(crop.bottom-crop.top)*height);ctx.setLineDash([]);}
  function plotLine(index,rebuilt,highlight){if($('.drone-area').value==='center'&&index!==2&&index!==3)return;ctx.beginPath();for(let step=0;step<=100;step++){const y=.14+step/100*.72,x=lanes[index]+(rebuilt?offset(y,index):0);step?ctx.lineTo(x*width,y*height):ctx.moveTo(x*width,y*height);}ctx.strokeStyle=rebuilt?'#ffbd73':'#dafa8a';ctx.lineWidth=(highlight?3:1)/Number($('.drone-zoom').value);ctx.globalAlpha=highlight?1:.45;ctx.stroke();ctx.globalAlpha=1;}
  function comparisonTransform(){const zoom=Number($('.drone-zoom').value),line=Number($('.drone-line').value);if(zoom>1){const center=ortoImage ? .5 : lanes[line];ctx.translate(width/2-center*width*zoom,height/2-height*.5*zoom);ctx.scale(zoom,zoom);}}
  function compare(){const line=Number($('.drone-line').value),split=$('.drone-view').value==='split',edge=Number($('.drone-split').value)/100*width;
    if(ortoImage){drawDetected();if(window.ortoEditor)window.ortoEditor.render(ctx);$('.drone-deviation').textContent='Sem referência';return;}
    function layer(rebuilt,left,right){ctx.save();ctx.beginPath();ctx.rect(left,0,right-left,height);ctx.clip();comparisonTransform();if($(rebuilt?'.drone-rebuilt':'.drone-original').checked)lanes.forEach((_,i)=>plotLine(i,rebuilt,i===line));ctx.restore();}
    if(split){layer(false,0,edge);layer(true,edge,width);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(edge,0);ctx.lineTo(edge,height);ctx.stroke();ctx.fillStyle='#11200edb';ctx.fillRect(edge-18,height/2-16,36,32);ctx.fillStyle='#fff';ctx.font='18px Segoe UI';ctx.fillText('↔',edge-10,height/2+6);ctx.font='11px Segoe UI';ctx.fillStyle='#dafa8a';ctx.fillText('ORIGINAL',12,24);ctx.fillStyle='#ffbd73';ctx.fillText('RECONSTRUÍDA',Math.max(edge+12,width-110),24);}
    else{layer(false,0,width);layer(true,0,width);if($('.drone-original').checked&&$('.drone-rebuilt').checked){ctx.save();comparisonTransform();ctx.strokeStyle='#f3e9c07a';ctx.lineWidth=.5;for(let y=.2;y<.85;y+=.05){ctx.beginPath();ctx.moveTo(lanes[line]*width,y*height);ctx.lineTo((lanes[line]+offset(y,line))*width,y*height);ctx.stroke();}ctx.restore();}}
    let sum=0;for(let i=0;i<=100;i++)sum+=Math.abs(offset(.14+i/100*.72,line));$('.drone-deviation').textContent=(sum/101*fieldWidthMeters).toFixed(2).replace('.',',')+' m';
  }
  function draw(){if(!width||!height)return;if(complete){ctx.save();comparisonTransform();field();ctx.restore();compare();return;}field();ctx.strokeStyle='#cee8f57a';ctx.lineWidth=1;ctx.setLineDash([5,6]);ctx.beginPath();route.forEach((p,i)=>i?ctx.lineTo(p.x*width,p.y*height):ctx.moveTo(p.x*width,p.y*height));ctx.stroke();ctx.setLineDash([]);for(let shot=0;shot<shots;shot++){const t=Math.min(shot/5,route.length-1),i=Math.floor(t),f=t-i,a=route[i],b=route[Math.min(i+1,route.length-1)];ctx.fillStyle='#dcfa8725';ctx.fillRect((a.x+(b.x-a.x)*f)*width-12,(a.y+(b.y-a.y)*f)*height-10,24,20);}if(route.length){const i=Math.min(Math.floor(travel),route.length-2),f=travel-i,a=route[i],b=route[i+1],x=(a.x+(b.x-a.x)*f)*width,y=(a.y+(b.y-a.y)*f)*height;ctx.save();ctx.translate(x,y);ctx.strokeStyle='#e9f7d6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,-9);ctx.lineTo(9,9);ctx.moveTo(9,-9);ctx.lineTo(-9,9);ctx.stroke();for(const dx of [-9,9])for(const dy of [-9,9]){ctx.beginPath();ctx.arc(dx,dy,5,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#dcfa87';ctx.fillRect(-4,-4,8,8);ctx.restore();}}
  function finish(){running=false;complete=true;$('.drone-compare').hidden=false;$('.drone-area').disabled=true;$('.drone-start').disabled=true;$('.drone-start').textContent='Captura concluída ✓';$('.drone-status').textContent='Voo concluído. Compare as linhas demonstrativas.';$('.drone-map-title').textContent='ORTOMOSAICO ILUSTRATIVO / COMPARAÇÃO';$('.drone-map-note').textContent='Verde: original · Laranja: reconstruída · Escala fictícia';updateStats();draw();}
  $('.drone-start').addEventListener('click',()=>{running=!running;$('.drone-area').disabled=true;$('.drone-start').textContent=running?'Pausar voo':'Continuar voo ↗';$('.drone-status').textContent=running?'Voo em andamento · capturas simuladas.':'Voo pausado.';});
  $('.drone-reset').addEventListener('click',()=>{$('.drone-start').disabled=false;$('.drone-map-title').textContent='ROTA DE VOO / VISTA SUPERIOR';$('.drone-map-note').textContent='A rota representa o voo; as linhas agrícolas aparecem após a captura.';buildRoute();});
  $('.drone-area').addEventListener('change',buildRoute);
  ['.drone-original','.drone-rebuilt','.drone-line','.drone-split'].forEach(selector=>$(selector).addEventListener('input',draw));
  $('.drone-view').addEventListener('change',()=>{$('.drone-split-label').hidden=$('.drone-view').value!=='split';draw();});
  $('.drone-zoom').addEventListener('change',draw);
  let draggingSplit=false;
  function moveSplit(event){if(!complete||$('.drone-view').value!=='split')return;const bounds=canvas.getBoundingClientRect();$('.drone-split').value=Math.max(5,Math.min(95,(event.clientX-bounds.left)/bounds.width*100));draw();}
  canvas.addEventListener('pointerdown',event=>{if(window.ortoEditor?.editing||!complete||$('.drone-view').value!=='split')return;draggingSplit=true;canvas.setPointerCapture(event.pointerId);moveSplit(event);});
  canvas.addEventListener('pointermove',event=>{if(draggingSplit)moveSplit(event);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>draggingSplit=false));
  $('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{running=false;if(!complete&&travel>0){$('.drone-start').textContent='Continuar voo ↗';$('.drone-status').textContent='Voo pausado.';}if(document.fullscreenElement===dialog)document.exitFullscreen().catch(()=>{});});
  $('.drone-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement===dialog)await document.exitFullscreen();else if(dialog.requestFullscreen)await dialog.requestFullscreen();}catch{}});
  node.addEventListener('click',()=>{dialog.showModal();fit();});
  new ResizeObserver(()=>{if(dialog.open)fit();}).observe(canvas);
  function frame(time){const delta=last?Math.min((time-last)/1000,.05):0;last=time;if(dialog.open&&running&&!document.hidden){travel=Math.min(route.length-1,travel+delta*.42*Number($('.drone-speed').value));shots=Math.floor(travel*5)+1;if(travel>=route.length-1)finish();else{updateStats();draw();}}requestAnimationFrame(frame);}
  window.ortoDemo={dialog,canvas,get image(){return ortoImage;},get lines(){return detectedStreets;},set lines(value){detectedStreets=value;},redraw:draw,get route(){return route;},get zoom(){return Number($('.drone-zoom').value);},get size(){return {width,height};},imagePoint(event){const box=canvas.getBoundingClientRect(),zoom=Number($('.drone-zoom').value),scale=Math.min(width/ortoImage.naturalWidth,height/ortoImage.naturalHeight),w=ortoImage.naturalWidth*scale,h=ortoImage.naturalHeight*scale;const x=(event.clientX-box.left-width/2)/zoom+width/2,y=(event.clientY-box.top-height/2)/zoom+height/2;return {x:(x-(width-w)/2)/w,y:(y-(height-h)/2)/h};},screenPoint(p){const zoom=Number($('.drone-zoom').value),scale=Math.min(width/ortoImage.naturalWidth,height/ortoImage.naturalHeight),w=ortoImage.naturalWidth*scale,h=ortoImage.naturalHeight*scale;return {x:width/2+(p.x-.5)*w*zoom,y:height/2+(p.y-.5)*h*zoom};}};
  buildRoute();requestAnimationFrame(frame);
})();
