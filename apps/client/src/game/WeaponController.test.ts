import { describe, expect, it } from 'vitest';
import { WeaponController } from './WeaponController.js';

describe('WeaponController', () => {
  it('enforces fire rate and reports an empty magazine', () => {
    const weapon = new WeaponController('pistol');

    expect(weapon.fire(1_000)).toMatchObject({ fired: true, empty: false });
    expect(weapon.fire(1_100)).toMatchObject({ fired: false, empty: false });
    for (let now = 1_220; now <= 3_420; now += 220) weapon.fire(now);
    expect(weapon.fire(3_640)).toMatchObject({ fired: false, empty: true });
  });

  it('reloads only after the configured reload time has elapsed', () => {
    const weapon = new WeaponController('rifle');
    weapon.fire(1_000);

    expect(weapon.reload(1_200)).toBe(true);
    expect(weapon.update(2_000).ammo).toBe(23);
    expect(weapon.update(3_500)).toMatchObject({ ammo: 24, reserve: 95, reloading: false });
  });
});
