import { describe, expect, it } from 'vitest';
import { formatCountdown, formatLobbySummary } from './Lobby.js';

describe('formatLobbySummary', () => {
  it('shows bot names separately from human players', () => {
    expect(formatLobbySummary([
      { id: 'one', name: 'Gracz', isBot: false },
      { id: 'bot-1', name: 'BOT-1', isBot: true },
      { id: 'bot-2', name: 'BOT-2', isBot: true },
    ])).toBe('Lobby: 3/10 · Boty: BOT-1, BOT-2');
  });

  it('shows the countdown before a match starts', () => {
    expect(formatCountdown(7)).toBe('START ZA 7…');
  });
});
