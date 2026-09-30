import { describe, expect, it } from 'vitest';
import { isValidMatchStats } from './StatsValidation.js';

const valid = { matchesPlayed: 1, wins: 1, kills: 7, deaths: 2, shotsFired: 40, shotsHit: 18, playTimeSeconds: 220 };
describe('match stats validation', () => {
  it('accepts plausible round results', () => expect(isValidMatchStats(valid)).toBe(true));
  it('rejects forged totals and impossible accuracy', () => { expect(isValidMatchStats({ ...valid, kills: 999999 })).toBe(false); expect(isValidMatchStats({ ...valid, shotsHit: 41 })).toBe(false); });
});
