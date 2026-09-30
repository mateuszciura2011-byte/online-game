import {expect,it} from 'vitest';
import * as THREE from 'three';
import {buildTacticalArena} from './TacticalArena.js';

it.each([
  ['crossroads',0,21,'#9db8bf'],['alleyways',-29,16,'#afa1b9'],
  ['citadel',0,19,'#304954'],['foundry',0,7,'#d4a46a'],['depot',9,20,'#91c9d0'],
] as const)('%s exposes facade details toward the arena rather than behind the mass',(id,x,y,color)=>{
  const scene=new THREE.Group();buildTacticalArena(scene,id);scene.updateMatrixWorld(true);
  const skyline=scene.getObjectByName(id+'-skyline') as THREE.InstancedMesh;
  const hit=new THREE.Raycaster(new THREE.Vector3(x,y,-62),new THREE.Vector3(0,0,-1)).intersectObject(skyline)[0];
  expect(hit).toBeDefined();
  const actual=new THREE.Color();skyline.getColorAt(hit.instanceId!,actual);
  expect(actual.getHexString()).toBe(new THREE.Color(color).getHexString());
});

for(const id of ['depot','crossroads','foundry','alleyways','citadel','canal'] as const) {
  it(`${id} keeps its skyline outside the playable arena with a single draw batch`,()=>{
    const scene=new THREE.Group();buildTacticalArena(scene,id);
    const skyline=scene.getObjectByName(id+'-skyline') as THREE.InstancedMesh;
    expect(skyline).toBeDefined();
    expect(skyline.isInstancedMesh).toBe(true);
    expect(skyline.count).toBeGreaterThan(5);expect(skyline.count).toBeLessThan(180);
    const matrix=new THREE.Matrix4();skyline.geometry.computeBoundingBox();
    for(let i=0;i<skyline.count;i++) {
      skyline.getMatrixAt(i,matrix);
      const box=skyline.geometry.boundingBox!.clone().applyMatrix4(matrix);
      expect(box.max.z).toBeLessThan(-61);
      expect(box.min.y).toBeGreaterThanOrEqual(0);
    }
    expect(new THREE.Box3().setFromObject(skyline).max.y).toBeGreaterThan(20);
  });
}
