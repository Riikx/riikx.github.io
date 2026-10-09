'use strict';
function detectCaneStreets(data,width,height,manualAngle=null){
  const green=new Float32Array(width*height);
  for(let i=0;i<green.length;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2];green[i]=Math.max(0,g-(r+b)*.5-2)/Math.max(25,r+g+b)*3;}
  const radius=Math.ceil(Math.hypot(width,height)),bins=radius*2+3;
  function smooth(values,range){const out=new Float32Array(values.length);let sum=0;for(let i=0;i<values.length+range;i++){if(i<values.length)sum+=values[i];if(i-range*2-1>=0)sum-=values[i-range*2-1];if(i>=range){const center=i-range,left=Math.max(0,center-range),right=Math.min(values.length-1,center+range);out[center]=sum/(right-left+1);}}return out;}
  function profile(angle,stride){const a=angle*Math.PI/180,s=Math.sin(a),c=Math.cos(a),sum=new Float32Array(bins),count=new Uint32Array(bins);for(let y=0;y<height;y+=stride)for(let x=0;x<width;x+=stride){const bin=Math.round(-(x-width/2)*s+(y-height/2)*c)+radius;sum[bin]+=green[y*width+x];count[bin]++;}for(let i=0;i<bins;i++)if(count[i])sum[i]/=count[i];return {sum,count,s,c};}
  function energy(angle){const p=profile(angle,3),narrow=smooth(p.sum,1),broad=smooth(p.sum,12);let value=0,n=0;for(let i=0;i<bins;i++){if(p.count[i]<Math.min(width,height)/12)continue;value+=(narrow[i]-broad[i])**2;n++;}return n?value/n:0;}
  let angle=manualAngle,best=-1;
  if(angle===null){for(let a=-90;a<90;a+=3){const score=energy(a);if(score>best){best=score;angle=a;}}const coarse=angle;for(let a=coarse-3;a<=coarse+3;a+=.5){const score=energy(a);if(score>best){best=score;angle=a;}}}
  const p=profile(angle,1),values=smooth(p.sum,1),baseline=smooth(values,15);
  let min=0,max=bins-1;while(min<max&&p.count[min]<Math.min(width,height)*.25)min++;while(max>min&&p.count[max]<Math.min(width,height)*.25)max--;
  const candidates=[];for(let i=min+2;i<max-2;i++)if(values[i]>=values[i-1]&&values[i]>values[i+1]&&values[i]-baseline[i]>.009)candidates.push(i);
  candidates.sort((a,b)=>values[b]-values[a]);const peaks=[];for(const bin of candidates)if(peaks.every(other=>Math.abs(other-bin)>=5))peaks.push(bin);peaks.sort((a,b)=>a-b);
  const lines=[];
  function sample(t,n){const x=Math.round(width/2+t*p.c-n*p.s),y=Math.round(height/2+t*p.s+n*p.c);return x>=0&&x<width&&y>=0&&y<height?green[y*width+x]:null;}
  for(let row=0;row<peaks.length;row++){
    const gaps=[row>0?peaks[row]-peaks[row-1]:Infinity,row<peaks.length-1?peaks[row+1]-peaks[row]:Infinity];
    const gap=Math.min(...gaps);if(gap<5||gap>45)continue;
    const center=peaks[row]-radius,margin=Math.min(3,gap*.22);let previous=center;
    const points=[];
    for(let t=-radius;t<=radius;t+=7){let picked=center,lowest=Infinity;
      for(let shift=-margin;shift<=margin;shift+=.5){const n=center+shift;let cost=0,samples=0;for(let along=-8;along<=8;along+=4){const value=sample(t+along,n);if(value!==null){cost+=value;samples++;}}if(samples<3)continue;cost=-cost/samples+.003*Math.abs(n-previous)+.001*Math.abs(shift);if(cost<lowest){lowest=cost;picked=n;}}
      if(!Number.isFinite(lowest))continue;previous=previous*.5+picked*.5;
      const x=(width/2+t*p.c-previous*p.s)/width,y=(height/2+t*p.s+previous*p.c)/height;
      if(x>.01&&x<.99&&y>.01&&y<.99)points.push({x,y});
    }
    if(points.length>8)lines.push(points);
  }
  return {angle,lines};
}
