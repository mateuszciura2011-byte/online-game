import { describe, expect, it } from 'vitest';
import { formatHud, shouldClearHudMessage } from './HudView.js';

describe('formatHud', () => {
  it('formats the live player state into compact HUD labels', () => {
    expect(formatHud({ health: 72, cash: 800, weapon: 'rifle', ammo: 24, reserve: 96 }))
      .toMatchObject({ health: 'HP 72', cash: '$800', weapon: 'KARABIN', ammo: '24 / 96' });
  });

  it('keeps values inside their valid display ranges', () => {
    expect(formatHud({ health: -5, cash: -20, weapon: 'pistol', ammo: -1, reserve: -3 }))
      .toMatchObject({ health: 'HP 0', cash: '$0', ammo: '0 / 0' });
  });

  it('leaves the buy phase message to its dedicated purchase panel', () => {
    expect(shouldClearHudMessage('buy')).toBe(true);
  });
});
