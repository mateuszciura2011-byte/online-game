import { describe, expect, it } from 'vitest';
import { ProfileView } from './ProfileView.js';

describe('ProfileView', () => {
  it('shows the portable account progress summary', () => {
    const root = { innerHTML: '' } as HTMLElement;
    new ProfileView(root).render({ id: 'p', coins: 450, crateCount: 2, ownedSkinIds: ['recruit', 'neon'], equippedSkinId: 'neon', equippedPrimaryWeapon: 'smg' });

    expect(root.innerHTML).toContain('450 coinów');
    expect(root.innerHTML).toContain('2 skrzynki');
    expect(root.innerHTML).toContain('2 skiny');
  });
});
