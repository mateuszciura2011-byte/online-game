import { expect, it } from 'vitest';
import { GameRoom } from './GameRoom.js';

it('gives an authenticated FFA player the server-approved equipped primary', () => {
  const original = GameRoom.primaryForToken;
  GameRoom.primaryForToken = () => 'shotgun';
  try {
    const room = new GameRoom(); room.onCreate({ mode: 'free_for_all', botCount: 0 });
    const client = { sessionId: 'player' } as never;
    room.onAuth(client, { accountToken: 'valid' }); room.onJoin(client, { playerName: 'Player', mode: 'free_for_all' });
    const players = (room as unknown as { players: Map<string, { primaryWeaponId: string }> }).players;
    expect(players.get('player')?.primaryWeaponId).toBe('shotgun');
  } finally { GameRoom.primaryForToken = original; }
});

it('keeps the pistol during team buy phase', () => {
  const original = GameRoom.primaryForToken;
  GameRoom.primaryForToken = () => 'sniper';
  try {
    const room = new GameRoom(); room.onCreate({ mode: 'team_deathmatch', botCount: 0 });
    const client = { sessionId: 'player' } as never;
    room.onAuth(client, { accountToken: 'valid' }); room.onJoin(client, { playerName: 'Player', mode: 'team_deathmatch' });
    const players = (room as unknown as { players: Map<string, { primaryWeaponId: string }> }).players;
    expect(players.get('player')?.primaryWeaponId).toBe('pistol');
  } finally { GameRoom.primaryForToken = original; }
});
