import { Client, type Room } from '@colyseus/sdk';
import type { GameMode } from '@polystrike/shared/protocol';
import type { GameSnapshot, LobbySnapshot } from '@polystrike/shared/state';
export type { GameMode } from '@polystrike/shared/protocol';
export class RoomConnection {
  constructor(private accountToken: () => Promise<string> = async () => '') {}
  private endpoint = import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:2567';
  private client = new Client(this.endpoint);
  private api = this.endpoint.replace(/^ws/, 'http');
  room?: Room;
  async quickJoin(playerName: string, mode: GameMode, mapId = 'depot') { this.room = await this.client.joinOrCreate('game', { playerName, mode, mapId, accountToken: await this.accountToken() }); return this.room; }
  async create(playerName: string, mode: GameMode, roomName: string, isPrivate: boolean, mapId = 'depot') {
    const roomCode = isPrivate ? Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('') : undefined;
    this.room = await this.client.create('game', { playerName, mode, roomName, isPrivate, roomCode, mapId, accountToken: await this.accountToken() });
    return { room: this.room, roomCode };
  }
  onLobby(callback: (state: LobbySnapshot) => void) { this.room?.onMessage('lobby', callback); }
  onSnapshot(callback: (state: GameSnapshot) => void) { this.room?.onMessage('snapshot', callback); }
  sendInput(input: { sequence: number; clientTime: number; moveX: number; moveZ: number; yaw: number; pitch: number; jump: boolean; sprint: boolean }) { this.room?.send('input', input); }
  sendFire(request: { sequence: number; clientTime: number; weaponId: import('@polystrike/shared/weapons').WeaponId; origin: [number, number, number]; direction: [number, number, number] }) { this.room?.send('fire', request); }
  sendBuy(weaponId: import('@polystrike/shared/weapons').WeaponId) { this.room?.send('buy', { weaponId }); }
  cancelReload() { this.room?.send('cancel_reload'); }
  sendReload(weaponId: import('@polystrike/shared/weapons').WeaponId) { this.room?.send('reload', { weaponId }); }
  sendPing(message: string) { this.room?.send('ping', message); }
  sendObjective(active: boolean) { this.room?.send('objective', { active }); }
  onDisconnect(callback: (code: number) => void) { this.room?.onLeave(callback); }
  async reconnect() { const token = this.room?.reconnectionToken; if (!token) throw new Error('Brak sesji do wznowienia.'); this.room = await this.client.reconnect(token); return this.room; }
  async leave() { await this.room?.leave(); this.room = undefined; }
  onPing(callback: (ping: { senderId: string; senderName: string; message: string; position: [number, number] }) => void) { this.room?.onMessage('ping', callback); }
  onHit(callback: (hit: { shooterId: string; targetId: string; damage: number; weaponId: string }) => void) { this.room?.onMessage('hit', callback); }
  onAmmo(callback: (state: { reloaded?: boolean; playerId: string; weaponId: import('@polystrike/shared/weapons').WeaponId; ammo: number; reserve: number }) => void) { this.room?.onMessage('ammo', callback); }
  onKill(callback: (kill: { killerId: string; targetId: string; killerName: string; targetName: string; weaponId: string }) => void) { this.room?.onMessage('kill', callback); }
  onMatchResult(callback: (result: { winnerPlayerId?: string; winnerTeam?: 'blue' | 'red'; draw: boolean; matchId: string }) => void) { this.room?.onMessage('match_result', callback); }
  async joinByCode(playerName: string, code: string) { const response = await fetch(`${this.api}/servers/code/${encodeURIComponent(code.toUpperCase())}`); if (!response.ok) throw new Error('Nie znaleziono serwera o tym kodzie.'); const selected = await response.json() as { roomId: string; mode?: GameMode }; this.room = await this.client.joinById(selected.roomId, { playerName, mode: selected.mode, accountToken: await this.accountToken() }); return this.room; }
  async joinPublic(playerName: string, roomId: string, mode: GameMode) { this.room = await this.client.joinById(roomId, { playerName, mode, accountToken: await this.accountToken() }); return this.room; }
  async list(): Promise<Array<{ roomId: string; clients: number; maxClients: number; metadata?: { roomName?: string; roomCode?: string; mode?: GameMode } }>> { const response = await fetch(`${this.api}/servers`); if (!response.ok) throw new Error('Nie udało się pobrać serwerów.'); return response.json(); }
}
