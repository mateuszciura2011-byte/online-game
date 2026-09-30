import { describe, expect, it } from 'vitest';
import { GameSession } from './GameSession.js';

describe('GameSession', () => {
  it('leaves training before starting a normal match', () => {
    const session = new GameSession();

    session.startTraining();
    session.startMatch();

    expect(session.isTraining()).toBe(false);
  });

  it('pauses an active match without returning to the main menu', () => {
    const session = new GameSession();
    session.startMatch();

    session.pause();

    expect(session.isPaused()).toBe(true);
    expect(session.isMatch()).toBe(true);
    session.resume();
    expect(session.isPaused()).toBe(false);
  });
});
