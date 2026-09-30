import { expect, it } from 'vitest';
import { AccountService } from './AccountService.js';
import { ProfileStore } from './ProfileStore.js';
import { resolveMatchSkin } from './MatchSkin.js';

it('uses only an owned equipped skin from the authenticated profile', () => {
  const accounts = new AccountService(new ProfileStore());
  const session = accounts.createAnonymousAccount();
  session.profile.ownedSkinIds.push('gold');
  session.profile.equippedSkinId = 'gold';
  expect(resolveMatchSkin(accounts, session.token)).toBe('gold');
  expect(resolveMatchSkin(accounts, 'forged')).toBe('recruit');
  expect(resolveMatchSkin(accounts, undefined)).toBe('recruit');
  session.profile.ownedSkinIds = ['recruit'];
  expect(resolveMatchSkin(accounts, session.token)).toBe('recruit');
  session.profile.ownedSkinIds.push('unknown');
  session.profile.equippedSkinId = 'unknown';
  expect(resolveMatchSkin(accounts, session.token)).toBe('recruit');
});
