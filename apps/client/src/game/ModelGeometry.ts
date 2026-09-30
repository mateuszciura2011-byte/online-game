import * as THREE from 'three';

/** Closed, hard-edged profile: consistent silhouette at low polygon counts. */
export function profilePrism(points: readonly (readonly [number, number])[], depth: number) {
  const shape = new THREE.Shape();
  points.forEach(([x,y], i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {depth, steps:1, bevelEnabled:false, curveSegments:1});
  geometry.translate(0,0,-depth/2);
  geometry.computeBoundingBox();
  return geometry;
}

export function chamferBox(width:number, height:number, depth:number, bevel=Math.min(width,height)*.16) {
  const x=width/2,y=height/2,b=Math.min(bevel,x*.45,y*.45);
  return profilePrism([[-x+b,-y],[x-b,-y],[x,-y+b],[x,y-b],[x-b,y],[-x+b,y],[-x,y-b],[-x,-y+b]],depth);
}

/** Barrel axis is local -Z, including its end caps and bounds. */
export function barrelGeometry(radius:number, length:number) {
  const geometry=new THREE.CylinderGeometry(radius,radius,length,10,1,false);
  geometry.rotateX(Math.PI/2);geometry.computeBoundingBox();return geometry;
}
