import {expect,it} from 'vitest';
import * as THREE from 'three';
import {disposeMap} from './MapResources.js';
import {buildTacticalArena} from './TacticalArena.js';

it('releases instance buffers and shared geometry/materials exactly once before clearing the map',()=>{
  const root=new THREE.Group(),nested=new THREE.Group();root.add(nested);
  const geometry=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial();
  const instances=new THREE.InstancedMesh(geometry,material,2);
  nested.add(instances,new THREE.Mesh(geometry,[material,material]));
  let instanceDisposals=0,geometryDisposals=0,materialDisposals=0;
  instances.addEventListener('dispose',()=>instanceDisposals++);
  geometry.addEventListener('dispose',()=>geometryDisposals++);
  material.addEventListener('dispose',()=>materialDisposals++);
  disposeMap(root);disposeMap(root);
  expect(instanceDisposals).toBe(1);
  expect(geometryDisposals).toBe(1);
  expect(materialDisposals).toBe(1);
  expect(root.children).toHaveLength(0);
});

it('releases every instanced batch during repeated production map replacements',()=>{
  const root=new THREE.Group();
  for(const id of ['depot','crossroads','foundry','alleyways','citadel','canal'] as const) {
    buildTacticalArena(root,id);
    let expected=0,disposed=0;
    root.traverse(object=>{
      if(object instanceof THREE.InstancedMesh) {expected++;object.addEventListener('dispose',()=>disposed++);}
    });
    expect(expected).toBeGreaterThan(3);
    disposeMap(root);
    expect(disposed).toBe(expected);
    expect(root.children).toHaveLength(0);
  }
});
