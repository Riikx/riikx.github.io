'use strict';
(() => {
  const map = document.querySelector('.map');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {position:'absolute',left:'50%',top:'50%',transform:'translate(-50%, -50%)',pointerEvents:'none',opacity:'.85'});
  map.insertBefore(canvas, map.firstChild);
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Simplified silhouettes, designed for this decorative globe.
  const continents = [
    [[-168,65],[-145,70],[-124,60],[-110,52],[-95,50],[-82,55],[-60,52],[-55,42],[-75,30],[-82,25],[-90,20],[-100,17],[-110,28],[-124,40],[-135,55]],
    [[-81,12],[-70,10],[-58,5],[-47,-3],[-35,-8],[-42,-22],[-53,-33],[-66,-55],[-74,-44],[-76,-20]],
    [[-52,60],[-42,61],[-20,75],[-40,83],[-60,76]],
    [[-10,36],[5,37],[20,33],[33,30],[44,12],[51,10],[40,-10],[32,-29],[18,-35],[10,-20],[0,3],[-16,14],[-17,26]],
    [[-10,36],[-9,44],[0,49],[8,55],[20,60],[30,70],[60,72],[100,76],[145,68],[170,60],[155,48],[135,40],[120,24],[108,5],[98,10],[80,8],[68,25],[48,30],[35,42],[28,36],[18,40],[8,43]],
    [[112,-12],[135,-11],[153,-25],[145,-39],[125,-35],[114,-23]],
    [[47,-13],[50,-16],[48,-26],[44,-23]],
    [[130,31],[141,44],[145,40],[137,33]],
    [[-180,-72],[-120,-75],[-60,-70],[0,-75],[60,-70],[120,-74],[180,-72],[180,-88],[-180,-88]]
  ];
  const rad = Math.PI / 180;
  let size=260,rotation=0,last=0;
  function project(lon,lat) {
    const l=lon*rad+rotation,p=lat*rad;
    return {x:Math.cos(p)*Math.sin(l),y:-Math.sin(p),z:Math.cos(p)*Math.cos(l)};
  }
  function line(points,r,cx,cy) {
    let started=false;ctx.beginPath();
    points.forEach(([lon,lat])=>{const p=project(lon,lat);if(p.z>0){if(started)ctx.lineTo(cx+p.x*r,cy+p.y*r);else ctx.moveTo(cx+p.x*r,cy+p.y*r);started=true;}else started=false;});ctx.stroke();
  }
  function draw() {
    const c=size/2,r=size*.41;
    ctx.clearRect(0,0,size,size);
    const glow=ctx.createRadialGradient(c,c,r*.6,c,c,r*1.2);glow.addColorStop(0,'#b9e56b18');glow.addColorStop(1,'#b9e56b00');ctx.fillStyle=glow;ctx.fillRect(0,0,size,size);
    const ocean=ctx.createRadialGradient(c-r*.35,c-r*.35,0,c,c,r);ocean.addColorStop(0,'#314a28');ocean.addColorStop(1,'#111d12');
    ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.fillStyle=ocean;ctx.fill();ctx.save();ctx.clip();
    ctx.strokeStyle='#b8df7330';ctx.lineWidth=.6;
    for(let lat=-60;lat<=60;lat+=20){const pts=[];for(let lon=-180;lon<=180;lon+=3)pts.push([lon,lat]);line(pts,r,c,c);}
    for(let lon=-180;lon<180;lon+=30){const pts=[];for(let lat=-90;lat<=90;lat+=3)pts.push([lon,lat]);line(pts,r,c,c);}
    // Point-cloud land avoids false polygons when a continent crosses the horizon.
    ctx.fillStyle='#c4ea80';
    land.forEach(([lon,lat])=>{const p=project(lon,lat);if(p.z<=0)return;ctx.globalAlpha=.25+p.z*.55;ctx.beginPath();ctx.arc(c+p.x*r,c+p.y*r,Math.max(.65,size/230),0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
    ctx.restore();ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.strokeStyle='#c9f08470';ctx.lineWidth=1;ctx.stroke();
  }
  function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  const land=[];
  for(let lat=-82;lat<=82;lat+=3)for(let lon=-180;lon<180;lon+=3)if(continents.some(p=>inside(lon,lat,p)))land.push([lon,lat]);
  function resize(){size=Math.min(310,map.clientWidth*.52,map.clientHeight*.6);const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(size*d);canvas.height=Math.round(size*d);canvas.style.width=`${size}px`;canvas.style.height=`${size}px`;ctx.setTransform(d,0,0,d,0,0);draw();}
  function frame(time){const elapsed=last?Math.min((time-last)/1000,.05):0;last=time;if(!reduced.matches&&!document.hidden){rotation+=elapsed*.09;draw();}requestAnimationFrame(frame);}
  new ResizeObserver(resize).observe(map);resize();requestAnimationFrame(frame);
})();
