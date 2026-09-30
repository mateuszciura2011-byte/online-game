import { WEAPONS, type WeaponId } from '@polystrike/shared/weapons';

export interface CombatPlayer { id: string; health: number; alive: boolean; ammo: Record<WeaponId, number>; reserve: Record<WeaponId, number>; lastFireAt: number; }
export interface HitResult { targetId: string; hitZone: 'head' | 'torso' | 'limb'; distance: number; damage: number; }
export function canFire(player: { ownedPrimary: WeaponId }, weaponId: WeaponId) { return weaponId === 'knife' || weaponId === 'pistol' || player.ownedPrimary === weaponId; }
export function resolveShot(input: { weaponId: WeaponId; distance: number; pelletsHit?: number }) { const weapon = WEAPONS[input.weaponId]; if (input.distance > weapon.range) return { damage: 0 }; const pellets = input.weaponId === 'shotgun' ? Math.max(0, Math.min(weapon.pellets, input.pelletsHit ?? 0)) : 1; return { damage: weapon.damage * pellets }; }
export function reloadWeapon(player: CombatPlayer, weaponId: WeaponId) { if (weaponId === 'knife') return false; const weapon = WEAPONS[weaponId]; const amount = Math.min(weapon.magazine - player.ammo[weaponId], player.reserve[weaponId]); if (amount <= 0) return false; player.ammo[weaponId] += amount; player.reserve[weaponId] -= amount; return true; }
export function validateAndResolveFire(shooter: CombatPlayer, weaponId: WeaponId, target: CombatPlayer | undefined, now: number, hitZone: HitResult['hitZone'] = 'torso'): HitResult[] {
  if (!shooter.alive || now - shooter.lastFireAt < WEAPONS[weaponId].fireIntervalMs || (weaponId !== 'knife' && shooter.ammo[weaponId] <= 0)) return [];
  shooter.lastFireAt = now; if (weaponId !== 'knife') shooter.ammo[weaponId] -= 1;
  if (!target?.alive) return [];
  const multiplier = hitZone === 'head' ? 2 : hitZone === 'limb' ? .7 : 1;
  const damage = Math.round(WEAPONS[weaponId].damage * multiplier); target.health = Math.max(0, target.health - damage); if (target.health === 0) target.alive = false;
  return [{ targetId: target.id, hitZone, distance: 0, damage }];
}
