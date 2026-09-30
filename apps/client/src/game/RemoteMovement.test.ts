import { expect, it } from 'vitest';
import * as THREE from 'three';
import { RemotePlayers } from './RemotePlayers.js';

it('stops running in place when position updates stop arriving', () => {
  const scene = new THREE.Scene();
  const players = new RemotePlayers(scene);
  players.push('runner', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });
  players.push('runner', { position: [1, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 100, alive: true });
  players.render(150);
  const leg = scene.children[0]!.getObjectByName('left-leg')!;
  expect(Math.abs(leg.rotation.x)).toBeGreaterThan(.01);
  players.render(500);
  expect(scene.children[0]!.position.x).toBe(1);
  expect(leg.rotation.x).toBe(0);
});

it('keeps walking during buffered movement even if the newest packet reports a stop', () => {
  const scene = new THREE.Scene();
  const players = new RemotePlayers(scene);
  for (const [serverTime, x] of [[0, 0], [100, 1], [200, 1]]) {
    players.push('runner', { position: [x, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime, alive: true });
  }
  players.render(150);
  const leg = scene.children[0]!.getObjectByName('left-leg')!;
  expect(scene.children[0]!.position.x).toBeCloseTo(.5);
  expect(Math.abs(leg.rotation.x)).toBeGreaterThan(.01);
  players.render(300);
  expect(leg.rotation.x).toBe(0);
});
