import { expect, it } from 'vitest';
import { AccountService } from './AccountService.js';
import { ProfileStore } from './ProfileStore.js';
import { resolveMatchPrimary } from './MatchLoadout.js';

it('resolves the authenticated equipped primary and falls back to pistol', () => {
  const accounts = new AccountService(new ProfileStore());
  const session = accounts.createAnonymousAccount();
  expect(resolveMatchPrimary(accounts, session.token)).toBe('rifle');
  expect(resolveMatchPrimary(accounts, 'forged')).toBe('pistol');
  expect(resolveMatchPrimary(accounts, undefined)).toBe('pistol');
});
