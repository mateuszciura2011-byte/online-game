import { describe, expect, it } from 'vitest';
import { MatchClock } from './MatchClock.js';

describe('MatchClock', () => {
  it('advances through countdown, buy, playing and finished at exact boundaries', () => {
    const clock = new MatchClock({ countdownMs: 10_000, buyMs: 15_000, matchMs: 600_000 });

    expect(clock.advance(0).phase).toBe('countdown');
    expect(clock.advance(10_000).phase).toBe('buy');
    expect(clock.advance(25_000).phase).toBe('playing');
    expect(clock.advance(625_000).phase).toBe('finished');
  });

  it('reports the authoritative phase deadline and remaining time', () => {
    const clock = new MatchClock({ countdownMs: 10_000, buyMs: 15_000, matchMs: 600_000 });

    expect(clock.advance(4_000)).toMatchObject({ phase: 'countdown', phaseEndsAt: 10_000, countdownSeconds: 6 });
    expect(clock.advance(20_000)).toMatchObject({ phase: 'buy', phaseEndsAt: 25_000, countdownSeconds: 5 });
    expect(clock.advance(35_000)).toMatchObject({ phase: 'playing', phaseEndsAt: 625_000, remainingSeconds: 590 });
  });
});
