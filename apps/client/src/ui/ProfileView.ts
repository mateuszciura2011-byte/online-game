import type { Profile } from '../net/ProfileApi.js';

export class ProfileView {
  constructor(private readonly root: HTMLElement) {}

  render(profile: Profile) {
    const crateLabel = profile.crateCount === 1 ? '1 skrzynka' : `${profile.crateCount} skrzynki`;
    const skinLabel = profile.ownedSkinIds.length === 1 ? '1 skin' : `${profile.ownedSkinIds.length} skiny`;
    this.root.innerHTML = `<section class="profile-summary"><strong>${profile.coins} coinów</strong><span>${crateLabel}</span><span>${skinLabel}</span><span>Broń: ${profile.equippedPrimaryWeapon.toUpperCase()}</span></section>`;
  }
}
