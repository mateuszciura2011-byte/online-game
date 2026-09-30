import { WEAPONS, type WeaponId } from '@polystrike/shared/weapons';

/** One clock for clicks and held automatic fire; never catches up with a burst after a stall. */
export class FireControl {
  held = false;
  private pressed = false;
  private nextShotAt = 0;
  press() { this.held = true; this.pressed = true; }
  release() { this.held = false; this.pressed = false; }
  poll(weaponId: WeaponId, now: number, enabled: boolean) {
    if (!enabled) { this.release(); return false; }
    const automatic = weaponId === 'rifle' || weaponId === 'smg';
    const requested = this.pressed || (automatic && this.held);
    this.pressed = false;
    if (!requested || now < this.nextShotAt) return false;
    this.nextShotAt = now + WEAPONS[weaponId].fireIntervalMs;
    return true;
  }
}
