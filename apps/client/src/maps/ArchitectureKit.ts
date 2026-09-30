import * as THREE from 'three';
import { getMapDefinition, type MapId } from '@polystrike/shared/maps';
import { chamferBox } from '../game/ModelGeometry.js';

/** Surface relief is bounded by the collision-owned building, never a new obstacle. */
export function addArchitecture(scene: THREE.Object3D, id: MapId) {
  const parts: { position: number[]; size: number[]; color: string }[] = [];
  const stone = id === 'citadel' ? '#ded2b2' : '#acbac0';
  const add = (x:number,y:number,z:number,w:number,h:number,d:number,color:string) => parts.push({position:[x,y,z],size:[w,h,d],color});
  const blocks = getMapDefinition(id).blocks;
  blocks.slice(0,-4).forEach((b,index) => {
    // Four facade orientations share a local width/depth coordinate system.
    for (let face=0;face<4;face++) {
      const swap=face>1, sign=face%2?1:-1;
      const width=swap?b.depth:b.width, depth=swap?b.width:b.depth;
      const panel=(u:number,y:number,w:number,h:number,color:string, relief=.06) => {
        const v=sign*(depth/2-.015);
        add(b.x+(swap?v:u),y,b.z+(swap?u:v),swap?relief:w,h,swap?w:relief,color);
      };
      panel(0,.25,width,.35,stone);
      panel(0,b.height-.35,width,.22,stone);
      for (const u of [-width/2+.15,width/2-.15]) panel(u,b.height/2,.22,b.height,stone);
      if(face<2&&b.height>=5) {
        // Repeated sector numerals make opposite approaches identifiable without textures.
        const y=b.height-.95, u=width/2-1.1;
        panel(u,y,1.25,1.3,'#233c49',.07);
        const segments=[[0,.44,.55,.09],[.29,.23,.09,.38],[.29,-.23,.09,.38],[0,-.44,.55,.09],[-.29,-.23,.09,.38],[-.29,.23,.09,.38],[0,0,.55,.09]];
        const digits=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
        segments.forEach(([x,dy,w,h],segment)=>{if(digits[(index+1)%10]![segment]==='1') panel(u+sign*x!,y+dy!,w!,h!,'#f2d89c',.1);});
      }
      if(id==='depot'||id==='canal') {
        const gate=Math.min(width-1,4.5);
        panel(0,1.45,gate,2.7,'#273f4b');
        for(let y=.35;y<2.8;y+=.32) panel(0,y,gate,.07,'#7a949a',.08);
        panel(0,3.12,gate,.22,id==='depot'?'#f0c46a':'#a0e5dd');
      } else if(id==='foundry') {
        for(const u of [-width*.3,width*.3]) panel(u,b.height/2,.28,b.height-.5,'#b98c5d',.09);
        panel(0,1.1,width-.6,.13,'#e4b45d');
        for(let u=-width/2+.8;u<width/2-.5;u+=1.4) panel(u,2,.5,1.2,'#302d2b');
      } else if(id==='citadel') {
        for(let y=1;y<b.height;y+=2) panel(0,y,width,.08,'#9b927c');
        for(let u=-width/2+1;u<width/2-.6;u+=2.5) {
          panel(u,Math.min(b.height-1,3),.3,1.4,'#353e3d');
          panel(u,Math.min(b.height-.2,3.8),.7,.2,stone);
        }
      } else {
        for(let y=2;y<b.height-1;y+=3.6) {
          for(let u=-width/2+1.2;u<width/2-.8;u+=4) {
            panel(u,y,1.6,1.8,'#243648');
            panel(u,y-.85,1.8,.12,stone,.09);
            panel(u,y,.07,1.65,'#b4c5ce',.08);
          }
        }
        if(id==='alleyways') panel(width*.25,b.height*.6,.65,Math.min(3,b.height-1),'#da83b8',.09);
      }
    }
    if(id==='foundry') {
      for(const offset of [-.7,.7]) {
        add(b.x+offset,b.height+1,b.z,.65,2,.65,'#38414b');
        add(b.x+offset,b.height+2,b.z,.9,.22,.9,'#b98c5d');
      }
    } else if(id==='citadel') {
      for(const side of [-1,1]) for(let x=-b.width/2+.5;x<b.width/2;x+=2) add(b.x+x,b.height+.6,b.z+side*(b.depth/2-.45),.8,1.2,.8,stone);
    } else if(id==='crossroads') {
      add(b.x,b.height+.3,b.z,Math.min(2.5,b.width-1),.6,Math.min(2,b.depth-1),'#566874');
      for(let z=-.6;z<=.6;z+=.3) add(b.x,b.height+.62,b.z+z,Math.min(2,b.width-1),.05,.09,'#24343d');
    }
  });
  // Thin repeated facade strips use 12-triangle geometry; bevels belong to
  // close-readable equipment, not thousands of subpixel cornice edges.
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.8,flatShading:true}),parts.length);
  mesh.name=id+'-architecture';
  const matrix=new THREE.Matrix4(), quaternion=new THREE.Quaternion();
  parts.forEach((p,i)=>{
    mesh.setMatrixAt(i,matrix.compose(new THREE.Vector3(...p.position),quaternion,new THREE.Vector3(...p.size)));
    mesh.setColorAt(i,new THREE.Color(p.color));
  });
  mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
  addRoofSilhouettes(scene,id,blocks.slice(0,-4));
  addRoofEquipment(scene,id,blocks.slice(0,-4));
}

function addRoofEquipment(scene:THREE.Object3D,id:MapId,blocks:ReturnType<typeof getMapDefinition>['blocks']) {
  if(id==='citadel')return; // Historic towers retain their authored battlements.
  const roofs=blocks.filter(b=>b.height>=5&&b.width>=4&&b.depth>=4);
  const metal=new THREE.MeshStandardMaterial({color:id==='foundry'?'#66554a':'#607a80',roughness:.75,metalness:.25,flatShading:true});
  const housings=new THREE.InstancedMesh(chamferBox(1,1,1,.12),metal,roofs.length);
  const vents=new THREE.InstancedMesh(new THREE.CylinderGeometry(.5,.5,1,8),metal,roofs.length);
  const curbs=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),metal,roofs.length);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
  roofs.forEach((b,i)=>{
    const moduleWidth=b.width/(id==='foundry'?3:1);
    const roofHeight=id==='crossroads'?.85:Math.min(2.4,moduleWidth*.3);
    // A level curb reaches the highest point beneath the housing footprint.
    // Its lower edge is embedded in the structural roof, not suspended above it.
    const supportHeight=id==='alleyways'||id==='foundry'?roofHeight*(.5+Math.min(.9/moduleWidth,.5)):roofHeight;
    const roofStart=b.height+.24,base=roofStart+supportHeight,height=base+.325;
    curbs.setMatrixAt(i,matrix.compose(new THREE.Vector3(b.x,roofStart+supportHeight/2,b.z),q,new THREE.Vector3(1.8,supportHeight,1.2)));
    housings.setMatrixAt(i,matrix.compose(new THREE.Vector3(b.x,height,b.z),q,new THREE.Vector3(1.8,.65,1.2)));
    vents.setMatrixAt(i,matrix.compose(new THREE.Vector3(b.x,height+(id==='foundry'?1.2:.55),b.z),q,new THREE.Vector3(.55,id==='foundry'?2:.55,.55)));
  });
  housings.name=id+'-roof-equipment';vents.name=id+'-roof-exhausts';
  curbs.name=id+'-roof-curbs';
  housings.castShadow=vents.castShadow=curbs.castShadow=true;scene.add(curbs,housings,vents);
}

function addRoofSilhouettes(scene:THREE.Object3D,id:MapId,blocks:ReturnType<typeof getMapDefinition>['blocks']) {
  const pitched=new THREE.Shape();
  pitched.moveTo(-.5,0); pitched.lineTo(.5,0); pitched.lineTo(id==='alleyways'||id==='foundry'?-.5:0,1); pitched.closePath();
  let geometry:THREE.BufferGeometry;
  if(id==='citadel') geometry=new THREE.ConeGeometry(Math.SQRT1_2,1,4).rotateY(Math.PI/4).translate(0,.5,0);
  else if(id==='crossroads') geometry=new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
  else geometry=new THREE.ExtrudeGeometry(pitched,{depth:1,bevelEnabled:false,steps:1}).translate(0,0,-.5);
  const roofs=blocks.filter(b=>b.height>=(id==='citadel'?14:5)).flatMap(b=>{
    const count=id==='foundry'?3:1;
    return Array.from({length:count},(_,i)=>({
      x:b.x-b.width/2+(i+.5)*b.width/count,y:b.height+.24,z:b.z,
      w:b.width/count*(id==='crossroads'?.76:1),d:b.depth*(id==='crossroads'?.76:1),
      h:id==='crossroads'?.85:Math.min(id==='citadel'?4:2.4,b.width/count*.3),
    }));
  });
  const colors={depot:'#3a6264',crossroads:'#657c83',foundry:'#804937',alleyways:'#55516d',citadel:'#546e76',canal:'#aa654c'};
  const roofsMesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:colors[id],roughness:.83,flatShading:true}),roofs.length);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
  roofs.forEach((p,i)=>roofsMesh.setMatrixAt(i,matrix.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(p.w,p.h,p.d))));
  roofsMesh.name=id+'-roof-silhouettes'; roofsMesh.castShadow=true;roofsMesh.receiveShadow=true;scene.add(roofsMesh);
}
