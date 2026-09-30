import { WEAPONS, type WeaponId } from '@polystrike/shared/weapons';
import { reloadWeapon, type CombatPlayer } from './CombatSystem.js';

export class ReloadController {
  private pending = new WeakMap<CombatPlayer, { weaponId: WeaponId; endsAt: number }>();
  active(player: CombatPlayer) { return this.pending.has(player); }
  cancel(player: CombatPlayer) { this.pending.delete(player); }
  start(player: CombatPlayer, weaponId: WeaponId, now: number) {
    if (!player.alive || weaponId === 'knife' || this.active(player) || player.ammo[weaponId] >= WEAPONS[weaponId].magazine || player.reserve[weaponId] <= 0) return false;
    this.pending.set(player, { weaponId, endsAt: now + WEAPONS[weaponId].reloadMs });
    return true;
  }
  update(player: CombatPlayer, now: number): WeaponId | undefined {
    const pending = this.pending.get(player);
    if (!player.alive) { this.cancel(player); return; }
    if (!pending || now < pending.endsAt) return;
    this.cancel(player);
    reloadWeapon(player, pending.weaponId);
    return pending.weaponId;
  }
}
