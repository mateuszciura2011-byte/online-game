import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface PlayerProfile { id: string; coins: number; crateCount: number; ownedSkinIds: string[]; equippedSkinId: string; equippedPrimaryWeapon: 'smg' | 'rifle' | 'sniper' | 'shotgun'; awardedMatchIds: string[]; }

export class ProfileStore {
  private profiles = new Map<string, PlayerProfile>();
  constructor(private readonly persistPath?: string) {
    if (!persistPath || !existsSync(persistPath)) return;
    const records = JSON.parse(readFileSync(persistPath, 'utf8')) as Array<Omit<PlayerProfile, 'awardedMatchIds' | 'crateCount'> & { awardedMatchIds?: string[]; crateCount?: number }>;
    records.forEach((profile) => this.profiles.set(profile.id, { ...profile, crateCount: profile.crateCount ?? 0, awardedMatchIds: profile.awardedMatchIds ?? [] }));
  }
  get(id: string) {
    if (!this.profiles.has(id)) { this.profiles.set(id, { id, coins: 0, crateCount: 0, ownedSkinIds: ['recruit'], equippedSkinId: 'recruit', equippedPrimaryWeapon: 'rifle', awardedMatchIds: [] }); this.save(); }
    return this.profiles.get(id)!;
  }
  awardVictory(id: string, matchId: string) {
    const profile = this.get(id);
    if (profile.awardedMatchIds.includes(matchId)) return profile.coins;
    profile.awardedMatchIds.push(matchId); profile.coins += 100; this.save(); return profile.coins;
  }
  save() { if (!this.persistPath) return; mkdirSync(dirname(this.persistPath), { recursive: true }); writeFileSync(this.persistPath, JSON.stringify([...this.profiles.values()])); }
}
