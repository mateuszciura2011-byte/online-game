import { WEAPONS, type WeaponId } from '@polystrike/shared/weapons';

export type WeaponControllerState = {
  weaponId: WeaponId;
  ammo: number;
  reserve: number;
  reloading: boolean;
};

export class WeaponController {
  private ammo: number;
  private reserve: number;
  private lastFireAt = Number.NEGATIVE_INFINITY;
  private reloadEndsAt = 0;

  constructor(private weaponId: WeaponId = 'pistol') {
    this.ammo = WEAPONS[weaponId].magazine;
    this.reserve = WEAPONS[weaponId].reserve;
  }

  fire(now: number) {
    this.finishReload(now);
    const weapon = WEAPONS[this.weaponId];
    const empty = this.weaponId !== 'knife' && this.ammo <= 0;
    if (empty || this.reloadEndsAt || now - this.lastFireAt < weapon.fireIntervalMs) return { fired: false, empty };
    this.lastFireAt = now;
    if (this.weaponId !== 'knife') this.ammo -= 1;
    return { fired: true, empty: false, recoil: this.weaponId === 'sniper' ? 1.8 : this.weaponId === 'shotgun' ? 1.3 : .65 };
  }

  reload(now: number) {
    this.finishReload(now);
    const weapon = WEAPONS[this.weaponId];
    if (this.weaponId === 'knife' || this.reloadEndsAt || this.ammo >= weapon.magazine || this.reserve <= 0) return false;
    this.reloadEndsAt = now + weapon.reloadMs;
    return true;
  }

  update(now: number): WeaponControllerState {
    this.finishReload(now);
    return { weaponId: this.weaponId, ammo: this.ammo, reserve: this.reserve, reloading: this.reloadEndsAt > 0 };
  }

  equip(weaponId: WeaponId) {
    this.weaponId = weaponId;
    this.ammo = WEAPONS[weaponId].magazine;
    this.reserve = WEAPONS[weaponId].reserve;
    this.reloadEndsAt = 0;
  }

  private finishReload(now: number) {
    if (!this.reloadEndsAt || now < this.reloadEndsAt) return;
    const capacity = WEAPONS[this.weaponId].magazine;
    const amount = Math.min(capacity - this.ammo, this.reserve);
    this.ammo += amount;
    this.reserve -= amount;
    this.reloadEndsAt = 0;
  }
}
