import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StatsService } from './StatsService.js';

describe('StatsService', () => {
  it('records one completed match only once for the same player', () => {
    const stats = new StatsService();
    const delta = { matchesPlayed: 1, wins: 1, kills: 7, deaths: 2, shotsFired: 20, shotsHit: 11, playTimeSeconds: 180 };
    stats.recordCompletedMatch('mecz-1', 'profil-1', delta);
    stats.recordCompletedMatch('mecz-1', 'profil-1', delta);
    expect(stats.get('profil-1')).toEqual(delta);
  });
  it('restores career stats after a server restart', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'polystrike-stats-')), 'stats.json');
    const first = new StatsService(path);
    first.recordCompletedMatch('mecz-2', 'profil-2', { matchesPlayed: 1, wins: 0, kills: 3, deaths: 1, shotsFired: 12, shotsHit: 4, playTimeSeconds: 60 });

    const restored = new StatsService(path);
    restored.recordCompletedMatch('mecz-2', 'profil-2', { matchesPlayed: 1, wins: 0, kills: 3, deaths: 1, shotsFired: 12, shotsHit: 4, playTimeSeconds: 60 });
    expect(restored.get('profil-2')).toEqual({ matchesPlayed: 1, wins: 0, kills: 3, deaths: 1, shotsFired: 12, shotsHit: 4, playTimeSeconds: 60 });
  });
});
