import { SKINS } from '@polystrike/shared/config/skins';
import type { AccountService } from './AccountService.js';

export function resolveMatchSkin(accounts: AccountService, token: unknown): string {
  if (typeof token !== 'string' || token.length > 256) return 'recruit';
  const profile = accounts.resume(token);
  const id = profile?.equippedSkinId;
  return id && profile.ownedSkinIds.includes(id) && SKINS.some(skin => skin.id === id) ? id : 'recruit';
}
