import { describe, expect, it } from 'vitest';
import { AccountService } from './AccountService.js';
import { ProfileStore } from './ProfileStore.js';

describe('account sessions', () => {
  it('resumes the same profile with its account token', () => {
    const accounts = new AccountService(new ProfileStore());
    const account = accounts.createAnonymousAccount();
    expect(accounts.resume(account.token)?.id).toBe(account.profile.id);
  });

  it('links an anonymous profile to an email account for another computer', () => {
    const profiles = new ProfileStore();
    const accounts = new AccountService(profiles);
    const guest = accounts.createAnonymousAccount();
    profiles.awardVictory(guest.profile.id, 'match-1');

    accounts.register('LUKAS@example.com', 'bezpieczne-haslo-123', guest.token);
    const signedIn = accounts.signIn('lukas@example.com', 'bezpieczne-haslo-123');

    expect(signedIn.profile.id).toBe(guest.profile.id);
    expect(signedIn.profile.coins).toBe(100);
  });
});
