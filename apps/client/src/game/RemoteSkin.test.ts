import { expect, it } from 'vitest';
import * as THREE from 'three';
import { RemotePlayers } from './RemotePlayers.js';

it('does not expand bullet targets with decorative team patches',()=>{
  const scene=new THREE.Scene(),players=new RemotePlayers(scene);
  players.push('a',{serverTime:0,position:[0,0,0],yaw:0,pitch:0,alive:true});
  expect(players.shotTargets().some(object=>object.name.startsWith('team-patch-'))).toBe(false);
  expect(players.shotTargets().some(object=>object.name.startsWith('cosmetic-'))).toBe(false);
});

for(const id of ['a','b','c'])it('shows '+id+' team patch rather than armour when viewed directly from either side',()=>{
  const scene=new THREE.Scene(),players=new RemotePlayers(scene);
  players.push(id,{serverTime:0,position:[0,0,0],yaw:0,pitch:0,alive:true});scene.updateMatrixWorld(true);
  for(const side of [-1,1]) {
    const ray=new THREE.Raycaster(new THREE.Vector3(side*3,1.25,0),new THREE.Vector3(-side,0,0));
    expect(ray.intersectObjects(scene.children,true)[0]?.object.name).toBe('team-patch-'+(side<0?'left':'right'));
  }
});

it('keeps team patches visible from the rear and sides independently of cosmetic skins',()=>{
  const scene=new THREE.Scene(),players=new RemotePlayers(scene);
  players.push('b',{serverTime:0,position:[0,0,0],yaw:0,pitch:0,alive:true});
  players.setTeam('b','red');players.setSkin('b','frost');
  const patches:THREE.Mesh[]=[];scene.traverse(object=>{if(object.name.startsWith('team-patch-'))patches.push(object as THREE.Mesh);});
  expect(patches.length).toBeGreaterThanOrEqual(3);
  expect(patches.some(p=>p.position.z>.5)).toBe(true);
  expect(patches.some(p=>p.position.x<-.5)).toBe(true);
  expect(patches.some(p=>p.position.x>.5)).toBe(true);
  for(const patch of patches)expect((patch.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('c33163');
});

it('changes armour without changing the team marker or other players', () => {
  const scene = new THREE.Scene();
  const players = new RemotePlayers(scene);
  const state = { serverTime: 0, position: [0, 0, 0] as [number, number, number], yaw: 0, pitch: 0, alive: true };
  players.push('one', state); players.push('two', state);
  players.setTeam('one', 'enemy');
  const plate = (index: number) => (scene.children[index].getObjectByName('armour-plate') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>).material.color.getHexString();
  const original = plate(1);
  players.setSkin('one', 'gold');
  expect(plate(0)).toBe('b98b38');
  expect(plate(1)).toBe(original);
  const marker = scene.children[0].getObjectByName('team-marker') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  expect(marker.material.color.getHexString()).toBe('c33163');
  players.setSkin('one', 'unknown');
  expect(plate(0)).toBe(original);
});
