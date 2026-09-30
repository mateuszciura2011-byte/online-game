import { describe, expect, it } from 'vitest';
import { WeaponView, weaponHudText } from './WeaponView.js';
describe('weapon view', () => { it('uses ammunition and reloads it', () => { const weapon = new WeaponView(); weapon.fire(); expect(weapon.ammo.pistol).toBe(11); weapon.reload(); expect(weapon.ammo.pistol).toBe(12); expect(weapon.reserve.pistol).toBe(47); }); it('names the selected weapon in the HUD', () => { const weapon = new WeaponView(); weapon.equip('sniper'); expect(weaponHudText(weapon)).toBe('TRZYMASZ: SNAJPERKA 5/20'); }); });
