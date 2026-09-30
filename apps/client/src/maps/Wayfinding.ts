import * as THREE from 'three';
import type {MapId} from '@polystrike/shared/maps';

type Part={position:THREE.Vector3;size:THREE.Vector3;rotation:THREE.Quaternion;color:string};
const routeColors={A:'#efc579',B:'#8ad8ce'};
const glyphs={
  A:[[-.4,-.5,0,.5],[0,.5,.4,-.5],[-.24,-.1,.24,-.1]],
  B:[[-.35,-.5,-.35,.5],[-.35,.5,.14,.5],[-.35,0,.14,0],[-.35,-.5,.14,-.5],[.14,.5,.38,.28],[.38,.28,.14,0],[.14,0,.38,-.28],[.38,-.28,.14,-.5]],
};

/** Flat paint and wall-mounted signs only: never invent walkable-area obstacles. */
export function addWayfinding(scene:THREE.Object3D,id:MapId) {
  const boards:Part[]=[],paint:Part[]=[];
  const add=(parts:Part[],x:number,y:number,z:number,w:number,h:number,d:number,color:string,rotation=new THREE.Quaternion())=>{
    parts.push({position:new THREE.Vector3(x,y,z),size:new THREE.Vector3(w,h,d),rotation,color});
  };
  const stroke=(parts:Part[],from:THREE.Vector3,to:THREE.Vector3,width:number,depth:number,color:string)=>{
    const direction=to.clone().sub(from);
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    const center=from.clone().add(to).multiplyScalar(.5);
    add(parts,center.x,center.y,center.z,width,direction.length(),depth,color,rotation);
  };
  for(const side of [-1,1]) {
    // A reader facing the south boundary has world-west on their right.
    const screenRight=-side;
    for(const [label,x] of [['A',-18],['B',18]] as const) {
      const color=routeColors[label],z=side*58.95;
      add(boards,x,2.65,z,5,1.65,.08,'#233b44');
      add(boards,x,3.4,z-side*.02,5,.12,.07,color);
      const front=z-side*.065;
      const point=(u:number,v:number)=>new THREE.Vector3(x+screenRight*u,2.65+v,front);
      for(const [x0,y0,x1,y1] of glyphs[label]) stroke(boards,point(x0!-.95,y0!),point(x1!-.95,y1!),.14,.035,color);
      const direction=Math.sign(x)*screenRight;
      stroke(boards,point(.25,0),point(1.55,0),.13,.035,color);
      const tip=direction>0?1.55:.25,tail=tip-direction*.42;
      stroke(boards,point(tail,.4),point(tip,0),.13,.035,color);
      stroke(boards,point(tip,0),point(tail,-.4),.13,.035,color);
    }
  }
  // Wider, darker lanes provide scale and a stable visual route around cover.
  for(const x of [-52,52]) add(paint,x,.017,0,6,.006,110,'#606d70');
  for(const z of [-52,52]) add(paint,0,.021,z,98,.006,6,'#606d70');
  for(const [label,x] of [['A',-52],['B',52]] as const) {
    const color=routeColors[label];
    for(const side of [-1,1]) {
      const point=(u:number,v:number)=>new THREE.Vector3(x+side*u,.034,side*(42-v));
      // Thick, low-poly lettering is legible from eye level, not just the minimap.
      for(const [x0,y0,x1,y1] of glyphs[label]) {
        const a=point(x0!*2,y0!*2),b=point(x1!*2,y1!*2);
        const direction=b.clone().sub(a),center=a.clone().add(b).multiplyScalar(.5);
        const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.atan2(direction.z,direction.x));
        add(paint,center.x,center.y,center.z,direction.length(),.008,.2,color,rotation);
      }
      for(const z of [35,23,11]) {
        for(const wing of [-1,1]) {
          const from=new THREE.Vector3(x+wing*.8,.034,side*(z+.5));
          const to=new THREE.Vector3(x,.034,side*(z-.5));
          const direction=to.clone().sub(from),center=from.clone().add(to).multiplyScalar(.5);
          const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.atan2(direction.z,direction.x));
          add(paint,center.x,center.y,center.z,direction.length(),.008,.18,color,rotation);
        }
      }
    }
  }
  for(const [suffix,parts] of [['route-signs',boards],['route-paint',paint]] as const) {
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.95}),parts.length);
    const matrix=new THREE.Matrix4();
    parts.forEach((part,i)=>{
      mesh.setMatrixAt(i,matrix.compose(part.position,part.rotation,part.size));
      mesh.setColorAt(i,new THREE.Color(part.color));
    });
    mesh.name=id+'-'+suffix;mesh.receiveShadow=true;scene.add(mesh);
  }
}
