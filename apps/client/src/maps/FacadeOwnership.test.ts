import {expect,it} from 'vitest';
import * as THREE from 'three';
import {buildTacticalArena} from './TacticalArena.js';

it('leaves the wall beside a crossroads window clear of a second, misaligned window layer',()=>{
  const scene=new THREE.Group();buildTacticalArena(scene,'crossroads');scene.updateMatrixWorld(true);
  // First building: front z=-32. The new bay is at x=-32.8, y=5.6.
  // Old glowing panes also occupy x=-32.5,y=4.5, overlapping its bottom half.
  const ray=new THREE.Raycaster(new THREE.Vector3(-32.5,4, -40),new THREE.Vector3(0,0,1));
  const hit=ray.intersectObjects(scene.children,false)[0]!;
  expect(hit.object.name).toBe('crossroads-solid-0');
});
