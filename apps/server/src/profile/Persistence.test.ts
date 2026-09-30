import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { AccountService } from './AccountService.js';
import { ProfileStore } from './ProfileStore.js';

describe('persistent profiles', () => {
  it('keeps account access and coins after a server restart', () => {
    const directory = mkdtempSync(join(tmpdir(), 'polystrike-'));
    try { const profiles = new ProfileStore(join(directory, 'profiles.json')); const accounts = new AccountService(profiles, join(directory, 'accounts.json')); const account = accounts.createAnonymousAccount(); profiles.awardVictory(account.profile.id, 'match-1'); const restartedProfiles = new ProfileStore(join(directory, 'profiles.json')); const restartedAccounts = new AccountService(restartedProfiles, join(directory, 'accounts.json')); expect(restartedAccounts.resume(account.token)?.coins).toBe(100); } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
