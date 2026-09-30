import { expect, it, vi } from 'vitest';
import { GameRoom } from './GameRoom.js';
import type { CombatPlayer } from '../combat/CombatSystem.js';

it('keeps a dead player out for 30 seconds and sends the server respawn deadline', () => {
  const room = new GameRoom(); room.onCreate({ mode: 'free_for_all', botCount: 0 });
  room.onJoin({ sessionId: 'human' } as never, { playerName: 'Human', mode: 'free_for_all' });
  room.phase = 'playing';
  const internal = room as unknown as { players: Map<string, { combat: CombatPlayer }>; scheduleRespawn(id: string): void; finishRespawns(): void; broadcastSnapshot(): void };
  const player = internal.players.get('human')!;
  player.combat.alive = false; player.combat.health = 0;
  const now = vi.spyOn(Date, 'now').mockReturnValue(10000);
  const broadcast = vi.spyOn(room, 'broadcast');
  try {
    internal.scheduleRespawn('human');
    internal.broadcastSnapshot();
    expect(broadcast).toHaveBeenLastCalledWith('snapshot', expect.objectContaining({ players: expect.arrayContaining([expect.objectContaining({ id: 'human', alive: false, respawnAt: 40000 })]) }));
    now.mockReturnValue(39999); internal.finishRespawns(); expect(player.combat.alive).toBe(false);
    now.mockReturnValue(40000); internal.finishRespawns(); expect(player.combat.alive).toBe(true);
    expect(player.combat.health).toBe(100);
  } finally { now.mockRestore(); }
});
