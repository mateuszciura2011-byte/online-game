import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CombatVfx } from './CombatVfx.js';

describe('CombatVfx', () => {
  it('reuses a bounded tracer pool and clears it after its short lifetime', () => {
    const scene = new THREE.Scene();
    const vfx = new CombatVfx(scene, 3);
    for (let index = 0; index < 8; index += 1)
      vfx.fire(new THREE.Vector3(index, 0, 0), new THREE.Vector3(0, 0, -1));

    expect(vfx.activeCount()).toBe(3);
    vfx.update(.14);
    expect(vfx.activeCount()).toBe(0);
  });

  it('reuses a bounded impact pool for visible hits', () => {
    const scene = new THREE.Scene();
    const vfx = new CombatVfx(scene, 2);
    for (let index = 0; index < 6; index += 1)
      vfx.impact(new THREE.Vector3(index, 1, -2));

    expect(vfx.activeImpactCount()).toBe(2);
    vfx.update(.2);
    expect(vfx.activeImpactCount()).toBe(0);
  });

  it('adds a short impact spark at the end of every laser shot', () => {
    const scene = new THREE.Scene();
    const vfx = new CombatVfx(scene, 2);
    vfx.fire(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, -6));

    expect(vfx.activeImpactCount()).toBe(1);
  });
});
