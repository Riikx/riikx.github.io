'use strict';
(() => {
  const stories={
    training:{problem:'Conhecer os componentes e entender como eles se conectam é uma parte importante do aprendizado sobre piloto automático agrícola.',solution:'Reunir equipamentos, simulação de montagem e diagnóstico por sintomas em um site de treinamento interativo.',screens:'O projeto inclui consulta de componentes, simulador e visualização 3D. As capturas dessa interface ainda serão adicionadas ao portfólio.'},
    support:{problem:'Um atendimento agrícola envolve informações do equipamento, sintomas, fotos e histórico. Esses dados precisam estar organizados para apoiar o suporte.',solution:'Um portal que centraliza abertura de chamados, diagnóstico, comunicação, frotas e acompanhamento do atendimento.',screens:'Explore abaixo o fluxo de abertura, a gestão no celular e o painel de atendimento no computador.'},
    invite:{problem:'Um convite digital precisa apresentar o evento e facilitar a confirmação de presença em uma experiência coerente.',solution:'Um convite com envelope animado, informações do evento, confirmação de presença e área administrativa.',screens:'O projeto contém a experiência do convite e o fluxo de confirmação. As capturas dessas telas ainda serão adicionadas ao portfólio.'},
    hair:{problem:'Profissionais de beleza precisam apresentar seus serviços e transmitir a personalidade do atendimento também na internet.',solution:'Explorar seis direções visuais, com propostas de apresentação dos serviços, agendamento e painel de gestão. São conceitos; o site ainda não foi desenvolvido.',screens:'Veja as seis propostas abaixo. As funcionalidades e informações nas imagens são ilustrativas.'}
  };
  function makeStory(){
    const element=document.createElement('div');element.className='project-story';
    ['O problema','A solução','As telas'].forEach((label,index)=>{
      const part=document.createElement('section');
      const heading=document.createElement('h3');heading.textContent=`0${index+1} / ${label}`;
      const text=document.createElement('p');part.append(heading,text);element.append(part);
    });return element;
  }
  function fill(element,key){const story=stories[key];element.querySelectorAll('section p').forEach((p,i)=>p.textContent=[story.problem,story.solution,story.screens][i]);}
  const dialog=document.querySelector('#project'),story=makeStory();
  document.querySelector('#features').after(story);
  document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>fill(story,button.dataset.project)));
  const hairDialog=document.querySelector('.hair-gallery'),hairStory=makeStory();
  hairDialog.querySelector('figure').before(hairStory);fill(hairStory,'hair');
})();
