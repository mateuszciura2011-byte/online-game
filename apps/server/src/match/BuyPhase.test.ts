import { describe, expect, it } from 'vitest';
import { buyWeapon } from './BuyPhase.js';

describe('round purchases', () => {
  it('deducts the price of a rifle from the round cash', () => {
    expect(buyWeapon(2_400, 'rifle')).toEqual({ cash: 200, weaponId: 'rifle' });
  });

  it('refuses a weapon that costs more than the available cash', () => {
    expect(buyWeapon(800, 'sniper')).toBeUndefined();
  });
});
