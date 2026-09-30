import {it,expect} from 'vitest';
import * as THREE from 'three';
import {applyArenaPresentation} from './ArenaPresentation.js';

it('changes the sky per arena and releases the previous background',()=>{
  const scene=new THREE.Scene();
  applyArenaPresentation(scene,'depot');
  const first=scene.background as THREE.DataTexture;
  expect(first.isTexture).toBe(true);
  const initial=Array.from(first.image.data!);
  let released=false; first.addEventListener('dispose',()=>{released=true;});
  applyArenaPresentation(scene,'foundry');
  expect(released).toBe(true);
  expect(Array.from((scene.background as THREE.DataTexture).image.data!)).not.toEqual(initial);
  expect((scene.fog as THREE.Fog).near).toBeGreaterThan(60);
  expect((scene.fog as THREE.Fog).far).toBeGreaterThan(150);
});
