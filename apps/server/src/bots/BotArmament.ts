import { WEAPONS, type WeaponId } from '@polystrike/shared/weapons';
import { reloadWeapon, type CombatPlayer } from '../combat/CombatSystem.js';

/** Reload state follows the combat life; a respawn cannot inherit an old reload. */
export class BotArmament {
  private reloads = new WeakMap<CombatPlayer, { weaponId: WeaponId; endsAt: number }>();

  update(player: CombatPlayer, primary: WeaponId, now: number): { weaponId: WeaponId; ready: boolean } {
    const weaponId = player.ammo[primary] > 0 || player.reserve[primary] > 0 ? primary : 'pistol';
    const pending = this.reloads.get(player);
    if (pending && pending.weaponId !== weaponId) this.reloads.delete(player);
    if (!player.alive) { this.reloads.delete(player); return { weaponId, ready: false }; }
    if (pending?.weaponId === weaponId) {
      if (now < pending.endsAt) return { weaponId, ready: false };
      reloadWeapon(player, weaponId);
      this.reloads.delete(player);
    }
    if (player.ammo[weaponId] > 0) return { weaponId, ready: true };
    if (player.reserve[weaponId] > 0) this.reloads.set(player, { weaponId, endsAt: now + WEAPONS[weaponId].reloadMs });
    return { weaponId, ready: false };
  }
}
