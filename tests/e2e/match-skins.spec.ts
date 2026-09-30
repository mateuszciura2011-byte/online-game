import { expect, test } from '@playwright/test';

test('server snapshots include authorized skins and ignore a forged cosmetic choice', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    // Use the same connection module as the application, against the running server.
    // @ts-ignore Vite serves the source module in this browser test.
    const { RoomConnection } = await import('/src/net/RoomConnection.ts');
    // @ts-ignore Vite source module.
    const { ProfileApi } = await import('/src/net/ProfileApi.ts');
    const profile = new ProfileApi();
    const connection = new RoomConnection(() => profile.accountCode());
    const { room } = await connection.create('SkinTest', 'free_for_all', 'Skin test', true);
    const snapshot = () => new Promise<any>(resolve => connection.onSnapshot(resolve));
    const first = await snapshot();
    const own = first.players.find((player: any) => player.id === room.sessionId);
    // A second client deliberately submits a locked skin without authenticating.
    const { Client } = await import('/node_modules/.vite/deps/@colyseus_sdk.js');
    const guest = await new Client('ws://localhost:2567').joinById(room.roomId, { playerName: 'ForgedSkin', mode: 'free_for_all', skinId: 'gold', accountToken: 'invalid' });
    const second = await snapshot();
    const forged = second.players.find((player: any) => player.id === guest.sessionId);
    await guest.leave(); await connection.leave();
    return { own: own?.skinId, forged: forged?.skinId, leaksToken: JSON.stringify(second).includes('accountToken') };
  });
  expect(result).toEqual({ own: 'recruit', forged: 'recruit', leaksToken: false });
});
