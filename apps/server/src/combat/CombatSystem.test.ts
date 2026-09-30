import { describe, expect, it } from 'vitest';
import { canFire, reloadWeapon, resolveShot, validateAndResolveFire } from './CombatSystem.js';
const player = (id: string) => ({ id, health: 100, alive: true, ammo: { knife: 0, pistol: 12, smg: 30, rifle: 24, sniper: 5, shotgun: 8 }, reserve: { knife: 0, pistol: 48, smg: 120, rifle: 96, sniper: 20, shotgun: 32 }, lastFireAt: -1000 });
describe('combat', () => { it('rejects a shot without ammunition', () => { const shooter = player('a'); shooter.ammo.pistol = 0; expect(validateAndResolveFire(shooter, 'pistol', player('b'), 1000)).toEqual([]); }); it('applies headshot damage', () => { const target = player('b'); expect(validateAndResolveFire(player('a'), 'pistol', target, 1000, 'head')[0].damage).toBe(50); }); });

describe('authoritative weapon validation', () => {
  it('rejects a primary weapon that the player does not own', () => {
    expect(canFire({ ownedPrimary: 'smg' }, 'rifle')).toBe(false);
    expect(canFire({ ownedPrimary: 'smg' }, 'smg')).toBe(true);
    expect(canFire({ ownedPrimary: 'smg' }, 'pistol')).toBe(true);
  });

  it('resolves shotgun pellet damage inside its configured range', () => {
    expect(resolveShot({ weaponId: 'shotgun', distance: 8, pelletsHit: 5 }).damage).toBeGreaterThan(0);
    expect(resolveShot({ weaponId: 'shotgun', distance: 20, pelletsHit: 8 }).damage).toBe(0);
  });

  it('reloads server ammunition from the authoritative reserve', () => {
    const shooter = player('a');
    shooter.ammo.rifle = 20;

    expect(reloadWeapon(shooter, 'rifle')).toBe(true);
    expect(shooter.ammo.rifle).toBe(24);
    expect(shooter.reserve.rifle).toBe(92);
  });
});
