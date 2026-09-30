import { describe, expect, it } from 'vitest';
import { createPayloadObjective } from './payload.js';

describe('payload objective', () => {
  it('starts at the site ready for an attacker to plant', () => {
    expect(createPayloadObjective([4, -4])).toEqual({
      state: 'ready',
      position: [4, -4],
      actionEndsAt: 0,
      actionPlayerId: undefined,
      plantedEndsAt: 0,
    });
  });
});
