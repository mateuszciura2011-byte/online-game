import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface CareerStats {
  matchesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  shotsFired: number;
  shotsHit: number;
  playTimeSeconds: number;
}

interface StoredStats {
  stats: Array<[string, CareerStats]>;
  recorded: string[];
}

export class StatsService {
  private stats = new Map<string, CareerStats>();
  private recorded = new Set<string>();

  constructor(private readonly persistPath?: string) {
    this.restore();
  }

  recordCompletedMatch(matchId: string, playerId: string, delta: CareerStats) {
    const key = `${matchId}:${playerId}`;
    if (this.recorded.has(key)) return;

    this.recorded.add(key);
    const current = this.stats.get(playerId) ?? this.emptyStats();
    for (const property of Object.keys(current) as Array<keyof CareerStats>) current[property] += delta[property];
    this.stats.set(playerId, current);
    this.save();
  }

  get(playerId: string) {
    return this.stats.get(playerId);
  }

  private emptyStats(): CareerStats {
    return { matchesPlayed: 0, wins: 0, kills: 0, deaths: 0, shotsFired: 0, shotsHit: 0, playTimeSeconds: 0 };
  }

  private restore() {
    if (!this.persistPath || !existsSync(this.persistPath)) return;
    try {
      const stored = JSON.parse(readFileSync(this.persistPath, 'utf8')) as StoredStats;
      if (Array.isArray(stored.stats)) this.stats = new Map(stored.stats);
      if (Array.isArray(stored.recorded)) this.recorded = new Set(stored.recorded);
    } catch {
      this.stats = new Map();
      this.recorded = new Set();
    }
  }

  private save() {
    if (!this.persistPath) return;
    mkdirSync(dirname(this.persistPath), { recursive: true });
    writeFileSync(this.persistPath, JSON.stringify({ stats: [...this.stats.entries()], recorded: [...this.recorded] } satisfies StoredStats, null, 2));
  }
}
