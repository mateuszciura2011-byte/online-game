import * as THREE from 'three';
import type {MapId} from '@polystrike/shared/maps';

type Part={x:number;y:number;z:number;w:number;h:number;d:number;color:string;angle:number};

/** Authored silhouettes behind the north boundary: never new playable cover. */
export function addSkyline(scene:THREE.Object3D,id:MapId) {
  const parts:Part[]=[];
  const add=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,angle=0)=>parts.push({x,y,z:z-84,w,h,d,color,angle});
  const steel='#536873',dark='#304954',light='#bdc9c5',gold='#ceaa62';
  const beam=(ax:number,ay:number,bx:number,by:number,z:number,color:string,thickness=.55)=>{
    add((ax+bx)/2,(ay+by)/2,z,thickness,Math.hypot(bx-ax,by-ay),thickness,color,-Math.atan2(bx-ax,by-ay));
  };
  if(id==='depot') {
    for(const x of [-20,20]) {add(x,12,0,2,24,3,gold);add(x,1,0,7,2,7,dark);}
    add(0,24,0,46,3,4,gold);add(0,27,0,46,.6,4,dark);
    for(let x=-20;x<20;x+=5)beam(x,24,x+5,27,-2,gold);
    add(9,21,0,7,4,5,steel);add(9,20,2.6,4,2,.12,'#91c9d0');
    add(-9,16,0,.3,13,.3,dark);add(-9,9.5,0,3,.6,1,dark);
    for(const [x,y] of [[-26,3],[-10,3],[24,3],[-26,9]])add(x,y,8,14,6,7,x<0?steel:'#956f51');
  } else if(id==='crossroads') {
    for(const [x,h,w] of [[-24,23,13],[0,42,18],[24,29,13]]) {
      add(x,h/2,0,w,h,12,steel);add(x,h+1,0,w+1,2,13,light);
      for(let y=5;y<h;y+=4)add(x,y,6.1,w-2,1.2,.15,'#9db8bf');
    }
    add(0,46,0,10,6,8,dark);add(0,52,0,.6,8,.6,light);
  } else if(id==='foundry') {
    add(0,5,2,54,10,14,'#785f54');
    for(const [x,h] of [[-19,28],[0,36],[19,25]]) {
      add(x,h/2,0,5,h,5,steel);
      for(let y=12;y<h;y+=7)add(x,y,0,5.2,1.8,5.2,'#be9872');
      add(x,h+.8,0,6,1.6,6,dark);
    }
    for(let x=-24;x<27;x+=6)add(x,7,9.1,3,3,.2,'#d4a46a');
  } else if(id==='alleyways') {
    for(const [x,h] of [[-26,22],[-9,34],[9,28],[27,39]]) {
      add(x,h/2,0,13,h,12,'#555c74');add(x,h+.7,0,14,1.4,13,dark);
      for(let y=6;y<h-2;y+=5)for(const dx of [-3,3])add(x+dx,y,6.15,2.5,2,.2,'#afa1b9');
      add(x+4,h*.7,6.5,2,9,.5,x<0?'#bc6b9d':'#69a5b7');
    }
    add(-9,38,0,.4,7,.4,light);add(-9,40,0,6,.3,.3,light);
  } else if(id==='citadel') {
    add(0,9,0,58,18,9,'#a59b82');
    for(const x of [-25,0,25]) {
      const h=x===0?32:25;
      add(x,h/2,0,10,h,12,'#c0b394');add(x,h+.8,0,12,1.6,14,light);
      for(const dx of [-4,0,4])add(x+dx,h+2.5,0,2,3,13,'#c0b394');
      for(const y of [12,19])add(x,y,6.1,1.2,3,.15,dark);
    }
  } else {
    add(-13,14,0,3,28,4,'#749b9f');add(-13,29,0,8,3,7,steel);
    add(0,31,0,46,1.6,2,'#749b9f');
    beam(-13,41,-24,32,0,steel);beam(-13,41,23,32,0,steel);add(-13,36,0,.7,10,.7,steel);
    for(let x=-22;x<22;x+=5)beam(x,30,x+5,33,0,'#749b9f',.35);
    add(20,22,0,.25,18,.25,dark);add(20,13,0,3,.7,1,dark);
    add(-27,30,0,7,4,5,gold);
    for(const x of [-30,-10,10,30])add(x,4,8,17,8,8,x<0?'#6b8e96':'#a97b5b');
  }
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.86,flatShading:true}),parts.length);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),axis=new THREE.Vector3(0,0,1);
  parts.forEach((p,i)=>{
    matrix.compose(new THREE.Vector3(p.x,p.y,p.z),rotation.setFromAxisAngle(axis,p.angle),new THREE.Vector3(p.w,p.h,p.d));
    mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new THREE.Color(p.color));
  });
  mesh.name=id+'-skyline';mesh.userData.parts=parts;
  mesh.userData.excludeMapShadows=true;
  // Outside the arena: no shadow-map work and no influence on player visibility.
  scene.add(mesh);
}
