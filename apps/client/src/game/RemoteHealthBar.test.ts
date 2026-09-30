import { expect, it } from 'vitest';
import * as THREE from 'three';
import { RemotePlayers } from './RemotePlayers.js';

it('keeps health bars aligned with the viewing camera despite soldier rotation', () => {
  const scene = new THREE.Scene();
  const players = new RemotePlayers(scene);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(12, 5, 9);
  camera.lookAt(4, 2, -3);
  for (const [index, yaw] of [0, 1.2, -2.4].entries()) {
    players.push('enemy', { position: [4, 0, -3], yaw, pitch: 0, health: 75, alive: true, serverTime: index * 100 });
    players.render(index * 100 + 100, camera);
    const bar = scene.children[0]!.children.find(child => (child as THREE.Mesh).geometry?.type === 'PlaneGeometry')!;
    const rotation = bar.getWorldQuaternion(new THREE.Quaternion());
    expect(rotation.angleTo(camera.getWorldQuaternion(new THREE.Quaternion()))).toBeCloseTo(0, 6);
  }
});

it('keeps the left edge fixed on screen as health drops', () => {
  const scene = new THREE.Scene();
  const players = new RemotePlayers(scene);
  const camera = new THREE.PerspectiveCamera();
  camera.rotation.set(-.3, .8, 0);
  const edges: THREE.Vector3[] = [];
  for (const health of [100, 50, 0]) {
    players.push('enemy', { position: [4, 0, -3], yaw: 1.7, pitch: 0, health, alive: true, serverTime: health === 100 ? 0 : health === 50 ? 100 : 200 });
    players.render(health === 100 ? 100 : health === 50 ? 200 : 300, camera);
    const bar = scene.children[0]!.children.find(child => (child as THREE.Mesh).geometry?.type === 'PlaneGeometry')!;
    scene.updateMatrixWorld(true);
    edges.push(bar.localToWorld(new THREE.Vector3(-.5, 0, 0)));
  }
  expect(edges[0]!.distanceTo(edges[1]!)).toBeLessThan(.000001);
  expect(edges[0]!.distanceTo(edges[2]!)).toBeLessThan(.000001);
});
