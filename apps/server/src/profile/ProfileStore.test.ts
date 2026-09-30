import { describe, expect, it } from 'vitest';
import { ProfileStore } from './ProfileStore.js';

describe('ProfileStore victories', () => {
  it('awards one hundred coins only once for the same match', () => {
    const profiles = new ProfileStore();
    expect(profiles.awardVictory('player', 'match-1')).toBe(100);
    expect(profiles.awardVictory('player', 'match-1')).toBe(100);
  });
});
