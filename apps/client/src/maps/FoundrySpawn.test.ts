import { it, expect } from 'vitest';
import * as THREE from 'three';
import { getMapDefinition } from '@polystrike/shared/maps';
import { buildFoundry } from './Foundry.js';
import { buildDepot } from './Depot.js';
import { buildCrossroads } from './Crossroads.js';
import { buildAlleyways } from './Alleyways.js';
import { buildCitadel } from './Citadel.js';
import { buildCanal } from './Canal.js';

it.each([['depot', buildDepot], ['crossroads', buildCrossroads], ['foundry', buildFoundry], ['alleyways', buildAlleyways], ['citadel', buildCitadel], ['canal', buildCanal]] as const)('keeps every %s spawn camera outside visible architecture', (id, build) => {
  const scene = new THREE.Group(); build(scene); scene.updateMatrixWorld(true);
  for (const spawn of getMapDefinition(id).spawns) {
    const eye = new THREE.Vector3(spawn.x, 1.7, spawn.z);
    const intersections: string[] = [];
    scene.traverse(object => {
      if (object instanceof THREE.InstancedMesh) {
        object.geometry.computeBoundingBox();
        for (let index = 0; index < object.count; index++) {
          const matrix = new THREE.Matrix4(); object.getMatrixAt(index, matrix);
          const box = object.geometry.boundingBox!.clone().applyMatrix4(matrix).applyMatrix4(object.matrixWorld);
          if (box.containsPoint(eye)) intersections.push(object.name + ':' + index);
        }
        return;
      }
      if (object instanceof THREE.Mesh && new THREE.Box3().setFromObject(object).containsPoint(eye)) intersections.push(object.name);
    });
    expect(intersections, `spawn ${spawn.x}, ${spawn.z}`).toEqual([]);
  }
});
