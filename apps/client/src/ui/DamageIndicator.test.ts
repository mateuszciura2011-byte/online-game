import { describe, expect, it } from 'vitest';
import { damageIndicatorAngle } from './DamageIndicator.js';

describe('damage indicator', () => {
  it('keeps an attacker directly ahead at the top of the screen', () => {
    expect(damageIndicatorAngle(0, { x: 0, z: 0 }, { x: 0, z: -10 })).toBeCloseTo(0);
  });

  it('turns a right-side attacker into a right-side warning', () => {
    expect(damageIndicatorAngle(0, { x: 0, z: 0 }, { x: 10, z: 0 })).toBeCloseTo(90);
  });
});
