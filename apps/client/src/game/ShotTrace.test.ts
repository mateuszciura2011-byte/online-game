import { it, expect } from 'vitest';
import * as THREE from 'three';
import { traceShot } from './ShotTrace.js';

it('stops at cover instead of hitting a training target behind it', () => {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1)); wall.position.z = -3;
  const target = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); target.position.z = -6;
  const result = traceShot(new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 46, [wall], [target]);
  expect(result.target).toBeUndefined(); expect(result.impact).toBe(true);
  expect(result.point.z).toBeCloseTo(-2.5);
});
it('uses the camera aim endpoint at range when nothing is hit', () => {
  const result = traceShot(new THREE.Vector3(0, 1.7, 0), new THREE.Vector3(0, 0, -1), 32, [], []);
  expect(result.impact).toBe(false); expect(result.point.toArray()).toEqual([0, 1.7, -32]);
});
