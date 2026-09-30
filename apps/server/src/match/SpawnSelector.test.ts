import { describe, expect, it } from 'vitest';
import { selectSafeSpawn } from './SpawnSelector.js';

describe('selectSafeSpawn', () => {
  it('avoids living allies and never falls back to an enemy base when occupied', () => {
    const points = [{ x: 0, z: 50, team: 'blue' as const }, { x: 10, z: 50, team: 'blue' as const }, { x: 0, z: -50, team: 'red' as const }];
    const players = [{ x: 0, z: 50, team: 'blue' as const, alive: true }];
    expect(selectSafeSpawn('blue', players, points)).toEqual(points[1]);
    players.push({ x: 10, z: 50, team: 'blue', alive: true });
    expect(selectSafeSpawn('blue', players, points)).toBeUndefined();
  });
  it('chooses a spawn for the requested team farthest from living enemies', () => {
    const spawn = selectSafeSpawn(
      'blue',
      [{ x: -8, z: -10, team: 'red', alive: true }],
      [
        { x: -10, z: -10, team: 'blue' },
        { x: 10, z: 10, team: 'blue' },
        { x: 0, z: 12, team: 'red' },
      ],
    );

    expect(spawn).toEqual({ x: 10, z: 10, team: 'blue' });
  });
});
