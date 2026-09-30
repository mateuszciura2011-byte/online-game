import type { WeaponId } from '@polystrike/shared/weapons';
import type { AccountService } from './AccountService.js';

const primaryWeapons = new Set<WeaponId>(['smg', 'rifle', 'sniper', 'shotgun']);

export function resolveMatchPrimary(accounts: AccountService, token: unknown): WeaponId {
  if (typeof token !== 'string' || token.length > 256) return 'pistol';
  const primary = accounts.resume(token)?.equippedPrimaryWeapon;
  return primary && primaryWeapons.has(primary) ? primary : 'pistol';
}
