import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {getMapDefinition} from '@polystrike/shared/maps';
import {buildTacticalArena} from './TacticalArena.js';

describe('route wayfinding on all tactical arenas',()=>{
  it('keeps the B stem on the readers left from either spawn',()=>{
    const scene=new THREE.Group();buildTacticalArena(scene,'depot');scene.updateMatrixWorld(true);
    const paint=scene.getObjectByName('depot-route-paint')!;
    for(const [x,z] of [[51.28,42],[52.72,-42]]) {
      const hits=new THREE.Raycaster(new THREE.Vector3(x!,2,z!),new THREE.Vector3(0,-1,0)).intersectObject(paint);
      expect(hits[0]?.point.y).toBeGreaterThan(.03);
    }
  });
  for(const id of ['depot','crossroads','foundry','alleyways','citadel','canal'] as const) {
    it(id+' exposes inward-facing route boards without blocking the walkable area',()=>{
      const scene=new THREE.Group();buildTacticalArena(scene,id);scene.updateMatrixWorld(true);
      const signs=scene.getObjectByName(id+'-route-signs') as THREE.InstancedMesh;
      expect(signs).toBeDefined();
      expect(signs.count).toBeGreaterThan(4);
      expect(signs.count).toBeLessThan(180);
      // Both approaches must see real geometry, in front of the perimeter wall.
      for(const z of [-51,51]) for(const x of [-18,18]) {
        const ray=new THREE.Raycaster(new THREE.Vector3(x,2.6,z),new THREE.Vector3(0,0,Math.sign(z)));
        expect(ray.intersectObject(signs).length).toBeGreaterThan(0);
      }
      const matrix=new THREE.Matrix4();
      for(let i=0;i<signs.count;i++) {
        signs.getMatrixAt(i,matrix);
        const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(matrix);
        expect(bounds.min.y).toBeGreaterThan(1.7);
        expect(Math.min(Math.abs(bounds.min.z),Math.abs(bounds.max.z))).toBeGreaterThan(58.8);
      }
      const paint=scene.getObjectByName(id+'-route-paint') as THREE.InstancedMesh;
      expect(paint).toBeDefined();
      expect(paint.count).toBeGreaterThan(8);
      for(let i=0;i<paint.count;i++) {
        paint.getMatrixAt(i,matrix);
        const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(matrix);
        expect(bounds.max.y).toBeLessThan(.05);
        expect(getMapDefinition(id).colliders.some(c=>bounds.min.x<c.maxX&&bounds.max.x>c.minX&&bounds.min.z<c.maxZ&&bounds.max.z>c.minZ)).toBe(false);
      }
    });
  }
});
