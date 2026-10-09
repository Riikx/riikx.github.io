'use strict';
(() => {
  const node = document.createElement('button');
  node.className = 'node hair';
  node.innerHTML = '<i>✂</i><span><small>04 / CONCEITOS VISUAIS</small>Salões & barbearias ↗</span>';
  document.querySelector('.map').append(node);
  const gallery = document.createElement('dialog');
  gallery.className = 'hair-gallery';
  gallery.innerHTML = '<button class="close" aria-label="Fechar galeria">×</button><p class="eyebrow">04 / DESIGN CONCEITUAL</p><h2>Salões & barbearias</h2><p class="concept-status">Propostas visuais · Site ainda não desenvolvido</p><p>Seis direções de design para apresentar serviços de beleza, agendamento e uma área de gestão. As telas mostram ideias de interface; os agendamentos e painéis ainda não foram implementados.</p><figure><img class="concept-main" alt=""><figcaption aria-live="polite"></figcaption></figure><div class="concept-thumbnails" role="group" aria-label="Escolha uma proposta visual"></div><p class="note">Nomes, preços, pessoas e informações nas imagens fazem parte dos mockups ilustrativos.</p><button class="solid gallery-return">Voltar ao mundo ↙</button>';
  document.body.append(gallery);
  const labels = ['Barba & Estilo — preto e dourado','Lucas Fernandes — claro e elegante','Barba & Rua — urbano e laranja','Beleza em Dia — leve e turquesa','Lucas Almeida — acolhedor e terracota','Estilo em Dia — moderno e turquesa'];
  const main = gallery.querySelector('.concept-main');
  const caption = gallery.querySelector('figcaption');
  const thumbnails = gallery.querySelector('.concept-thumbnails');
  function select(index) {
    main.src = `assets/hair-designs/concept-${index + 1}.png`;
    main.alt = `Conceito visual ${index + 1}: ${labels[index]}. Mockup de site, não implementado.`;
    caption.textContent = `${index + 1} / 6 · ${labels[index]}`;
    [...thumbnails.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  }
  labels.forEach((label,index)=>{
    const button=document.createElement('button');
    button.type='button';button.setAttribute('aria-label',`Ver proposta ${index+1}: ${label}`);
    const image=document.createElement('img');image.src=`assets/hair-designs/concept-${index+1}.png`;image.alt='';image.loading='lazy';
    button.append(image);button.addEventListener('click',()=>select(index));thumbnails.append(button);
  });
  node.addEventListener('click',()=>{select(0);gallery.showModal();});
  gallery.querySelector('.close').addEventListener('click',()=>gallery.close());
  gallery.querySelector('.gallery-return').addEventListener('click',()=>gallery.close());
  gallery.addEventListener('click',event=>{if(event.target===gallery){const r=gallery.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)gallery.close();}});
})();
