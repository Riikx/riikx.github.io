const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),elements=new Map(),listeners={},downloads=[];
const context=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
let sequence=0;
function element(key){
 if(!elements.has(key))elements.set(key,{value:({'.drone-area':'full','.drone-speed':'1','.drone-view':'overlay','.drone-line':'0','.drone-split':'50','.drone-zoom':'1','.orto-crs':'unknown','.deviation-threshold':'5'})[key]||'',files:[],checked:true,hidden:false,options:Array.from({length:6},()=>({})),handlers:{},style:{},classList:{toggle(){}},setAttribute(){},append(){},prepend(){},before(){},after(){},querySelector:element,closest:()=>({}),getBoundingClientRect:()=>({width:700,height:440,left:0,top:0}),getContext:()=>context,focus(){},showModal(){this.open=true},setPointerCapture(){},addEventListener(n,f){(this.handlers[n]??=[]).push(f)},click(){if(this.download)downloads.push(this.download);for(const f of this.handlers.click||[])f({target:this});}});
 return elements.get(key);
}
const document={createElement:tag=>element(tag+sequence++),querySelector:element,body:{append(){}},hidden:false};
const window={addEventListener(n,f){(listeners[n]??=[]).push(f);},dispatchEvent(e){for(const f of listeners[e.type]||[])f(e);}};
const sandbox={document,window,Math,Number,Float32Array,Uint32Array,JSON,Error,Blob,URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL(){}},setTimeout:f=>f(),devicePixelRatio:1,CustomEvent:class{constructor(type,p){this.type=type;this.detail=p?.detail;}},Image:class{constructor(){this.naturalWidth=4000;this.naturalHeight=4000;}set src(value){this.onload?.();}},ResizeObserver:class{observe(){}},requestAnimationFrame(){}};
vm.createContext(sandbox);
for(const file of ['drone.js','orto-math.js','orto-editor.js','drone-3d.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
const api=window.ortoDemo;
[...elements.values()].find(e=>e.className==='node drone-node').click();
[...elements.values()].find(e=>e.textContent?.startsWith('Ver orto GB')).click();
if(!api.image)throw Error('Image did not load');
api.lines=[[{x:.4,y:.5},{x:.5,y:.5},{x:.6,y:.5}]];
window.dispatchEvent({type:'orto:lines'});
element('.edit-lines').click();
if(!window.ortoEditor.editing)throw Error('Edit mode');
for(const f of api.canvas.handlers.pointerdown)f({clientX:350,clientY:220,pointerId:1,preventDefault(){}});
for(const f of api.canvas.handlers.pointermove)f({clientX:350,clientY:242});
for(const f of api.canvas.handlers.pointerup)f({});
if(api.lines[0][1].y<=.5)throw Error('Point drag did not edit the line');
element('.undo-lines').click();
if(api.lines[0][1].y!==.5)throw Error('Undo did not restore the line');
element('.export-project').click();element('.export-qgis').click();
if(!downloads.includes('tracados-edicao.json')||!downloads.includes('tracados-qgis.csv'))throw Error('Exports');
console.log('PASS: initialization, image load, point editing, undo, JSON and QGIS CSV exports.');
async function checkImports(){
 const input=element('.reference-file');input.files=[{name:'original.json',size:200,text:async()=>JSON.stringify({format:'orto-pixel-lines-v1',width:4000,height:4000,lines:[[{x:.3,y:.49},{x:.7,y:.49}]]})}];
 for(const handler of input.handlers.change)await handler({target:input});
 if(!element('.comparison-report').textContent.includes('40.0 px'))throw Error('Reference comparison did not use pixels');
 input.files=[{name:'invalid.geojson',size:200,text:async()=>JSON.stringify({type:'LineString',coordinates:[[-47.098,-22.842],[-47.097,-22.841]]})}];
 for(const handler of input.handlers.change)await handler({target:input});
 if(!element('.editor-status').textContent.includes('GeoJSON precisa'))throw Error('Unconfirmed CRS accepted');
 element('.orto-crs').value='4326';element('.export-qgis').click();
 if(!downloads.includes('tracados.geojson'))throw Error('Confirmed WGS84 export');
 console.log('PASS: reference import, pixel-distance comparison, unknown-CRS rejection and confirmed GeoJSON export.');
}
checkImports().catch(error=>{console.error(error);process.exitCode=1;});
