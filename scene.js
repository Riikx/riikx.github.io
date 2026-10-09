'use strict';
// One shared scene: crop lines become layout guides, tractor becomes cursor.
let sceneBlend = 0;
let sceneTime = 0;
function renderWorldScene(ctx, width, height, world, time, reduceMotion) {
  const target = world === 'digital' ? 1 : 0;
  const elapsed = sceneTime && time ? Math.min(Math.max((time-sceneTime)/1000,0),.05) : 0;
  if(time)sceneTime=time;
  sceneBlend = reduceMotion ? target : sceneBlend + (target-sceneBlend)*Math.min(1,elapsed*5);
  const blend=sceneBlend, field=1-blend;
  const mix=(a,b)=>a+(b-a)*blend;
  ctx.fillStyle=`rgb(${Math.round(mix(25,17))},${Math.round(mix(41,28))},${Math.round(mix(22,34))})`;
  ctx.fillRect(0,0,width,height);
  const horizon=height*.16;
  // Continuous interpolation gives both worlds the same structural skeleton.
  for(let row=0;row<24;row++){
    ctx.beginPath();
    for(let step=0;step<=40;step++){
      const x=step/40*width;
      const fieldY=horizon+Math.pow(row/23,1.7)*height+Math.sin(x/width*5+row*.15+time*.0001)*row*.7;
      const digitalY=height*.14+row/23*height*.75;
      const y=mix(fieldY,digitalY);
      step?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.strokeStyle=`rgba(${Math.round(mix(171,113))},${Math.round(mix(205,179))},${Math.round(mix(103,205))},.15)`;ctx.lineWidth=1;ctx.stroke();
  }
  for(let col=-5;col<=15;col++){
    ctx.beginPath();ctx.moveTo(mix(width*.64+col*9,col*width/10),horizon);ctx.lineTo(col*width/10,height);ctx.stroke();
  }
  ctx.save();ctx.globalAlpha=field;
  // Cane planted along converging rows, rendered with depth-dependent scale.
  for(let row=0;row<8;row++){
    for(let depth=0;depth<9;depth++){
      const d=.19+depth*.082,y=horizon+d*d*height;
      const x=width*.64+(row-3.5)*width*.16*d;
      const s=2+d*9;
      ctx.strokeStyle=depth%2?'#789944':'#93b957';ctx.lineWidth=.7+d*.7;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-s*1.6);ctx.moveTo(x,y-s*.7);ctx.quadraticCurveTo(x-s,y-s*1.8,x-s*1.2,y-s);ctx.moveTo(x,y-s);ctx.quadraticCurveTo(x+s,y-s*2,x+s*1.1,y-s*1.4);ctx.stroke();
    }
  }
  ctx.strokeStyle='#dcfa87';ctx.lineWidth=1.5;ctx.setLineDash([5,9]);ctx.beginPath();ctx.moveTo(width*.64,horizon);ctx.lineTo(width*.65,height);ctx.stroke();ctx.setLineDash([]);
  // A small conceptual GPS beacon, without fictitious operational data.
  const gx=width*.81,gy=height*.25;
  const pulse=reduceMotion?0:(Math.sin(time*.002)+1)/2;
  ctx.strokeStyle='#dcfa8750';ctx.beginPath();ctx.arc(gx,gy,12+pulse*10,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dcfa87';ctx.beginPath();ctx.arc(gx,gy,3,0,Math.PI*2);ctx.fill();
  ctx.font='10px Segoe UI, sans-serif';ctx.fillStyle='#ceddac';ctx.fillText('GUIA GPS',gx-23,gy+35);ctx.restore();
  // The page assembles as the field fades. It stays above the hero headline.
  ctx.save();ctx.globalAlpha=blend;
  const px=width*.12,py=height*.16+(1-blend)*25,pw=width*.76,ph=height*.39;
  ctx.shadowColor='#020b1580';ctx.shadowBlur=25;ctx.fillStyle='#162d35';ctx.beginPath();ctx.roundRect(px,py,pw,ph,9);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#85c7cd70';ctx.stroke();
  ctx.fillStyle='#24414a';ctx.fillRect(px+1,py+25,pw-2,1);
  ['#dcfa87','#689b9c','#486c76'].forEach((color,i)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(px+13+i*12,py+13,3,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#acc8cb';ctx.font='9px Segoe UI, sans-serif';ctx.fillText('UMA IDEIA GANHANDO FORMA',px+52,py+16);
  const pad=pw*.07;
  ctx.fillStyle='#dcfa87';ctx.font=`600 ${Math.max(14,width*.027)}px Segoe UI, sans-serif`;ctx.fillText('Sua ideia.',px+pad,py+ph*.36);ctx.fillStyle='#eef2e8';ctx.fillText('Seu espaço digital.',px+pad,py+ph*.48);
  ctx.fillStyle='#88a4a5';ctx.fillRect(px+pad,py+ph*.55,pw*.34,3);ctx.fillRect(px+pad,py+ph*.59,pw*.24,3);
  ctx.fillStyle='#dcfa87';ctx.beginPath();ctx.roundRect(px+pad,py+ph*.69,pw*.25,25,4);ctx.fill();ctx.fillStyle='#193021';ctx.font='10px Segoe UI, sans-serif';ctx.fillText('Vamos criar ↗',px+pad+9,py+ph*.69+16);
  ctx.fillStyle='#2b5356';ctx.beginPath();ctx.roundRect(px+pw*.61,py+ph*.23,pw*.3,ph*.56,6);ctx.fill();ctx.strokeStyle='#93c7aa';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(px+pw*.76,py+ph*.5,ph*.12,0,Math.PI*2);ctx.stroke();ctx.font=`${Math.max(22,width*.06)}px Segoe UI`;ctx.fillStyle='#dcfa87';ctx.fillText('↗',px+pw*.7,py+ph*.57);
  ctx.restore();
  // Shared actor moves between the agricultural guide and the page's button.
  const drift=reduceMotion?0:Math.sin(time*.0007)*height*.018;
  const ax=mix(width*.645,px+pad+pw*.2),ay=mix(height*.41+drift,py+ph*.69+20);
  ctx.save();ctx.translate(ax,ay);
  ctx.globalAlpha=field;ctx.rotate(-Math.PI/2);const scale=Math.max(.8,Math.min(1.5,width/430));ctx.scale(scale,scale);
  ctx.fillStyle='#0b150b';ctx.fillRect(-12,-14,15,6);ctx.fillRect(-12,8,15,6);ctx.fillRect(6,-11,9,5);ctx.fillRect(6,6,9,5);ctx.fillStyle='#dcfa87';ctx.fillRect(-13,-7,30,14);ctx.fillStyle='#325e40';ctx.fillRect(-10,-6,11,12);ctx.restore();
  ctx.save();ctx.globalAlpha=blend;ctx.translate(ax,ay);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(3,24);ctx.lineTo(9,17);ctx.lineTo(15,27);ctx.lineTo(20,24);ctx.lineTo(14,14);ctx.lineTo(24,13);ctx.closePath();ctx.fillStyle='#dcfa87';ctx.fill();ctx.strokeStyle='#163022';ctx.lineWidth=2;ctx.stroke();ctx.restore();
}
