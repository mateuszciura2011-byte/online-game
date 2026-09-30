import { expect, it, vi } from 'vitest';
import { GameRoom } from './GameRoom.js';
import { AccountService } from '../profile/AccountService.js';
import { ProfileStore } from '../profile/ProfileStore.js';
import { resolveMatchSkin } from '../profile/MatchSkin.js';

it('broadcasts the authenticated skin, not the supplied skin or account secret', () => {
  const accounts = new AccountService(new ProfileStore());
  const session = accounts.createAnonymousAccount();
  session.profile.ownedSkinIds.push('gold');
  session.profile.equippedSkinId = 'gold';
  const original = GameRoom.skinForToken;
  GameRoom.skinForToken = token => resolveMatchSkin(accounts, token);
  try {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 1 });
    const broadcast = vi.spyOn(room, 'broadcast');
    const client = { sessionId: 'owner' } as never;
    room.onAuth(client, { accountToken: session.token });
    room.onJoin(client, { playerName: 'Owner', mode: 'free_for_all' });
    const data = [...broadcast.mock.calls].reverse().find(call => call[0] === 'snapshot')?.[1] as { players: Array<{ id: string; skinId: string }> };
    expect(data.players.find(player => player.id === 'owner')?.skinId).toBe('gold');
    expect(data.players.find(player => player.id === 'bot-1')?.skinId).toBe('recruit');
    expect(JSON.stringify(data)).not.toContain(session.token);
  } finally { GameRoom.skinForToken = original; }
});
