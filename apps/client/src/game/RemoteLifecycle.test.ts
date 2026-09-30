import { expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { RemotePlayers } from './RemotePlayers.js';

it('removes departed players from rendering and aiming and releases their resources once', () => {
  const scene = new THREE.Scene(); const players = new RemotePlayers(scene);
  const state = { serverTime: 0, position: [0,0,0] as [number,number,number], yaw: 0, pitch: 0, alive: true };
  players.push('gone', state); players.push('kept', state);
  const gone = scene.children[0];
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
  gone.traverse(object => { if(object instanceof THREE.Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(item => materials.add(item)); } });
  const disposals = [...geometries, ...materials].map(resource => vi.spyOn(resource, 'dispose'));
  players.retain(['kept']);
  expect(scene.children).toHaveLength(1);
  expect(players.shotTargets().some(target => target.parent === gone)).toBe(false);
  disposals.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
  players.retain([]); expect(scene.children).toHaveLength(0); expect(players.shotTargets()).toHaveLength(0);
  disposals.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
});
