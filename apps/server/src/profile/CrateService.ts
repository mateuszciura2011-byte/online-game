import { SKINS, type SkinRarity } from '@polystrike/shared/config/skins';
import { ProfileStore } from './ProfileStore.js';
export interface CrateOpenResult { skinId: string; rarity: SkinRarity; duplicate: boolean; coinsAfter: number; cratesAfter: number; }
export class CrateService {
  private purchases = new Map<string, { coinsAfter: number; cratesAfter: number }>();
  private completed = new Map<string, CrateOpenResult>();
  constructor(private profiles: ProfileStore, private random = Math.random) {}

  buyCrate(profileId: string, key: string) {
    const existing = this.purchases.get(`${profileId}:${key}`);
    if (existing) return existing;
    const profile = this.profiles.get(profileId);
    if (profile.coins < 300) throw new Error('Za mało coinów.');
    profile.coins -= 300;
    profile.crateCount += 1;
    const result = { coinsAfter: profile.coins, cratesAfter: profile.crateCount };
    this.purchases.set(`${profileId}:${key}`, result);
    this.profiles.save();
    return result;
  }

  openCrate(profileId: string, key: string): CrateOpenResult {
    const existing = this.completed.get(`${profileId}:${key}`);
    if (existing) return existing;
    const profile = this.profiles.get(profileId);
    if (profile.crateCount < 1) throw new Error('Nie masz skrzynki do otwarcia.');
    profile.crateCount -= 1;
    const roll = this.random();
    const rarity: SkinRarity = roll < .6 ? 'common' : roll < .9 ? 'rare' : roll < .99 ? 'epic' : 'legendary';
    const skin = SKINS.find((item) => item.rarity === rarity)!;
    const duplicate = profile.ownedSkinIds.includes(skin.id);
    if (duplicate) profile.coins += 50; else profile.ownedSkinIds.push(skin.id);
    const result = { skinId: skin.id, rarity, duplicate, coinsAfter: profile.coins, cratesAfter: profile.crateCount };
    this.completed.set(`${profileId}:${key}`, result);
    this.profiles.save();
    return result;
  }
}
