import type { CareerStats } from './StatsService.js';

const fields: Array<keyof CareerStats> = ['matchesPlayed', 'wins', 'kills', 'deaths', 'shotsFired', 'shotsHit', 'playTimeSeconds'];

export function isValidMatchStats(value: unknown): value is CareerStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Record<string, unknown>;
  if (fields.some((field) => !Number.isInteger(stats[field]) || Number(stats[field]) < 0)) return false;
  const parsed = stats as Record<keyof CareerStats, number>;
  return parsed.matchesPlayed === 1 && parsed.wins <= 1 && parsed.kills <= 300 && parsed.deaths <= 300 && parsed.shotsFired <= 7_200 && parsed.shotsHit <= parsed.shotsFired && parsed.playTimeSeconds <= 600;
}
