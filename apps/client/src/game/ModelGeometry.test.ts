import {expect,it} from 'vitest';
import * as THREE from 'three';
import {barrelGeometry,chamferBox} from './ModelGeometry.js';
import {createTrainingTarget} from '../training/TrainingTarget.js';

it('keeps authored dimensions and finite outward-facing barrel caps',()=>{
  const box=chamferBox(.3,.2,.9);expect(box.boundingBox!.getSize(new THREE.Vector3()).toArray()).toEqual(expect.arrayContaining([expect.closeTo(.3),expect.closeTo(.2),expect.closeTo(.9)]));
  const barrel=barrelGeometry(.055,1.25);const mesh=new THREE.Mesh(barrel,new THREE.MeshBasicMaterial());mesh.updateMatrixWorld();
  const hit=new THREE.Raycaster(new THREE.Vector3(0,0,-2),new THREE.Vector3(0,0,1)).intersectObject(mesh)[0];
  expect(hit?.point.z).toBeCloseTo(-.625);expect(hit?.face?.normal.z).toBeLessThan(-.99);
  expect([...barrel.attributes.position!.array].every(Number.isFinite)).toBe(true);
});

it('keeps target identity when a training shot lands on the decorative bullseye',()=>{
  const target=createTrainingTarget('test-target');target.updateMatrixWorld(true);
  for(const side of [-1,1]) {
    const hit=new THREE.Raycaster(new THREE.Vector3(0,.05,side*3),new THREE.Vector3(0,0,-side)).intersectObject(target,true)[0];
    expect(hit?.object.userData.targetId).toBe('test-target');
  }
});
