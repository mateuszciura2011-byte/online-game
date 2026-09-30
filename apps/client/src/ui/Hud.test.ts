import { describe, expect, it } from 'vitest';
import { didWin, formatHitFeedback, formatKillFeed, formatMatchScore, formatReloadFeedback, messageTone, minimapPoint, resultCopy } from './Hud.js';

describe('resultCopy', () => {
  it('announces the victory reward', () => {
    expect(resultCopy(true)).toBe('VICTORY +100 COINÓW');
  });

  it('shows defeat without awarding coins', () => {
    expect(resultCopy(false)).toBe('DEFEAT');
  });

  it('does not award a blue team victory to a red team player', () => {
    expect(didWin({ winnerTeam: 'blue', draw: false }, 'player', 'red')).toBe(false);
  });

  it('formats a kill feed entry with the weapon', () => {
    expect(formatKillFeed('Lukas', 'BOT-1', 'rifle')).toBe('Lukas [KARABIN] BOT-1');
  });

  it('shows both teams in a team match instead of only local kills', () => {
    expect(formatMatchScore('team_deathmatch', 2, 4, 3)).toBe('NIEBIESCY 4 : 3 CZERWONI');
    expect(formatMatchScore('free_for_all', 2, 0, 0)).toBe('WYNIK 2');
  });

  it('keeps a ping marker inside the minimap', () => {
    expect(minimapPoint([100, -100])).toEqual([143, 7]);
  });

  it('gives victory and connection warnings their own HUD tones', () => {
    expect(messageTone('VICTORY +100 COINÓW')).toBe('victory');
    expect(messageTone('UTRACONO POŁĄCZENIE')).toBe('danger');
  });

  it('keeps the training objective compact instead of treating it as a fullscreen announcement', () => {
    expect(messageTone('TRENING: TRAF W CELE')).toBe('training');
    expect(messageTone('START ZA 3')).toBe('countdown');
  });

  it('keeps an empty-magazine hint compact so it never covers the match', () => {
    expect(messageTone('PUSTY MAGAZYNEK — R, ABY PRZEŁADOWAĆ')).toBe('default');
    expect(messageTone('BRAK AMUNICJI')).toBe('default');
  });

  it('formats a short hit confirmation for the centre marker', () => {
    expect(formatHitFeedback(27)).toBe('TRAFIENIE +27');
  });

  it('uses the selected weapon name in the reload indicator', () => {
    expect(formatReloadFeedback('KARABIN')).toBe('PRZEŁADOWANIE: KARABIN');
  });
});
