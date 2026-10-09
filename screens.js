'use strict';
(() => {
  const dialog = document.querySelector('#project');
  const gallery = document.createElement('div');
  gallery.className = 'support-gallery';
  gallery.hidden = true;
  gallery.innerHTML = '<figure><img class="concept-main" alt=""><figcaption aria-live="polite"></figcaption></figure><div class="concept-thumbnails" role="group" aria-label="Escolha uma tela do Piloto Ajuda"></div>';
  const note = dialog.querySelector('.note');
  note.before(gallery);
  const originalNote = note.textContent;
  const labels = ['Abertura de chamado — fluxo em quatro telas','Gestão no celular — painel, chamados, filtros e histórico','Atendimento no computador — diagnóstico e informações do chamado'];
  const main = gallery.querySelector('.concept-main');
  const caption = gallery.querySelector('figcaption');
  const thumbnails = gallery.querySelector('.concept-thumbnails');
  function select(index) {
    main.src = `assets/piloto-ajuda/screen-${index + 1}.png`;
    main.alt = `Piloto Ajuda: ${labels[index]}`;
    caption.textContent = `${index + 1} / 3 · ${labels[index]}`;
    [...thumbnails.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  }
  labels.forEach((label,index)=>{
    const button = document.createElement('button');
    button.type = 'button';button.setAttribute('aria-label',`Ver ${label}`);
    const image = document.createElement('img');
    image.src = `assets/piloto-ajuda/screen-${index+1}.png`;image.alt='';image.loading='lazy';
    button.append(image);button.addEventListener('click',()=>select(index));thumbnails.append(button);
  });
  document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
    const support = button.dataset.project === 'support';
    gallery.hidden = !support;
    dialog.classList.toggle('with-screens',support);
    note.textContent = support ? 'Telas do Piloto Ajuda fornecidas por Henrique. As imagens apresentam a interface; esta galeria não executa os atendimentos.' : originalNote;
    if(support)select(0);
    dialog.scrollTop=0;
  }));
})();
