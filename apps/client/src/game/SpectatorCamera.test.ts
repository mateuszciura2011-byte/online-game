import { describe, expect, it } from 'vitest';
import { getNextSpectatedPlayer } from './SpectatorCamera.js';

describe('getNextSpectatedPlayer', () => {
  it('cycles only through alive players', () => {
    expect(getNextSpectatedPlayer(['one', 'three'], 'one')).toBe('three');
    expect(getNextSpectatedPlayer(['one', 'three'], 'three')).toBe('one');
    expect(getNextSpectatedPlayer([], 'one')).toBeUndefined();
  });
});
