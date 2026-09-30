import { describe, expect, it } from 'vitest';
import { crosshairScale, recoilKick } from './CombatFeedback.js';

describe('combat feedback', () => {
  it('makes the reticle visibly wider while moving and sprinting', () => {
    expect(crosshairScale({ movingSpeed: 0, sprinting: false, firing: false })).toBe(1);
    expect(crosshairScale({ movingSpeed: 4, sprinting: false, firing: false })).toBeGreaterThan(1);
    expect(crosshairScale({ movingSpeed: 9, sprinting: true, firing: false })).toBeGreaterThan(
      crosshairScale({ movingSpeed: 4, sprinting: false, firing: false }),
    );
  });

  it('uses a larger upward kick for a sniper rifle than a pistol', () => {
    expect(recoilKick('sniper').vertical).toBeGreaterThan(recoilKick('pistol').vertical);
  });
});
