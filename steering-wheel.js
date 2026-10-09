'use strict';
function prepareSteeringWheel(THREE, model) {
  let cockpit;
  model.traverse(node=>{if(node.isMesh&&/COCKPIT_Salon/i.test(node.name))cockpit=node;});
  if(!cockpit||!cockpit.geometry.index)return null;
  // Coordinates in the original R6 mesh, before its normalization transform.
  const center=new THREE.Vector3(.000825,2.287617,-.198124);
  const axis=new THREE.Vector3(0,.747,.665).normalize();
  const positions=cockpit.geometry.attributes.position,indices=cockpit.geometry.index;
  const wheelIndices=[],staticIndices=[],point=new THREE.Vector3();
  function belongs(index){
    point.fromBufferAttribute(positions,index).sub(center);
    const axial=point.dot(axis),radialSquared=point.lengthSq()-axial*axial;
    return Math.abs(axial)<.052&&radialSquared<.235*.235;
  }
  for(let i=0;i<indices.count;i+=3){
    const a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);
    (belongs(a)&&belongs(b)&&belongs(c)?wheelIndices:staticIndices).push(a,b,c);
  }
  if(wheelIndices.length<300)return null;
  const fixed=cockpit.geometry.clone();fixed.setIndex(staticIndices);cockpit.geometry=fixed;
  const rotating=fixed.clone();rotating.setIndex(wheelIndices);rotating.translate(-center.x,-center.y,-center.z);
  const wheel=new THREE.Mesh(rotating,cockpit.material);wheel.name='Portfolio_Steering_Wheel';
  const pivot=new THREE.Group();pivot.name='Portfolio_Steering_Pivot';pivot.position.copy(center);pivot.add(wheel);
  cockpit.add(pivot);
  let current=0;
  return {update(turn,delta){const target=Math.max(-1,Math.min(1,turn))*Math.PI*.8;current+=(target-current)*(1-Math.exp(-7*delta));pivot.quaternion.setFromAxisAngle(axis,current);}};
}
