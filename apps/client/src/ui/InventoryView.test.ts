import { describe, expect, it } from 'vitest';
import { InventoryView } from './InventoryView.js';

const profile = { id: 'p', coins: 100, crateCount: 0, ownedSkinIds: ['recruit'], equippedSkinId: 'recruit', equippedPrimaryWeapon: 'rifle' as const };

describe('InventoryView', () => {
  it('explains how to earn and buy crates when the player has too few coins', () => {
    const root = { innerHTML: '' } as HTMLElement;
    new InventoryView(root).render(profile);

    expect(root.innerHTML).toContain('COINY: <strong>100</strong>');
    expect(root.innerHTML).toContain('Potrzebujesz jeszcze 200 coinów');
    expect(root.innerHTML).toContain('disabled');
    expect(root.innerHTML).toContain('ZABLOKOWANY');
  });
});
