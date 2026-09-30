import * as THREE from 'three';
import { getMapDefinition, type MapId } from '@polystrike/shared/maps';
import { addTeamSpawnPads } from './TeamSpawns.js';
import { addArchitecture } from './ArchitectureKit.js';
import { addWayfinding } from './Wayfinding.js';
import { addSkyline } from './Skyline.js';

const themes: Record<MapId, { wall:string; trim:string; glow:string; ground:string }> = {
  depot:{wall:'#c39359',trim:'#3b5964',glow:'#a3dfdf',ground:'#7c8279'},
  crossroads:{wall:'#c1c4b9',trim:'#506975',glow:'#abc3d1',ground:'#858d8a'},
  foundry:{wall:'#997563',trim:'#38434b',glow:'#ffbc6b',ground:'#84776b'},
  alleyways:{wall:'#8c8da4',trim:'#45445f',glow:'#eea8d2',ground:'#6e7585'},
  citadel:{wall:'#d3c6a5',trim:'#897e60',glow:'#e5c78c',ground:'#9a9781'},
  canal:{wall:'#96b9b1',trim:'#3b6474',glow:'#a2e7d8',ground:'#819a94'},
};

/** Every ground-level solid comes from the exact collision plan shared with the server. */
export function buildTacticalArena(scene: THREE.Object3D, id: MapId) {
  const map = getMapDefinition(id), theme = themes[id];
  scene.userData.mapPlan = map;
  const body = new THREE.MeshStandardMaterial({color:theme.wall,roughness:.86,flatShading:true});
  const trim = new THREE.MeshStandardMaterial({color:theme.trim,roughness:.65});
  const glow = new THREE.MeshStandardMaterial({color:theme.glow,emissive:theme.glow,emissiveIntensity:.35});
  const pavement = new THREE.MeshStandardMaterial({color:theme.ground,roughness:1});
  const paint = new THREE.MeshStandardMaterial({color:'#d0cdb2',roughness:1});
  const unit = new THREE.BoxGeometry(1,1,1);
  const details: Array<{x:number;y:number;z:number;w:number;h:number;d:number}> = [];
  map.blocks.forEach((b,index) => {
    const solid = new THREE.Mesh(new THREE.BoxGeometry(b.width,b.height,b.depth),body);
    solid.name = id+'-solid-'+index; solid.userData.colliderIndex=index;
    solid.position.set(b.x,b.height/2,b.z); solid.castShadow=true; solid.receiveShadow=true; scene.add(solid);
    // Detail remains within each solid's horizontal footprint.
    details.push({x:b.x,y:b.height+.12,z:b.z,w:b.width,h:.24,d:b.depth});
    if(index>=map.blocks.length-4) return;
    // ArchitectureKit owns all facade bays; a second window rhythm overlaps them.
    if(id==='depot') {
      for(let x=-b.width/2+.4; x<b.width/2; x+=1.8)
        details.push({x:b.x+x,y:b.height/2,z:b.z,w:.08,h:b.height,d:b.depth});
    }
    if(id==='foundry') details.push({x:b.x,y:b.height+2,z:b.z,w:Math.min(2,b.width),h:4,d:Math.min(2,b.depth)});
  });
  // Roof caps and structural trim share one draw call.
  {
    const mesh=new THREE.InstancedMesh(unit,trim,details.length);
    mesh.name=id+'-roof-detail';
    const matrix=new THREE.Matrix4(), q=new THREE.Quaternion();
    details.forEach((p,i)=>mesh.setMatrixAt(i,matrix.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(p.w,p.h,p.d))));
    mesh.castShadow=true; scene.add(mesh);
  }
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(118,118),pavement);
  ground.rotation.x=-Math.PI/2; ground.position.y=.005; ground.receiveShadow=true; ground.name=id+'-ground'; scene.add(ground);
  for(const x of [-48,0,48]) {
    const stripe=new THREE.Mesh(new THREE.PlaneGeometry(.12,108),paint);
    stripe.rotation.x=-Math.PI/2;stripe.position.set(x,.018,0);scene.add(stripe);
  }
  // Distinct route destinations, not a new bomb-defusal game mode.
  for(const [label,x] of [['A',-48],['B',48]] as const) {
    const ring=new THREE.Mesh(new THREE.RingGeometry(3.7,4,4),glow);
    ring.rotation.x=-Math.PI/2;ring.position.set(x,.03,-36);ring.name='route-'+label;scene.add(ring);
  }
  addTeamSpawnPads(scene,id);
  addArchitecture(scene,id);
  addWayfinding(scene,id);
  addSkyline(scene,id);
  // Flat pavement joints add scale without introducing new collision obstacles.
  const joints=new THREE.InstancedMesh(unit,trim,38);
  const jointMatrix=new THREE.Matrix4(),rotation=new THREE.Quaternion();
  let joint=0;
  for(let offset=-54;offset<=54;offset+=6) {
    joints.setMatrixAt(joint++,jointMatrix.compose(new THREE.Vector3(offset,.009,0),rotation,new THREE.Vector3(.025,.008,116)));
    joints.setMatrixAt(joint++,jointMatrix.compose(new THREE.Vector3(0,.009,offset),rotation,new THREE.Vector3(116,.008,.025)));
  }
  joints.name=id+'-paving-joints'; joints.receiveShadow=true; scene.add(joints);
}
