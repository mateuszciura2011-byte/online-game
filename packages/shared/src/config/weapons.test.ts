import { describe, expect, it } from 'vitest';
import { BUY_PRICES, WEAPONS } from './weapons.js';

describe('WEAPONS', () => {
  it('contains exactly six weapons with positive damage', () => {
    expect(Object.keys(WEAPONS)).toEqual(['knife', 'pistol', 'smg', 'rifle', 'sniper', 'shotgun']);
    expect(Object.values(WEAPONS).every((weapon) => weapon.damage > 0)).toBe(true);
  });

  it('defines the timing, range and reserve ammunition used by combat', () => {
    expect(WEAPONS.rifle).toMatchObject({ magazine: 24, reserve: 96, fireIntervalMs: 130, range: 46 });
    expect(WEAPONS.shotgun.pellets).toBe(8);
  });

  it('shares the same purchase prices with the lobby and the server', () => {
    expect(BUY_PRICES).toMatchObject({ pistol: 0, smg: 1_200, rifle: 2_200, sniper: 4_750, shotgun: 1_600 });
  });
});
