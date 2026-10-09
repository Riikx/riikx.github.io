'use strict';
const OrtoMath={
  parseWorld(text){const a=text.trim().split(/\s+/).map(Number);if(a.length!==6||a.some(n=>!Number.isFinite(n))||Math.abs(a[0]*a[3]-a[2]*a[1])<1e-20)throw Error('JGW inválido');return a;},
  coordinate(p,w,h,a){const x=p.x*w-.5,y=p.y*h-.5;return [a[0]*x+a[2]*y+a[4],a[1]*x+a[3]*y+a[5]];},
  pixel(c,w,h,a){const x=c[0]-a[4],y=c[1]-a[5],d=a[0]*a[3]-a[2]*a[1];return {x:((a[3]*x-a[2]*y)/d+.5)/w,y:((-a[1]*x+a[0]*y)/d+.5)/h};},
  distance(p,a,b){const x=b.x-a.x,y=b.y-a.y,l=x*x+y*y,t=l?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/l)):0;return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);},
  deviations(lines,reference,w,h){return lines.map(points=>points.map(p=>{const pixel={x:p.x*w,y:p.y*h};let closest=Infinity;for(const line of reference)for(let i=1;i<line.length;i++)closest=Math.min(closest,this.distance(pixel,{x:line[i-1].x*w,y:line[i-1].y*h},{x:line[i].x*w,y:line[i].y*h}));return closest;}));}
};
