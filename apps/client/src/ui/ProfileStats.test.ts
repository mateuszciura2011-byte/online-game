import { describe, expect, it } from 'vitest';
import { formatProfileStats } from './ProfileStats.js';
describe('profile stats', () => { it('formats accuracy, K/D and play time', () => { const text = formatProfileStats({ matchesPlayed: 4, wins: 2, kills: 9, deaths: 3, shotsFired: 20, shotsHit: 10, playTimeSeconds: 185 }); expect(text).toContain('50%'); expect(text).toContain('3.00'); expect(text).toContain('3 min'); }); });
