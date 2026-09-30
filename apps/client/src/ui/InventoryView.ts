import { SKINS } from '@polystrike/shared/config/skins';
import type { Profile } from '../net/ProfileApi.js';

export class InventoryView {
  constructor(private readonly root: HTMLElement) {}

  render(profile: Profile) {
    const missingCoins = Math.max(0, 300 - profile.coins);
    const purchaseHint = missingCoins
      ? `Potrzebujesz jeszcze ${missingCoins} coinów. Wygrywaj mecze, aby zdobywać po 100 coinów.`
      : 'Masz wystarczająco coinów na nową skrzynkę.';
    this.root.innerHTML = `
      <section class="inventory-summary">
        <p>COINY: <strong>${profile.coins}</strong> · SKRZYNKI: <strong>${profile.crateCount}</strong></p>
        <p class="inventory-hint">${purchaseHint}</p>
        <button id="buy-crate" ${missingCoins ? 'disabled aria-disabled="true"' : ''}>KUP SKRZYNKĘ · 300 COINÓW</button>
        <button id="open-owned-crate" ${profile.crateCount < 1 ? 'disabled aria-disabled="true"' : ''}>OTWÓRZ SKRZYNKĘ (${profile.crateCount})</button>
      </section>
      <section class="skin-list">
        ${SKINS.map((skin) => {
          const owned = profile.ownedSkinIds.includes(skin.id);
          const state = profile.equippedSkinId === skin.id ? 'WYPOSAŻONY' : owned ? 'WYPOSAŻ' : 'ZABLOKOWANY';
          return `<button class="skin-card rarity-${skin.rarity}" data-skin="${skin.id}" ${owned ? '' : 'disabled aria-disabled="true"'}><strong>${skin.name}</strong><span>${state}</span></button>`;
        }).join('')}
      </section>`;
  }
}
