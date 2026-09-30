import type { GameMode } from '@polystrike/shared/protocol';

export interface ServerEntry { roomId: string; name: string; mode: GameMode; players: number; maxPlayers: number; isPrivate: boolean; code?: string; }
export class ServerDirectory {
  private rooms = new Map<string, ServerEntry>();
  add(entry: Omit<ServerEntry, 'code'> & { code?: string }) { const stored = { ...entry, code: entry.isPrivate ? (entry.code ?? this.code()) : undefined }; this.rooms.set(stored.roomId, stored); return stored; }
  remove(roomId: string) { this.rooms.delete(roomId); }
  listPublic() { return [...this.rooms.values()].filter((room) => !room.isPrivate); }
  byCode(code: string) { return [...this.rooms.values()].find((room) => room.isPrivate && room.code === code.toUpperCase()); }
  private code() { return Array.from({ length: 6 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(''); }
}
