import { describe, expect, it } from 'vitest';
import { PayloadRound } from './PayloadRound.js';

const players = [
  { id: 'attacker', team: 'blue' as const, alive: true, x: 0, z: 0 },
  { id: 'defender', team: 'red' as const, alive: true, x: 9, z: 9 },
];

describe('PayloadRound', () => {
  it('plants after an attacker holds the objective action for 2.5 seconds', () => {
    const round = new PayloadRound([0, 0], 0);
    round.setHolding('attacker', true);
    round.tick(0, players);
    round.tick(2_499, players);
    expect(round.snapshot(2_499).state).toBe('planting');
    round.tick(2_500, players);
    expect(round.snapshot(2_500)).toMatchObject({ state: 'planted', plantedEndsAt: 37_500 });
  });

  it('cancels planting when the attacker releases E', () => {
    const round = new PayloadRound([0, 0], 0);
    round.setHolding('attacker', true);
    round.tick(0, players);
    round.tick(1_000, players);
    round.setHolding('attacker', false);
    round.tick(1_100, players);
    expect(round.snapshot(1_100).state).toBe('ready');
  });

  it('lets a defender defuse a planted payload after four seconds', () => {
    const round = new PayloadRound([0, 0], 0);
    round.setHolding('attacker', true);
    round.tick(0, players);
    round.tick(2_500, players);
    round.setHolding('defender', true);
    round.tick(2_500, [{ ...players[0], x: 9, z: 9 }, { ...players[1], x: 0, z: 0 }]);
    round.tick(6_499, [{ ...players[0], x: 9, z: 9 }, { ...players[1], x: 0, z: 0 }]);
    expect(round.snapshot(6_499).state).toBe('defusing');
    round.tick(6_500, [{ ...players[0], x: 9, z: 9 }, { ...players[1], x: 0, z: 0 }]);
    expect(round.winner).toBe('red');
  });

  it('awards blue a detonation and red a pre-plant time expiry', () => {
    const planted = new PayloadRound([0, 0], 0);
    planted.setHolding('attacker', true);
    planted.tick(0, players);
    planted.tick(2_500, players);
    planted.tick(37_500, players);
    expect(planted.winner).toBe('blue');
    const expired = new PayloadRound([0, 0], 0);
    expired.tick(75_000, players);
    expect(expired.winner).toBe('red');
  });
});
