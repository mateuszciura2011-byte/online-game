import { describe, expect, it } from 'vitest';
import { advanceJump, consumeQueuedJump, shouldSnapToSpawn } from './PlayerMotion.js';

describe('player motion', () => {
  it('places the camera at the spawn before buying instead of correcting it during buy phase', () => {
    expect(shouldSnapToSpawn('lobby', 'countdown')).toBe(true);
    expect(shouldSnapToSpawn('countdown', 'buy')).toBe(false);
  });

  it('starts a jump immediately and lands back on the ground', () => {
    const airborne = advanceJump({ height: 0, velocity: 0, grounded: true }, true, .1);
    expect(airborne.height).toBeGreaterThan(0);
    expect(airborne.grounded).toBe(false);
    expect(advanceJump({ height: .1, velocity: -3, grounded: false }, false, .2)).toMatchObject({ height: 0, grounded: true });
  });

  it('sends a quick jump press with the next movement packet', () => {
    expect(consumeQueuedJump(true, true)).toEqual({ jump: true, queued: false });
    expect(consumeQueuedJump(true, false)).toEqual({ jump: false, queued: false });
  });
});
