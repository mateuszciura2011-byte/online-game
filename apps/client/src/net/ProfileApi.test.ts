import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProfileApi } from './ProfileApi.js';

const profile = { id: 'test-profile', coins: 100, crateCount: 0, ownedSkinIds: ['recruit'], equippedSkinId: 'recruit', equippedPrimaryWeapon: 'rifle' };
let saved: Map<string, string>;
beforeEach(() => {
  saved = new Map();
  vi.stubGlobal('localStorage', { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) });
});
afterEach(() => vi.unstubAllGlobals());

it.each(['get', 'getStats'] as const)('rejects failed %s responses instead of returning them as profile data', async method => {
  vi.stubGlobal('fetch', async (url: string) => url.endsWith('/account/new')
    ? Response.json({ profile, token: 'test-session' })
    : Response.json({ error: 'unavailable' }, { status: 503 }));
  const api = new ProfileApi();
  await expect(api[method]()).rejects.toThrow();
});

it('shares one new account across concurrent session consumers', async () => {
  let created = 0;
  vi.stubGlobal('fetch', async () => Response.json({ profile, token: `guest-${++created}` }));
  const api = new ProfileApi();
  const tokens = await Promise.all([api.accountCode(), api.accountCode(), api.accountCode()]);
  expect(tokens).toEqual(['guest-1', 'guest-1', 'guest-1']);
  expect(created).toBe(1);
  expect(saved.get('polystrike-account-code')).toBe('guest-1');
});

it('preserves a saved account after a temporary resume failure and permits retry', async () => {
  saved.set('polystrike-account-code', 'saved-account');
  let available = false;
  let creations = 0;
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.endsWith('/account/new')) { creations++; return Response.json({ profile, token: 'replacement' }); }
    return available ? Response.json({ profile }) : Response.json({ error: 'unavailable' }, { status: 503 });
  });
  const api = new ProfileApi();
  await expect(api.accountCode()).rejects.toThrow();
  expect(saved.get('polystrike-account-code')).toBe('saved-account');
  expect(creations).toBe(0);
  available = true;
  await expect(api.accountCode()).resolves.toBe('saved-account');
});

it('does not cache or save a failed account creation', async () => {
  let available = false;
  vi.stubGlobal('fetch', async () => available ? Response.json({ profile, token: 'new-account' }) : Response.json({ error: 'unavailable' }, { status: 503 }));
  const api = new ProfileApi();
  await expect(api.accountCode()).rejects.toThrow();
  expect(saved.has('polystrike-account-code')).toBe(false);
  available = true;
  await expect(api.accountCode()).resolves.toBe('new-account');
});
