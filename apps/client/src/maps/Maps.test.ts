import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getMapDefinition } from '@polystrike/shared/maps';
import { buildTacticalArena } from './TacticalArena.js';
import { resolveCameraCollision } from '../game/GroundMovement.js';
import { readFileSync } from 'node:fs';

describe('collision-owned tactical maps', () => {
  it('keeps the fallback floor below map pavement without a coplanar grid', () => {
    const main = readFileSync(new URL('../main.ts', import.meta.url), 'utf8');
    expect(main).toContain('floor.position.y = -0.1');
    expect(main).not.toContain('new THREE.GridHelper(');
  });
  for (const id of ['depot','crossroads','foundry','alleyways','citadel','canal'] as const) {
    it(id + ' renders every collider at its exact position and blocks movement through it', () => {
      const scene = new THREE.Group(); buildTacticalArena(scene,id); scene.updateMatrixWorld(true);
      const map = getMapDefinition(id);
      map.colliders.forEach((c,index) => {
        const mesh = scene.getObjectByName(id+'-solid-'+index)!;
        expect(mesh).toBeDefined();
        const bounds = new THREE.Box3().setFromObject(mesh);
        expect(bounds.min.x).toBeCloseTo(c.minX); expect(bounds.max.x).toBeCloseTo(c.maxX);
        expect(bounds.min.z).toBeCloseTo(c.minZ); expect(bounds.max.z).toBeCloseTo(c.maxZ);
        const from = {x:c.minX-2,y:1.7,z:(c.minZ+c.maxZ)/2};
        const to = {x:c.maxX+2,y:1.7,z:from.z};
        // A large frame step must not tunnel through a building.
        expect(resolveCameraCollision(from,to,id).x).toBe(from.x);
      });
      expect(scene.getObjectByName('team-spawn-blue')).toBeDefined();
      expect(scene.getObjectByName('team-spawn-red')).toBeDefined();
      expect(scene.getObjectByName('route-A')).toBeDefined();
      expect(scene.getObjectByName('route-B')).toBeDefined();
      expect(scene.children.length).toBeLessThan(40);
      const roofs=scene.getObjectByName(id+'-roof-silhouettes') as THREE.InstancedMesh;
      expect(roofs).toBeDefined();
      expect(roofs.count).toBeGreaterThan(3);
      const roofMatrix=new THREE.Matrix4();
      roofs.geometry.computeBoundingBox();
      for(let i=0;i<roofs.count;i++) {
        roofs.getMatrixAt(i,roofMatrix);
        const bounds=roofs.geometry.boundingBox!.clone().applyMatrix4(roofMatrix);
        expect(map.blocks.some(b=>bounds.min.x>=b.x-b.width/2-.01&&bounds.max.x<=b.x+b.width/2+.01&&bounds.min.z>=b.z-b.depth/2-.01&&bounds.max.z<=b.z+b.depth/2+.01&&bounds.min.y>=b.height)).toBe(true);
      }
      const architecture = scene.getObjectByName(id+'-architecture') as THREE.InstancedMesh;
      expect(architecture).toBeDefined();
      expect(architecture.count).toBeGreaterThan(30);
      expect(architecture.count).toBeLessThan(1200);
      const matrix = new THREE.Matrix4();
      for (let i=0;i<architecture.count;i++) {
        architecture.getMatrixAt(i,matrix);
        const bounds = new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(matrix);
        expect(map.blocks.some(b => bounds.min.x >= b.x-b.width/2-.06 && bounds.max.x <= b.x+b.width/2+.06 && bounds.min.z >= b.z-b.depth/2-.06 && bounds.max.z <= b.z+b.depth/2+.06)).toBe(true);
      }
    });
  }
});
