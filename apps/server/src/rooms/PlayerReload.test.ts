import { expect, it, vi } from 'vitest';
import { GameRoom } from './GameRoom.js';
import { WEAPONS } from '@polystrike/shared/weapons';
import type { CombatPlayer } from '../combat/CombatSystem.js';

it('acknowledges rejected loadouts without adding ammunition', () => {
  const room = new GameRoom(); room.onCreate({ mode: 'free_for_all', botCount: 0 });
  room.onJoin({ sessionId: 'human' } as never, { playerName: 'Human', mode: 'free_for_all' }); room.phase = 'playing';
  const internal = room as unknown as { players: Map<string, { combat: CombatPlayer }>; applyReload(id: string, data: unknown): void };
  internal.players.get('human')!.combat.ammo.rifle = 2;
  const broadcast = vi.spyOn(room, 'broadcast');
  internal.applyReload('human', { weaponId: 'rifle' });
  expect(broadcast).toHaveBeenCalledWith('ammo', expect.objectContaining({ weaponId: 'rifle', ammo: 2, reloaded: true }));
});

it('blocks shots during a server-timed reload and publishes the completed magazine', () => {
  const room = new GameRoom(); room.onCreate({ mode: 'free_for_all', botCount: 0 });
  room.onJoin({ sessionId: 'human' } as never, { playerName: 'Human', mode: 'free_for_all' });
  room.phase = 'playing';
  const internal = room as unknown as { players: Map<string, { combat: CombatPlayer }>; applyReload(id: string, data: unknown): void; applyFire(id: string, data: unknown): void; finishReloads(): void };
  const player = internal.players.get('human')!.combat; player.ammo.pistol = 2;
  const broadcast = vi.spyOn(room, 'broadcast'); const clock = vi.spyOn(Date, 'now').mockReturnValue(10000);
  try {
    internal.applyReload('human', { weaponId: 'pistol' });
    internal.applyFire('human', { weaponId: 'pistol' }); expect(player.ammo.pistol).toBe(2);
    clock.mockReturnValue(10000 + WEAPONS.pistol.reloadMs - 1); internal.finishReloads(); expect(player.ammo.pistol).toBe(2);
    clock.mockReturnValue(10000 + WEAPONS.pistol.reloadMs); internal.finishReloads();
    expect(player.ammo.pistol).toBe(WEAPONS.pistol.magazine);
    (room as unknown as { broadcastSnapshot(): void }).broadcastSnapshot();
    const snapshot = [...broadcast.mock.calls].reverse().find(call => call[0] === 'snapshot')?.[1] as { players: Array<{ id: string; ammo: CombatPlayer['ammo']; reserve: CombatPlayer['reserve'] }> };
    expect(snapshot.players.find(item => item.id === 'human')).toMatchObject({ ammo: { pistol: WEAPONS.pistol.magazine }, reserve: { pistol: player.reserve.pistol } });
    expect(broadcast).toHaveBeenCalledWith('ammo', expect.objectContaining({ playerId: 'human', reloaded: true, ammo: WEAPONS.pistol.magazine }));
    internal.applyFire('human', { weaponId: 'pistol' }); expect(player.ammo.pistol).toBe(WEAPONS.pistol.magazine - 1);
  } finally { clock.mockRestore(); }
});
