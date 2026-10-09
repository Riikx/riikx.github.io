'use strict';
(() => {
  const section=document.createElement('section');section.className='tractor-explorer';
  section.setAttribute('aria-label','Conheça os componentes do piloto automático');
  section.innerHTML='<div><p class="eyebrow">POR DENTRO DO PILOTO</p><h3>Toque. Descubra.<br>Entenda a conexão.</h3><p class="note">Ilustração conceitual dos componentes. A configuração varia conforme o equipamento.</p></div><div class="tractor-diagram"><svg viewBox="0 0 520 260" aria-hidden="true"><defs><linearGradient id="tractor-body" x2="0" y2="1"><stop stop-color="#afca62"/><stop offset="1" stop-color="#668a35"/></linearGradient></defs><path d="M25 231H495" stroke="#475936"/><rect x="284" y="106" width="124" height="70" rx="12" fill="url(#tractor-body)"/><path d="M159 78h106l30 105H135z" fill="#8daa50"/><path d="M171 90h81l20 68H156z" fill="#244642" stroke="#8da99b" stroke-width="3"/><path d="M211 92v65M163 140h104" stroke="#789a82" stroke-width="3"/><rect x="149" y="65" width="121" height="16" rx="4" fill="#c4db82"/><path d="M150 162h132v39H136z" fill="#789b40"/><rect x="395" y="126" width="14" height="21" rx="3" fill="#ece5ae"/><rect x="310" y="96" width="7" height="17" fill="#719143"/><circle cx="169" cy="191" r="50" fill="#0e160e" stroke="#59654d" stroke-width="3"/><circle cx="169" cy="191" r="25" fill="#a6ba76"/><circle cx="169" cy="191" r="9" fill="#405c29"/><circle cx="367" cy="199" r="36" fill="#0e160e" stroke="#59654d" stroke-width="3"/><circle cx="367" cy="199" r="18" fill="#a6ba76"/><rect x="193" y="54" width="36" height="12" rx="6" fill="#dcfa87"/><rect x="235" y="116" width="22" height="15" rx="3" fill="#dcfa87"/><path d="M239 143l-10 15" stroke="#c8dfa3" stroke-width="4"/></svg><button class="tractor-hotspot antenna" data-part="antenna" aria-pressed="false"><span>01</span> Antena</button><button class="tractor-hotspot monitor" data-part="monitor" aria-pressed="true"><span>02</span> Monitor</button></div><div class="tractor-info" aria-live="polite"><p class="eyebrow part-number"></p><h3 class="part-title"></h3><p class="part-description"></p></div>';
  document.querySelector('.drive').append(section);
  const parts={antenna:{number:'01 / POSICIONAMENTO',title:'Antena',description:'Recebe sinais de posicionamento por satélite usados pelo sistema para localizar a máquina e acompanhar sua posição em relação à linha de guia.'},monitor:{number:'02 / OPERAÇÃO',title:'Monitor',description:'É a interface do operador: apresenta a linha de guia, o posicionamento e as configurações de trabalho. É onde você acompanha e ajusta o sistema.'}};
  function select(key){const part=parts[key];section.querySelector('.part-number').textContent=part.number;section.querySelector('.part-title').textContent=part.title;section.querySelector('.part-description').textContent=part.description;section.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===key)));}
  section.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.part)));
  select('monitor');
  const diagram=section.querySelector('.tractor-diagram');
  const componentButtons=[...diagram.querySelectorAll('[data-part]')];
  const controls=document.createElement('div');controls.className='model-component-controls';
  componentButtons.forEach(button=>{controls.append(button);button.addEventListener('click',()=>{
    if(button.dataset.part==='antenna')document.dispatchEvent(new CustomEvent('training:focus-component',{detail:{component:'nav900'}}));
    if(button.dataset.part==='monitor')document.dispatchEvent(new CustomEvent('training:focus-component',{detail:{component:'display'}}));

  });});
  const model=document.createElement('div');model.className='training-model';
  model.innerHTML='<div id="tractorViewer"><p id="tractorStatus" role="status">Preparando o trator do treinamento…</p><button id="nav900Marker" class="nav-marker" hidden aria-label="Explorar antena NAV-900">Antena ↗</button></div><div class="model-tools"><button id="tractorReset" type="button" class="quiet">Visão geral ↺</button><button id="nav900Focus" type="button" class="quiet" hidden>Ver antena ↗</button><label id="tractorFileLabel" hidden>Selecionar modelo GLB<input id="tractorFile" type="file" accept=".glb"></label></div><p class="note">Mesmo modelo 3D do treinamento · Arraste para girar e use a roda do mouse para aproximar.</p>';
  diagram.replaceChildren(model,controls);
  document.querySelector('#nav900Marker').addEventListener('click',()=>select('antenna'));
  document.querySelector('#nav900Focus').addEventListener('click',()=>select('antenna'));
  const script=document.createElement('script');script.src='training/js/tractor-viewer.js';
  script.onload=()=>{
    document.dispatchEvent(new CustomEvent('training:system',{detail:{hasNav900:true}}));
    const cabin=document.querySelector('.cabin-view');
    if(cabin&&!cabin.hidden)document.dispatchEvent(new CustomEvent('portfolio:load-tractor'));
  };
  script.onerror=()=>{document.querySelector('#tractorStatus').textContent='Não foi possível iniciar o visualizador do treinamento.';};
  document.body.append(script);
})();
