import { MAX_PLAYERS } from './game-core.js';

const MAX_TEAM_PLAYERS = MAX_PLAYERS / 2;

export class RoomDirectory {
  constructor({ code = randomCode } = {}) {
    this.code = code;
    this.rooms = new Map();
    this.nextId = 1;
  }

  create({ name, mode, isPrivate }) {
    const room = {
      id: `room-${this.nextId++}`,
      name: cleanRoomName(name),
      mode: mode === 'team_deathmatch' ? mode : 'free_for_all',
      isPrivate: Boolean(isPrivate),
      code: this.uniqueCode(),
      players: new Map(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  join(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, reason: 'room_not_found' };
    if (room.players.size >= MAX_PLAYERS) return { ok: false, reason: 'room_full' };
    const team = room.mode === 'team_deathmatch' ? this.nextTeam(room) : undefined;
    if (room.mode === 'team_deathmatch' && !team) return { ok: false, reason: 'room_full' };
    room.players.set(playerId, { team });
    return { ok: true, room, team };
  }

  leave(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.delete(playerId);
    if (room.players.size === 0) this.rooms.delete(roomId);
  }

  findByCode(code) {
    const normalized = String(code).trim().toUpperCase();
    return [...this.rooms.values()].find((room) => room.isPrivate && room.code === normalized);
  }

  listPublic() {
    return [...this.rooms.values()]
      .filter((room) => !room.isPrivate)
      .map((room) => this.summary(room));
  }

  findQuickMatch(mode) {
    return [...this.rooms.values()]
      .filter((room) => !room.isPrivate && room.mode === mode && room.players.size < MAX_PLAYERS)
      .sort((left, right) => right.players.size - left.players.size)[0];
  }

  summary(room) {
    return { id: room.id, name: room.name, mode: room.mode, players: room.players.size, maxPlayers: MAX_PLAYERS };
  }

  nextTeam(room) {
    const blue = [...room.players.values()].filter((player) => player.team === 'blue').length;
    const red = room.players.size - blue;
    if (blue >= MAX_TEAM_PLAYERS && red >= MAX_TEAM_PLAYERS) return undefined;
    return blue <= red && blue < MAX_TEAM_PLAYERS ? 'blue' : 'red';
  }

  uniqueCode() {
    let candidate = this.code().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    if (candidate.length !== 6) candidate = randomCode();
    while ([...this.rooms.values()].some((room) => room.code === candidate)) candidate = randomCode();
    return candidate;
  }
}

function cleanRoomName(value) {
  const name = String(value ?? '').replace(/[<>]/g, '').trim();
  return name.slice(0, 24) || 'Serwer PolyStrike';
}

function randomCode() {
  return Array.from({ length: 6 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
}
