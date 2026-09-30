import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ArenaDressings } from './ArenaDressings.js';

describe('ArenaDressings', () => {
  it('releases geometry and materials when replacing or clearing an arena', () => {
    const scene = new THREE.Scene();
    const dressings = new ArenaDressings(scene);
    dressings.setArena('depot');
    const disposed: unknown[] = [];
    const resources: Array<THREE.BufferGeometry | THREE.Material> = [];
    scene.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      resources.push(node.geometry, ...(Array.isArray(node.material) ? node.material : [node.material]));
    });
    for (const resource of resources) resource.addEventListener('dispose', () => disposed.push(resource));
    dressings.setArena('foundry');
    expect(disposed).toHaveLength(resources.length);
    expect(new Set(disposed)).toEqual(new Set(resources));
    dressings.dispose();
    expect(dressings.meshCount()).toBe(0);
  });
  it('swaps a bounded set of landmarks for each arena', () => {
    const scene = new THREE.Scene();
    const dressings = new ArenaDressings(scene);

    dressings.setArena('depot');
    expect(dressings.meshCount()).toBeGreaterThan(3);
    expect(dressings.hasGlow('#27d8ff')).toBe(true);

    dressings.setArena('foundry');
    expect(dressings.meshCount()).toBeGreaterThan(3);
    expect(dressings.hasGlow('#ff9a4b')).toBe(true);
  });
});
