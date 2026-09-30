import { describe, expect, it, vi } from 'vitest';
import { getMapDefinition } from '@polystrike/shared/maps';
import { GameRoom } from './GameRoom.js';

describe('GameRoom lobby rules', () => {
  it('does not wait for reconnection after a voluntary departure', async () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    const client = { sessionId: 'leaver' } as never;
    room.onJoin(client, { playerName: 'Leaver', mode: 'free_for_all' });
    const reconnect = vi.spyOn(room, 'allowReconnection').mockRejectedValue(new Error('Unexpected reconnect'));
    await room.onLeave(client, 4000);
    expect(reconnect).not.toHaveBeenCalled();
  });
  it('lets a bot reload an empty magazine over time and fire again', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 1 });
    room.onJoin({ sessionId: 'human' } as never, { playerName: 'Gracz', mode: 'free_for_all' });
    room.phase = 'playing';
    const internal = room as unknown as { players: Map<string, { state: { x: number; z: number }; invulnerableUntil: number; combat: { ammo: { rifle: number }; reserve: { rifle: number }; health: number } }>; tickBots(): void };
    const bot = internal.players.get('bot-1')!;
    const human = internal.players.get('human')!;
    bot.state.x = 10; bot.state.z = 0; bot.combat.ammo.rifle = 0;
    human.state.x = 5; human.state.z = 0; human.invulnerableUntil = 0;
    const start = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);
    try {
      internal.tickBots();
      clock.mockReturnValue(start + 500); internal.tickBots();
      expect(bot.combat.ammo.rifle).toBe(0);
      expect(human.combat.health).toBe(100);
      clock.mockReturnValue(start + 5000); internal.tickBots();
      expect(bot.combat.reserve.rifle).toBeLessThan(96);
      expect(human.combat.health).toBeLessThan(100);
    } finally { clock.mockRestore(); }
  });

  it('preserves jumping when another player blocks horizontal movement', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'one' } as never, { playerName: 'Gracz1', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'two' } as never, { playerName: 'Gracz2', mode: 'free_for_all' });
    room.phase = 'playing';
    const internal = room as unknown as { players: Map<string, { state: { x: number; y: number; z: number; verticalVelocity: number; grounded: boolean } }>; applyInput(id: string, input: unknown): void };
    internal.players.get('one')!.state = { x: 10, y: 0, z: 0, verticalVelocity: 0, grounded: true };
    internal.players.get('two')!.state = { x: 10, y: 0, z: -1.01, verticalVelocity: 0, grounded: true };
    internal.applyInput('one', { sequence: 1, clientTime: 0, moveX: 0, moveZ: 1, yaw: 0, pitch: 0, jump: true, sprint: false });
    expect(internal.players.get('one')!.state.z).toBe(0);
    expect(internal.players.get('one')!.state.y).toBeGreaterThan(0);
  });
  it('accepts the new canal arena when creating a match', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'team_deathmatch', botCount: 0, mapId: 'canal' });
    expect(room.mapId).toBe('canal');
  });

  it('uses the selected map safe spawns instead of depot spawns', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'team_deathmatch', botCount: 0, mapId: 'crossroads' });
    room.onJoin({ sessionId: 'blue-player' } as never, { playerName: 'Niebieski', mode: 'team_deathmatch' });
    room.onJoin({ sessionId: 'red-player' } as never, { playerName: 'Czerwony', mode: 'team_deathmatch' });
    const players = (room as unknown as { players: Map<string, { state: { x: number; z: number }; team: 'blue' | 'red' }> }).players;

    for (const player of players.values()) {
      expect(getMapDefinition('crossroads').spawns).toContainEqual(expect.objectContaining({ x: player.state.x, z: player.state.z, team: player.team }));
    }
  });

  it('keeps a moving player outside another player collision radius', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'runner' } as never, { playerName: 'Biegacz', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'blocker' } as never, { playerName: 'Bloker', mode: 'free_for_all' });
    const internal = room as unknown as {
      players: Map<string, { state: { x: number; y: number; z: number; verticalVelocity: number; grounded: boolean } }>;
      advanceLobbyClock(now: number): void;
      applyInput(id: string, input: unknown): void;
    };
    internal.advanceLobbyClock(Date.now() + 10_001);
    internal.players.get('runner')!.state = { x: 0, y: 0, z: 0, verticalVelocity: 0, grounded: true };
    internal.players.get('blocker')!.state = { x: 0, y: 0, z: -1.1, verticalVelocity: 0, grounded: true };

    internal.applyInput('runner', { sequence: 1, clientTime: Date.now(), moveX: 0, moveZ: 1, yaw: 0, pitch: 0, jump: false, sprint: false });

    const runner = internal.players.get('runner')!.state;
    const blocker = internal.players.get('blocker')!.state;
    expect(Math.hypot(runner.x - blocker.x, runner.z - blocker.z)).toBeGreaterThanOrEqual(1);
  });

  it('creates a balanced payload lobby with bots', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'payload' });
    room.onJoin({ sessionId: 'human' } as never, { playerName: 'Gracz', mode: 'payload' });
    const players = [...(room as unknown as { players: Map<string, { team: string }> }).players.values()];
    expect(players.filter((player) => player.team === 'blue')).toHaveLength(5);
    expect(players.filter((player) => player.team === 'red')).toHaveLength(5);
  });
  it('assigns the less numerous team in 5v5', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'team_deathmatch', botCount: 0 });
    for (let index = 0; index < 6; index += 1) {
      room.onJoin({ sessionId: String(index) } as never, { playerName: `Gracz${index}`, mode: 'team_deathmatch' });
    }
    const teams = [...(room as unknown as { players: Map<string, { team: string }> }).players.values()].map((player) => player.team);
    expect(teams).toEqual(['blue', 'red', 'blue', 'red', 'blue', 'red']);
  });

  it('rejects a name shorter than three characters', () => {
    const room = new GameRoom();
    expect(() => room.onJoin({ sessionId: 'one' } as never, { playerName: 'ab', mode: 'free_for_all' })).toThrow();
  });

  it('starts a ten-second countdown only after the second player joins', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'one' } as never, { playerName: 'Pierwszy', mode: 'free_for_all' });
    expect(room.phase).toBe('lobby');

    room.onJoin({ sessionId: 'two' } as never, { playerName: 'DrugiGracz', mode: 'free_for_all' });
    expect(room.phase).toBe('countdown');

    const countdownRoom = room as unknown as { advanceLobbyClock(now: number): void };
    countdownRoom.advanceLobbyClock(Date.now() + 10_001);
    expect(room.phase).toBe('playing');

    room.onLeave({ sessionId: 'two' } as never);
    expect(room.phase).toBe('lobby');
  });

  it('moves a 5v5 match from countdown to buy phase before play', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'team_deathmatch', botCount: 0 });
    room.onJoin({ sessionId: 'one' } as never, { playerName: 'Pierwszy', mode: 'team_deathmatch' });
    room.onJoin({ sessionId: 'two' } as never, { playerName: 'DrugiGracz', mode: 'team_deathmatch' });
    const internal = room as unknown as { advanceLobbyClock(now: number): void };
    const start = Date.now();

    internal.advanceLobbyClock(start + 10_001);
    expect(room.phase).toBe('buy');

    internal.advanceLobbyClock(start + 25_001);
    expect(room.phase).toBe('playing');
  });

  it('does not accept a new quick-match player after the round has started', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'team_deathmatch', botCount: 0 });
    room.onJoin({ sessionId: 'one' } as never, { playerName: 'Pierwszy', mode: 'team_deathmatch' });
    room.onJoin({ sessionId: 'two' } as never, { playerName: 'DrugiGracz', mode: 'team_deathmatch' });
    const internal = room as unknown as { advanceLobbyClock(now: number): void };
    const start = Date.now();
    internal.advanceLobbyClock(start + 25_001);

    expect(() => room.onJoin({ sessionId: 'late' } as never, { playerName: 'Spóźniony', mode: 'team_deathmatch' })).toThrow('Mecz już trwa');
  });

  it('does not move a player while the countdown is running', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'one' } as never, { playerName: 'Pierwszy', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'two' } as never, { playerName: 'DrugiGracz', mode: 'free_for_all' });
    const internal = room as unknown as { players: Map<string, { state: { z: number } }>; applyInput(id: string, input: unknown): void };
    const before = internal.players.get('one')!.state.z;
    internal.applyInput('one', { sequence: 1, clientTime: Date.now(), moveX: 0, moveZ: 1, yaw: 0, pitch: 0, jump: false, sprint: false });
    expect(internal.players.get('one')!.state.z).toBe(before);
  });

  it('fills a new public lobby with configured bot players', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 3 });
    const players = [...(room as unknown as { players: Map<string, { name: string; isBot: boolean }> }).players.values()].map(({ name, isBot }) => ({ name, isBot }));
    expect(players).toEqual([
      { name: 'BOT-1', isBot: true },
      { name: 'BOT-2', isBot: true },
      { name: 'BOT-3', isBot: true },
    ]);
  });

  it('fills a quick-match lobby to ten slots by default', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all' });
    expect((room as unknown as { players: Map<string, unknown> }).players.size).toBe(9);
  });

  it('fills quick 5v5 with nine bots and balances both teams', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'team_deathmatch' });
    room.onJoin({ sessionId: 'human' } as never, { playerName: 'Gracz', mode: 'team_deathmatch' });
    const players = [...(room as unknown as { players: Map<string, { team: string; isBot: boolean }> }).players.values()];
    expect(players).toHaveLength(10);
    expect(players.filter((player) => player.team === 'blue')).toHaveLength(5);
    expect(players.filter((player) => player.team === 'red')).toHaveLength(5);
  });

  it('allows a player to buy a submachine gun only during the buy phase', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'team_deathmatch', botCount: 0 });
    room.onJoin({ sessionId: 'human' } as never, { playerName: 'Gracz', mode: 'team_deathmatch' });
    const internal = room as unknown as { players: Map<string, { cash: number; primaryWeaponId: string }>; applyBuy(id: string, request: unknown): void };
    room.phase = 'buy';
    internal.players.get('human')!.cash = 1_500;

    internal.applyBuy('human', { weaponId: 'smg' });

    expect(internal.players.get('human')).toMatchObject({ cash: 300, primaryWeaponId: 'smg' });
  });

  it('does not allow firing a primary weapon that was not bought', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'shooter' } as never, { playerName: 'Strzelec', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'target' } as never, { playerName: 'Celownik', mode: 'free_for_all' });
    const internal = room as unknown as { players: Map<string, { state: { x: number; z: number }; yaw: number; invulnerableUntil: number; primaryWeaponId: string; combat: { health: number } }>; applyFire(id: string, request: unknown): void; advanceLobbyClock(now: number): void };
    internal.advanceLobbyClock(Date.now() + 10_001);
    const shooter = internal.players.get('shooter')!;
    const target = internal.players.get('target')!;
    shooter.state.x = 0; shooter.state.z = 0; shooter.yaw = 0; shooter.primaryWeaponId = 'smg';
    target.state.x = 0; target.state.z = -5; target.invulnerableUntil = 0;

    internal.applyFire('shooter', { weaponId: 'rifle' });

    expect(target.combat.health).toBe(100);
  });

  it('replaces a bot when another human joins a full quick-match lobby', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 9 });
    room.onJoin({ sessionId: 'one' } as never, { playerName: 'Pierwszy', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'two' } as never, { playerName: 'DrugiGracz', mode: 'free_for_all' });
    const players = [...(room as unknown as { players: Map<string, { isBot: boolean }> }).players.values()];
    expect(players).toHaveLength(10);
    expect(players.filter((player) => !player.isBot)).toHaveLength(2);
    expect(players.filter((player) => player.isBot)).toHaveLength(8);
  });

  it('does not damage a player during spawn protection', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'shooter' } as never, { playerName: 'Strzelec', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'target' } as never, { playerName: 'Celownik', mode: 'free_for_all' });
    const players = (room as unknown as { players: Map<string, { combat: { health: number }; invulnerableUntil?: number }> }).players;
    players.get('target')!.invulnerableUntil = Date.now() + 2_000;

    (room as unknown as { applyFire(id: string, request: unknown): void }).applyFire('shooter', { weaponId: 'rifle' });

    expect(players.get('target')!.combat.health).toBe(100);
  });

  it('does not hit an enemy standing behind the shooter', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'shooter' } as never, { playerName: 'Strzelec', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'target' } as never, { playerName: 'Celownik', mode: 'free_for_all' });
    const internal = room as unknown as { players: Map<string, { state: { x: number; z: number }; yaw: number; invulnerableUntil: number; primaryWeaponId: string; combat: { health: number } }>; advanceLobbyClock(now: number): void; applyFire(id: string, request: unknown): void };
    internal.advanceLobbyClock(Date.now() + 10_001);
    const shooter = internal.players.get('shooter')!;
    const target = internal.players.get('target')!;
    shooter.state.x = 0; shooter.state.z = 0; shooter.yaw = 0; shooter.primaryWeaponId = 'rifle';
    target.state.x = 0; target.state.z = 5; target.invulnerableUntil = 0;

    internal.applyFire('shooter', { weaponId: 'rifle' });

    expect(target.combat.health).toBe(100);
  });

  it("hits an enemy in the shooter's forward cone", () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'shooter' } as never, { playerName: 'Strzelec', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'target' } as never, { playerName: 'Celownik', mode: 'free_for_all' });
    const internal = room as unknown as { players: Map<string, { state: { x: number; z: number }; yaw: number; invulnerableUntil: number; primaryWeaponId: string; combat: { health: number } }>; advanceLobbyClock(now: number): void; applyFire(id: string, request: unknown): void };
    internal.advanceLobbyClock(Date.now() + 10_001);
    const shooter = internal.players.get('shooter')!;
    const target = internal.players.get('target')!;
    shooter.state.x = 10; shooter.state.z = 0; shooter.yaw = 0; shooter.primaryWeaponId = 'rifle';
    target.state.x = 10; target.state.z = -5; target.invulnerableUntil = 0;

    internal.applyFire('shooter', { weaponId: 'rifle' });

    expect(target.combat.health).toBe(68);
  });

  it('does not damage an enemy when the submitted crosshair direction points elsewhere', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'shooter' } as never, { playerName: 'Strzelec', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'target' } as never, { playerName: 'Celownik', mode: 'free_for_all' });
    const internal = room as unknown as { players: Map<string, { state: { x: number; z: number }; yaw: number; invulnerableUntil: number; primaryWeaponId: string; combat: { health: number } }>; advanceLobbyClock(now: number): void; applyFire(id: string, request: unknown): void };
    internal.advanceLobbyClock(Date.now() + 10_001);
    const shooter = internal.players.get('shooter')!;
    const target = internal.players.get('target')!;
    shooter.state.x = 0; shooter.state.z = 0; shooter.yaw = 0; shooter.primaryWeaponId = 'rifle';
    target.state.x = 0; target.state.z = -5; target.invulnerableUntil = 0;

    internal.applyFire('shooter', { weaponId: 'rifle', origin: [0, 1.7, 0], direction: [1, 0, 0] });

    expect(target.combat.health).toBe(100);
  });

  it('aims bot fire in the same direction the bot is facing', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 1 });
    room.onJoin({ sessionId: 'human' } as never, { playerName: 'Celownik', mode: 'free_for_all' });
    const internal = room as unknown as { players: Map<string, { state: { x: number; z: number }; yaw: number; invulnerableUntil: number; combat: { health: number } }>; tickBots(): void };
    room.phase = 'playing';
    const bot = internal.players.get('bot-1')!;
    const human = internal.players.get('human')!;
    bot.state.x = 10; bot.state.z = 0;
    human.state.x = 5; human.state.z = 0; human.invulnerableUntil = 0;

    internal.tickBots();
    expect(human.combat.health).toBe(100);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 400);
    try {
      internal.tickBots();
      expect(human.combat.health).toBeLessThan(100);
    } finally { clock.mockRestore(); }
  });

  it('returns finished players to a fresh lobby round after fifteen seconds', () => {
    const room = new GameRoom();
    room.onCreate({ mode: 'free_for_all', botCount: 0 });
    room.onJoin({ sessionId: 'one' } as never, { playerName: 'Pierwszy', mode: 'free_for_all' });
    room.onJoin({ sessionId: 'two' } as never, { playerName: 'DrugiGracz', mode: 'free_for_all' });
    const internal = room as unknown as { players: Map<string, { score: number }>; finishedAt: number; advanceRoomClock(): void };
    internal.players.get('one')!.score = 12;
    room.phase = 'finished';
    internal.finishedAt = Date.now() - 15_001;

    internal.advanceRoomClock();

    expect(room.phase).toBe('countdown');
    expect(internal.players.get('one')!.score).toBe(0);
  });
});
