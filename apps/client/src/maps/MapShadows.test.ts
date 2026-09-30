import {expect,it} from 'vitest';
import * as THREE from 'three';
import {buildTacticalArena} from './TacticalArena.js';
import {configureMapShadows} from './MapShadows.js';

it('keeps distant skyline out of shadows while enabling playable cover shadows',()=>{
  const root=new THREE.Group();buildTacticalArena(root,'crossroads');
  configureMapShadows(root);
  const skyline=root.getObjectByName('crossroads-skyline')!;
  expect(skyline.castShadow).toBe(false);
  expect(skyline.receiveShadow).toBe(false);
  const cover:THREE.Mesh[]=[];
  root.traverse(o=>{if(o instanceof THREE.Mesh&&o!==skyline)cover.push(o);});
  expect(cover.length).toBeGreaterThan(0);
  expect(cover.every(o=>o.castShadow&&o.receiveShadow)).toBe(true);
});
