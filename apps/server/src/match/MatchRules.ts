import type { GameMode } from '@polystrike/shared/protocol';

export interface MatchResult { reason: 'score_limit' | 'time_limit' | 'elimination'; winnerPlayerId?: string; winnerTeam?: 'blue' | 'red'; draw: boolean; }
export function scoreLimit(mode: GameMode) { return mode === 'team_deathmatch' ? 50 : 30; }
export function resolveMatch(mode: GameMode, scores: Record<string, number>, elapsedSeconds: number): MatchResult | undefined {
  const limit = scoreLimit(mode); const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (elapsedSeconds < 600 && (!ordered[0] || ordered[0][1] < limit)) return undefined;
  if (!ordered[0] || ordered[0][1] === ordered[1]?.[1]) return { reason: elapsedSeconds >= 600 ? 'time_limit' : 'score_limit', draw: true };
  return mode === 'team_deathmatch' ? { reason: elapsedSeconds >= 600 ? 'time_limit' : 'score_limit', winnerTeam: ordered[0][0] as 'blue' | 'red', draw: false } : { reason: elapsedSeconds >= 600 ? 'time_limit' : 'score_limit', winnerPlayerId: ordered[0][0], draw: false };
}
