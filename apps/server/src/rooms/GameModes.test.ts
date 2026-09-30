import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameRoom } from './GameRoom.js';
import type { CombatPlayer } from '../combat/CombatSystem.js';
import type { GameMode } from '@polystrike/shared/protocol';

type Player = { team?: 'blue' | 'red'; state: { x: number; z: number }; combat: CombatPlayer; score: number };
type Internals = { players: Map<string, Player>; finishedAt: number; startedAt: number; beginPlaying(now: number): void; advanceRoomClock(): void; checkMatch(now: number): void; scheduleRespawn(id: string): void; finishRespawns(): void; broadcastSnapshot(): void };
function setup(mode: string, mapId = 'depot') {
  const room = new GameRoom(); room.onCreate({ mode: mode as GameMode, mapId });
  room.onJoin({ sessionId: 'human' } as never, { playerName: 'Gracz', mode: mode as GameMode });
  return { room, internal: room as unknown as Internals };
}
afterEach(() => vi.restoreAllMocks());

describe('team bases throughout the match lifecycle', () => {
  for (const map of ['depot', 'crossroads', 'foundry', 'alleyways', 'citadel', 'canal']) {
    it(map + ' keeps distinct allied spawns on opposite ends, including rematches', () => {
      const { room, internal } = setup('team_deathmatch', map);
      const verify = () => {
        const players = [...internal.players.values()];
        expect(players.filter(p => p.team === 'blue')).toHaveLength(5);
        expect(players.filter(p => p.team === 'red')).toHaveLength(5);
        for (const p of players) expect(p.team === 'blue' ? p.state.z > 40 : p.state.z < -40).toBe(true);
        expect(new Set(players.map(p => `${p.state.x},${p.state.z}`)).size).toBe(10);
      };
      verify(); internal.beginPlaying(Date.now()); verify();
      room.phase = 'playing';
      const now = vi.spyOn(Date, 'now').mockReturnValue(10000);
      for (const [id, player] of internal.players) { player.combat.alive = false; player.combat.health = 0; internal.scheduleRespawn(id); }
      now.mockReturnValue(40000); internal.finishRespawns(); verify();
      expect([...internal.players.values()].every(player => player.combat.alive)).toBe(true);
      room.phase = 'finished'; internal.finishedAt = Date.now() - 16000;
      internal.advanceRoomClock(); verify();
    });
  }
});

describe('elimination mode', () => {
  it('has balanced teams and no mid-round respawns', () => {
    const { room, internal } = setup('elimination');
    expect([...internal.players.values()].filter(p => p.team === 'blue')).toHaveLength(5);
    room.phase = 'playing'; const victim = internal.players.get('human')!;
    victim.combat.alive = false; victim.combat.health = 0;
    const now = vi.spyOn(Date, 'now').mockReturnValue(10000);
    internal.scheduleRespawn('human'); now.mockReturnValue(45000); internal.finishRespawns();
    expect(victim.combat.alive).toBe(false);
    const broadcast = vi.spyOn(room, 'broadcast'); internal.broadcastSnapshot();
    expect(broadcast).toHaveBeenLastCalledWith('snapshot', expect.objectContaining({ players: expect.arrayContaining([expect.objectContaining({ id: 'human', respawnAt: 0 })]) }));
  });
  it('ends the round when the last opposing player dies, not at a kill limit', () => {
    const { room, internal } = setup('elimination');
    room.phase = 'playing'; internal.startedAt = 10000;
    for (const p of internal.players.values()) if (p.team === 'red') { p.combat.alive = false; p.combat.health = 0; }
    const broadcast = vi.spyOn(room, 'broadcast'); internal.checkMatch(11000);
    expect(room.phase).toBe('finished');
    expect(broadcast).toHaveBeenCalledWith('match_result', expect.objectContaining({ winnerTeam: 'blue', draw: false }));
  });
  it('uses survivors at the two-minute deadline and draws equal teams', () => {
    const { room, internal } = setup('elimination');
    room.phase = 'playing'; internal.startedAt = 10000;
    internal.checkMatch(129999); expect(room.phase).toBe('playing');
    const broadcast = vi.spyOn(room, 'broadcast'); internal.checkMatch(130000);
    expect(room.phase).toBe('finished');
    expect(broadcast).toHaveBeenCalledWith('match_result', expect.objectContaining({ draw: true }));
  });
  it('does not finish a live round just because somebody has 30 kills', () => {
    const { room, internal } = setup('elimination'); room.phase = 'playing'; internal.startedAt = 10000;
    internal.players.get('human')!.score = 30; internal.checkMatch(11000);
    expect(room.phase).toBe('playing');
  });
  it('awards a timed-out round to the team with more survivors and resets both bases', () => {
    const { room, internal } = setup('elimination'); room.phase = 'playing'; internal.startedAt = 10000;
    const red = [...internal.players.values()].find(p => p.team === 'red')!;
    red.combat.alive = false;
    const broadcast = vi.spyOn(room, 'broadcast'); internal.checkMatch(130000);
    expect(broadcast).toHaveBeenCalledWith('match_result', expect.objectContaining({ winnerTeam: 'blue', draw: false }));
    vi.spyOn(Date, 'now').mockReturnValue(145000); internal.advanceRoomClock();
    expect(room.phase).toBe('countdown');
    for (const player of internal.players.values()) {
      expect(player.combat.alive).toBe(true);
      expect(player.team === 'blue' ? player.state.z > 40 : player.state.z < -40).toBe(true);
    }
  });
});
