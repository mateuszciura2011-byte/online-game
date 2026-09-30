import { describe, expect, it } from 'vitest';
import { getMapDefinition, pointInCollider } from './maps.js';

describe('shared playable maps', () => {
  it('provides larger distinct layouts and connected safe spawns', () => {
    const layouts = new Set<string>();
    for (const id of ['depot', 'crossroads', 'foundry', 'alleyways', 'citadel', 'canal']) {
      const map = getMapDefinition(id);
      expect(map.arenaLimit).toBeGreaterThanOrEqual(55);
      layouts.add(JSON.stringify(map.colliders));
      for (const spawn of map.spawns) expect(map.colliders.some(c => spawn.x >= c.minX - 1.1 && spawn.x <= c.maxX + 1.1 && spawn.z >= c.minZ - 1.1 && spawn.z <= c.maxZ + 1.1)).toBe(false);
    }
    expect(layouts.size).toBe(6);
  });
  it('keeps every configured spawn outside the collision geometry', () => {
    for (const id of ['depot', 'crossroads', 'foundry', 'alleyways', 'citadel', 'canal']) {
      const map = getMapDefinition(id);
      expect(map.id).toBe(id);
      expect(map.spawns.every((spawn) => !map.colliders.some((collider) => pointInCollider(spawn, collider)))).toBe(true);
    }
  });
});
