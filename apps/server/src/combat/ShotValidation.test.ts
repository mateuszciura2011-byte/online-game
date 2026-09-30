import { describe, expect, it } from 'vitest';
import { selectShotTarget } from './ShotValidation.js';

describe('selectShotTarget', () => {
  const shooter = { x: 0, z: 0 };
  const request = { origin: [0, 1.7, 0] as [number, number, number], direction: [0, 0, -1] as [number, number, number] };

  it('does not choose an enemy outside the shooter aim direction', () => {
    expect(selectShotTarget(shooter, [{ id: 'side', x: 6, z: -3 }], request, [], 'rifle')).toBeUndefined();
  });

  it('does not choose an enemy hidden behind an arena wall', () => {
    expect(selectShotTarget(shooter, [{ id: 'behind-wall', x: 0, z: -6 }], request, [{ minX: -1, maxX: 1, minZ: -4, maxZ: -3 }], 'rifle')).toBeUndefined();
  });
});
