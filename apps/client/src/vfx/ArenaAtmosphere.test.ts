import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { ArenaAtmosphere } from './ArenaAtmosphere.js';

describe('ArenaAtmosphere', () => {
  it('uses a fixed particle pool and switches to forge colour', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    const atmosphere = new ArenaAtmosphere(new THREE.Scene(), 12);
    expect(atmosphere.particleCount()).toBe(12);
    expect(atmosphere.points.geometry.getAttribute('position').count).toBe(12);
    atmosphere.setArena('foundry');
    expect((atmosphere.points.material as THREE.PointsMaterial).color.getHexString()).toBe('ff9a4b');
    vi.unstubAllGlobals();
  });
});
