import { describe, expect, it } from 'vitest';
import { localKillFeedback, respawnFeedback } from './MatchFeedback.js';

describe('match feedback', () => {
  it('celebrates a local elimination and explains a local death', () => {
    expect(localKillFeedback({ killerId: 'me', targetId: 'enemy' }, 'me')).toBe('ELIMINACJA +1');
    expect(localKillFeedback({ killerId: 'enemy', targetId: 'me' }, 'me')).toBe('ZGINĄŁEŚ — ODRODZENIE…');
  });

  it('shows a short, rounded respawn countdown', () => {
    expect(respawnFeedback(1490)).toBe('ODRODZENIE ZA 2…');
    expect(respawnFeedback(0)).toBe('ODRODZENIE…');
  });
});
