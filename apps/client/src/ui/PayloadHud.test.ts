import { describe, expect, it } from 'vitest';
import { payloadActionProgress, payloadInstruction } from './PayloadHud.js';

describe('payload HUD', () => {
  it('tells a blue attacker to plant and a red defender to defuse', () => {
    expect(payloadInstruction('blue', { state: 'ready' })).toBe('PRZYTRZYMAJ E, ABY PODŁOŻYĆ ŁADUNEK');
    expect(payloadInstruction('red', { state: 'planted' })).toBe('PRZYTRZYMAJ E, ABY ROZBROIĆ ŁADUNEK');
  });

  it('shows progress copy for the player carrying out an action', () => {
    expect(payloadInstruction('blue', { state: 'planting', actionPlayerId: 'me' }, 'me')).toBe('PODKŁADANIE ŁADUNKU…');
  });
});

describe('payload action progress', () => {
  it('shows a proportional planting progress', () => {
    expect(payloadActionProgress({ state: 'planting', actionEndsAt: 2_500 }, 1_250)).toBe('PODKŁADANIE: 50%');
  });

  it('shows a proportional defusing progress', () => {
    expect(payloadActionProgress({ state: 'defusing', actionEndsAt: 4_000 }, 3_000)).toBe('ROZBRAJANIE: 75%');
  });
});
