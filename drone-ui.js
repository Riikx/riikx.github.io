'use strict';
(() => {
  const dialog = window.ortoDemo.dialog;
  const $ = selector => dialog.querySelector(selector);
  function fold(title, nodes, className = '') {
    const details = document.createElement('details');
    details.className = `drone-fold ${className}`;
    const summary = document.createElement('summary');
    summary.textContent = title;
    details.append(summary);
    const content = document.createElement('div');
    content.className = 'drone-fold-content';
    content.append(...nodes);
    details.append(content);
    return details;
  }
  const aside = $('.drone-layout aside');
  const planning = fold('Planejar e comparar o voo', [...aside.childNodes]);
  aside.append(planning);
  const map = $('.drone-map');
  const images = $('.orto-controls');
  $('.drone-map-toolbar').before(images);
  const detection = $('.cane-detect-controls');
  const editor = $('.orto-edit-panel');
  const imageControls = $('.drone-image-controls');
  const tools = fold('Linhas e ferramentas', [detection, editor, imageControls], 'drone-line-tools');
  const notice = fold('Sobre esta demonstração', [$('.drone-disclaimer'), $('.drone-map-legend'), $('.drone-layout > div > .note')]);
  notice.querySelector('.drone-fold-content').append($('.orto-clear'));
  $('.orto-open').firstChild.textContent = 'Abrir imagem';
  images.querySelector('button.solid').textContent = 'Exemplo GB';
  window.addEventListener('orto:image', event => {
    $('.orto-status').textContent = `${event.detail.name} · Imagem carregada.`;
    $('.drone-3d-status').textContent = 'Veja a simulação de voo sobre a imagem.';
  });
  map.parentElement.append(tools, notice);
  const comparison = $('.drone-compare');
  const syncTools = () => { tools.hidden = detection.hidden && editor.hidden && comparison.hidden; };
  new MutationObserver(syncTools).observe(detection, {attributes: true, attributeFilter: ['hidden']});
  new MutationObserver(syncTools).observe(editor, {attributes: true, attributeFilter: ['hidden']});
  new MutationObserver(syncTools).observe(comparison, {attributes: true, attributeFilter: ['hidden']});
  syncTools();
  const flight = $('.drone-3d-controls');
  const extra = fold('Câmera e reinício', [$('.drone-3d-camera'), $('.drone-3d-reset')], 'drone-flight-options');
  flight.insertBefore(extra, $('.drone-3d-status'));
  const toggle = $('.drone-3d-toggle');
  const syncFlight = () => {
    const is3D = !$('.drone-3d-host').hidden;
    extra.hidden = !is3D;
    toggle.textContent = is3D ? 'Ver mapa 2D' : 'Ver voo 3D';
    dialog.classList.toggle('drone-is-3d', is3D);
  };
  new MutationObserver(syncFlight).observe($('.drone-3d-host'), {attributes: true, attributeFilter: ['hidden']});
  syncFlight();
})();
