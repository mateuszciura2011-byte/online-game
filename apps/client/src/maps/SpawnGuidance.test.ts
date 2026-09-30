import {expect,it} from 'vitest';
import * as THREE from 'three';
import {addTeamSpawnPads} from './TeamSpawns.js';
import {getMapDefinition} from '@polystrike/shared/maps';

for(const id of ['depot','crossroads','foundry','alleyways','citadel','canal']) {
  it(id+' points each spawn toward the arena using flat, non-blocking markings',()=>{
    const root=new THREE.Group();addTeamSpawnPads(root,id);
    const guides:THREE.InstancedMesh[]=[];root.traverse(o=>{if(o.name==='spawn-directions')guides.push(o as THREE.InstancedMesh);});
    const spawns=getMapDefinition(id).spawns;
    expect(guides.reduce((sum,g)=>sum+g.count,0)).toBe(spawns.length);
    guides.forEach(guide=>{
      for(let i=0;i<guide.count;i++) {
        const matrix=new THREE.Matrix4();guide.getMatrixAt(i,matrix);
        const p=new THREE.Vector3().setFromMatrixPosition(matrix);
        const direction=new THREE.Vector3(0,0,-1).transformDirection(matrix);
        expect(direction.z*Math.sign(-p.z)).toBeGreaterThan(.9);
      }
      expect(new THREE.Box3().setFromObject(guide).max.y).toBeLessThan(.08);
    });
  });
}
