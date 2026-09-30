import { Room, Client } from '@colyseus/core';
import { GAME_MODES, type FireRequest, type GameMode, type PlayerInput } from '@polystrike/shared/protocol';
import { WEAPONS, type WeaponId } from '@polystrike/shared/weapons';
import { simulatePlayer, type PlayerKinematicState } from '../simulation/World.js';
import { canFire, validateAndResolveFire, type CombatPlayer } from '../combat/CombatSystem.js';
import { resolveMatch } from '../match/MatchRules.js';
import { buyWeapon } from '../match/BuyPhase.js';
import { chooseBotAction } from '../bots/BotController.js';
import { ReloadController } from '../combat/ReloadController.js';
import { BotArmament } from '../bots/BotArmament.js';
import { mapColliders } from '../simulation/Maps.js';
import { RateLimiter } from '../security/RateLimiter.js';
import { isValidFireRequest, isValidObjectiveAction, isValidPing, isValidPlayerInput } from '../validation/messages.js';
import { MatchClock } from '../match/MatchClock.js';
import { selectSafeSpawn, type SpawnPoint } from '../match/SpawnSelector.js';
import { PayloadRound } from '../match/PayloadRound.js';
import { selectShotTarget } from '../combat/ShotValidation.js';
import { getMapDefinition } from '@polystrike/shared/maps';

export interface JoinOptions { playerName: string; mode: GameMode; roomCode?: string; }
export type MatchPhase = 'lobby' | 'countdown' | 'buy' | 'playing' | 'finished';
type PlayerInfo = { name: string; team?: 'blue' | 'red'; isBot: boolean; state: PlayerKinematicState; yaw: number; pitch: number; score: number; cash: number; primaryWeaponId: WeaponId; combat: CombatPlayer; invulnerableUntil: number };
const combat = (id: string): CombatPlayer => ({ id, health: 100, alive: true, ammo: Object.fromEntries(Object.entries(WEAPONS).map(([key, weapon]) => [key, weapon.magazine])) as CombatPlayer['ammo'], reserve: Object.fromEntries(Object.entries(WEAPONS).map(([key, weapon]) => [key, weapon.reserve])) as CombatPlayer['reserve'], lastFireAt: 0 });
const weaponRange: Record<WeaponId, number> = { knife: 2, pistol: 32, smg: 28, rifle: 46, sniper: 90, shotgun: 14 };
const weaponCone: Record<WeaponId, number> = { knife: .78, pistol: .18, smg: .22, rifle: .12, sniper: .055, shotgun: .42 };
function canHitTarget(shooter: PlayerInfo, candidate: PlayerInfo, weaponId: WeaponId) {
  const dx = candidate.state.x - shooter.state.x;
  const dz = candidate.state.z - shooter.state.z;
  const distance = Math.hypot(dx, dz);
  if (!distance || distance > weaponRange[weaponId]) return false;
  const forwardX = -Math.sin(shooter.yaw);
  const forwardZ = -Math.cos(shooter.yaw);
  return (dx * forwardX + dz * forwardZ) / distance >= Math.cos(weaponCone[weaponId]);
}

export class GameRoom extends Room {
  static skinForToken: (token: unknown) => string = () => 'recruit';
  static primaryForToken: (token: unknown) => WeaponId = () => 'pistol';
  private playerSkins = new Map<string, string>();
  private playerPrimaries = new Map<string, WeaponId>();
  onAuth(client: Client, options: { accountToken?: unknown }) {
    this.playerSkins.set(client.sessionId, GameRoom.skinForToken(options.accountToken));
    this.playerPrimaries.set(client.sessionId, GameRoom.primaryForToken(options.accountToken));
    return true;
  }
  maxClients = 10;
  mode: GameMode = 'free_for_all';
  phase: MatchPhase = 'lobby';
  private players = new Map<string, PlayerInfo>();
  lobbyName = 'Arena PolyStrike';
  roomCode = '';
  isPrivate = false;
  mapId = 'depot';
  private startedAt = Date.now();
  private countdownEndsAt = 0;
  private buyEndsAt = 0;
  private phaseEndsAt = 0;
  private matchClock = new MatchClock({ countdownMs: 10_000, buyMs: 0, matchMs: 600_000 });
  private finishedAt = 0;
  private roundNumber = 1;
  private inputLimiter = new RateLimiter(25, 1_000);
  private fireLimiter = new RateLimiter(12, 1_000);
  private pingLimiter = new RateLimiter(4, 2_000);
  private payloadRound?: PayloadRound;
  private payloadWins = { blue: 0, red: 0 };
  private botReaction = new Map<string, { targetId?: string; readyAt: number }>();
  private botArmament = new BotArmament();
  private humanReloads = new ReloadController();
  private respawnDeadlines = new WeakMap<CombatPlayer, number>();
  private scheduleRespawn(id: string) {
    const player = this.players.get(id);
    if (player && !player.combat.alive && GAME_MODES[this.mode].respawnMs) this.respawnDeadlines.set(player.combat, Date.now() + GAME_MODES[this.mode].respawnMs);
  }
  private finishRespawns() {
    if (this.phase !== 'playing') return;
    for (const [id, player] of this.players) {
      const deadline = this.respawnDeadlines.get(player.combat);
      if (!player.combat.alive && deadline !== undefined && Date.now() >= deadline) this.respawn(id);
    }
  }
  private finishReloads() {
    for (const [id, player] of this.players) {
      if (player.isBot) continue;
      if (this.phase !== 'playing') { this.humanReloads.cancel(player.combat); continue; }
      const weaponId = this.humanReloads.update(player.combat, Date.now());
      if (weaponId) this.broadcast('ammo', { playerId: id, weaponId, ammo: player.combat.ammo[weaponId], reserve: player.combat.reserve[weaponId], reloaded: true });
    }
  }
  private mapSpawns(): readonly SpawnPoint[] { return getMapDefinition(this.mapId).spawns; }
  private spawn(index: number, team?: 'blue' | 'red'): PlayerKinematicState {
    const allSpawns = this.mapSpawns();
    const points = team ? allSpawns.filter((point) => point.team === team) : allSpawns;
    const point = points.find(point => ![...this.players.values()].some(player => player.combat.alive && Math.hypot(player.state.x - point.x, player.state.z - point.z) < 1.2)) ?? points[index % points.length] ?? allSpawns[0]!;
    return { x: point.x, y: 0, z: point.z, verticalVelocity: 0, grounded: true };
  }
  onCreate(options: Partial<JoinOptions> & { roomName?: string; roomCode?: string; isPrivate?: boolean; botCount?: number; mapId?: string }) {
    this.mode = options.mode && Object.hasOwn(GAME_MODES, options.mode) ? options.mode : 'free_for_all'; this.lobbyName = options.roomName?.slice(0, 24) || this.lobbyName; this.roomCode = options.roomCode?.toUpperCase() || ''; this.isPrivate = Boolean(options.isPrivate); this.mapId = ['crossroads', 'foundry', 'alleyways', 'citadel', 'canal'].includes(options.mapId ?? '') ? options.mapId! : 'depot';
    this.matchClock = new MatchClock({ countdownMs: 10_000, buyMs: GAME_MODES[this.mode].buyMs, matchMs: GAME_MODES[this.mode].matchMs });
    if (this.roomId) { void this.setPrivate(this.isPrivate); this.setMetadata({ roomName: this.lobbyName, mode: this.mode, mapId: this.mapId, isPrivate: this.isPrivate, roomCode: this.roomCode }); }
    const botCount = Math.max(0, Math.min(9, Math.floor(options.botCount ?? 9)));
    for (let index = 1; index <= botCount; index += 1) { const team = this.nextTeam(); this.players.set(`bot-${index}`, { name: `BOT-${index}`, team, isBot: true, state: this.spawn(index, team), yaw: 0, pitch: 0, score: 0, cash: 800, primaryWeaponId: 'rifle', combat: combat(`bot-${index}`), invulnerableUntil: Date.now() + 2_000 }); }
    this.onMessage('input', (client, input: unknown) => { if (isValidPlayerInput(input) && this.inputLimiter.allow(client.sessionId)) this.applyInput(client.sessionId, input); });
    this.onMessage('fire', (client, request: unknown) => { if (isValidFireRequest(request) && this.fireLimiter.allow(client.sessionId)) this.applyFire(client.sessionId, request); });
    this.onMessage('ping', (client, message: unknown) => { const player = this.players.get(client.sessionId); if (player && isValidPing(message) && this.pingLimiter.allow(client.sessionId)) this.broadcast('ping', { senderId: client.sessionId, senderName: player.name, message, position: [player.state.x, player.state.z] }); });
    this.onMessage('buy', (client, request: unknown) => this.applyBuy(client.sessionId, request));
    this.onMessage('cancel_reload', client => { const player = this.players.get(client.sessionId); if (player) this.humanReloads.cancel(player.combat); });
    this.onMessage('reload', (client, request: unknown) => this.applyReload(client.sessionId, request));
    this.onMessage('objective', (client, request: unknown) => { if (this.mode === 'payload' && isValidObjectiveAction(request)) this.payloadRound?.setHolding(client.sessionId, request.active); });
    if (this.roomId) this.setSimulationInterval(() => { this.advanceRoomClock(); this.finishReloads(); this.finishRespawns(); this.tickBots(); this.broadcastSnapshot(); }, 100);
  }
  onJoin(client: Client, options: JoinOptions) { if (this.phase === 'playing') throw new Error('Mecz już trwa.'); const name = options.playerName.trim().slice(0, 16); if (name.length < 3) throw new Error('Nazwa gracza musi mieć 3–16 znaków.'); if (this.players.size >= 10) { const bot = [...this.players.entries()].find(([, player]) => player.isBot); if (!bot) throw new Error('Lobby jest pełne.'); this.players.delete(bot[0]); } const team = this.nextTeam(); const primaryWeaponId = this.mode === 'free_for_all' ? this.playerPrimaries.get(client.sessionId) ?? 'pistol' : 'pistol'; this.players.set(client.sessionId, { name, team, isBot: false, state: this.spawn(this.players.size, team), yaw: 0, pitch: 0, score: 0, cash: 800, primaryWeaponId, combat: combat(client.sessionId), invulnerableUntil: Date.now() + 2_000 }); this.updateLobbyPhase(); this.broadcastLobby(); this.broadcastSnapshot(); }
  async onLeave(client: Client, code?: number) {
    // Colyseus sends 4000 for an intentional leave, not WebSocket's normal 1000.
    const unexpectedlyDisconnected = code !== undefined && code !== 1000 && code !== 4000;
    if (unexpectedlyDisconnected) {
      try {
        await this.allowReconnection(client, 20);
        return;
      } catch {
        // The reconnection window elapsed; the player now leaves the match.
      }
    }
    this.players.delete(client.sessionId); this.playerSkins.delete(client.sessionId); this.playerPrimaries.delete(client.sessionId); this.updateLobbyPhase(); this.broadcastLobby(); this.broadcastSnapshot();
  }
  private applyInput(id: string, input: PlayerInput) { const player = this.players.get(id); if (!player || this.phase !== 'playing' || player.isBot || !player.combat.alive || !Number.isFinite(input.moveX) || !Number.isFinite(input.moveZ) || !Number.isFinite(input.yaw) || !Number.isFinite(input.pitch)) return; player.yaw = input.yaw; player.pitch = input.pitch; player.state = this.movePlayer(id, player.state, { ...input, moveX: Math.max(-1, Math.min(1, input.moveX)), moveZ: Math.max(-1, Math.min(1, input.moveZ)) }, 1 / 20); }
  private applyBuy(id: string, request: unknown) { const player = this.players.get(id); if (!player || this.phase !== 'buy' || !request || typeof request !== 'object' || typeof (request as { weaponId?: unknown }).weaponId !== 'string') return; const weaponId = (request as { weaponId: string }).weaponId; if (!(weaponId in WEAPONS)) return; const purchase = buyWeapon(player.cash, weaponId as WeaponId); if (!purchase) return; player.cash = purchase.cash; player.primaryWeaponId = purchase.weaponId; this.broadcastSnapshot(); }
  private applyReload(id: string, request: unknown) {
    const player = this.players.get(id);
    if (!player || this.phase !== 'playing' || !request || typeof request !== 'object') return;
    const weaponId = (request as { weaponId?: unknown }).weaponId;
    if (typeof weaponId !== 'string' || !Object.hasOwn(WEAPONS, weaponId)) return;
    const owned = canFire({ ownedPrimary: player.primaryWeaponId }, weaponId as WeaponId);
    if (!owned || (!this.humanReloads.start(player.combat, weaponId as WeaponId, Date.now()) && !this.humanReloads.active(player.combat))) this.broadcast('ammo', { playerId: id, weaponId, ammo: player.combat.ammo[weaponId as WeaponId], reserve: player.combat.reserve[weaponId as WeaponId], reloaded: true });
  }
  private applyFire(id: string, request: FireRequest) { const shooter = this.players.get(id); if (!shooter || this.phase !== 'playing' || !(request.weaponId in WEAPONS)) return; const weaponId = request.weaponId as WeaponId; if (!canFire({ ownedPrimary: shooter.primaryWeaponId }, weaponId)) return; if (!shooter.isBot && this.humanReloads.active(shooter.combat)) return; const now = Date.now(); const teamMode = GAME_MODES[this.mode].team; const eligible = [...this.players.entries()].filter(([targetId, candidate]) => targetId !== id && candidate.combat.alive && candidate.invulnerableUntil <= now && (!teamMode || candidate.team !== shooter.team)); const aim = request.direction ? request : { ...request, origin: [shooter.state.x, shooter.state.y + 1.7, shooter.state.z] as [number, number, number], direction: [-Math.sin(shooter.yaw), 0, -Math.cos(shooter.yaw)] as [number, number, number] }; const selected = selectShotTarget(shooter.state, eligible.map(([targetId, candidate]) => ({ id: targetId, x: candidate.state.x, z: candidate.state.z })), aim, mapColliders(this.mapId), weaponId); const target = selected ? { targetId: selected.id, candidate: this.players.get(selected.id)! } : undefined; const ammoBefore = shooter.combat.ammo[weaponId]; const hit = validateAndResolveFire(shooter.combat, weaponId, target?.candidate.combat, now, 'torso'); if (shooter.combat.ammo[weaponId] !== ammoBefore) this.broadcast('ammo', { playerId: id, weaponId, ammo: shooter.combat.ammo[weaponId], reserve: shooter.combat.reserve[weaponId] }); if (!hit.length) return; this.broadcast('hit', { shooterId: id, targetId: hit[0].targetId, damage: hit[0].damage, weaponId: request.weaponId }); if (target && !target.candidate.combat.alive) { shooter.score += 1; this.broadcast('kill', { killerId: id, targetId: target.targetId, killerName: shooter.name, targetName: target.candidate.name, weaponId: request.weaponId }); this.scheduleRespawn(target.targetId); if (this.mode !== 'payload') this.checkMatch(); } this.broadcastSnapshot(); }
  private tickBots() {
    if (this.phase !== 'playing') return;
    const colliders = mapColliders(this.mapId);
    for (const [id, bot] of this.players) {
      if (!bot.isBot || !bot.combat.alive) continue;
      const now = Date.now();
      const armament = this.botArmament.update(bot.combat, bot.primaryWeaponId, now);
      const targets = [...this.players.entries()].filter(([targetId, candidate]) => targetId !== id && candidate.combat.alive).map(([targetId, candidate]) => ({ id: targetId, x: candidate.state.x, z: candidate.state.z, alive: candidate.combat.alive, team: candidate.team }));
      const current = this.botReaction.get(id) ?? { readyAt: now + 350 };
      const action = chooseBotAction({ x: bot.state.x, z: bot.state.z, yaw: bot.yaw, lastShotAt: bot.combat.lastFireAt, reactionReadyAt: current.readyAt, team: bot.team }, targets, now, colliders);
      const changedTarget = current.targetId !== action.targetId;
      this.botReaction.set(id, changedTarget ? { targetId: action.targetId, readyAt: now + 350 } : current);
      bot.yaw = action.yaw;
      bot.state = this.movePlayer(id, bot.state, { sequence: 0, clientTime: now, moveX: action.moveX, moveZ: action.moveZ, yaw: action.yaw, pitch: 0, jump: false, sprint: false }, .1);
      if (action.fire && !changedTarget && armament.ready) this.applyFire(id, { sequence: 0, clientTime: now, weaponId: armament.weaponId, origin: [bot.state.x, bot.state.y, bot.state.z], direction: [-Math.sin(action.yaw), 0, -Math.cos(action.yaw)] });
    }
  }
  private movePlayer(id: string, state: PlayerInfo['state'], input: PlayerInput, deltaSeconds: number) { const next = simulatePlayer(state, input, deltaSeconds, mapColliders(this.mapId)); const overlapsPlayer = [...this.players].some(([otherId, other]) => otherId !== id && other.combat.alive && Math.hypot(next.x - other.state.x, next.z - other.state.z) < 1); return overlapsPlayer ? { ...next, x: state.x, z: state.z, horizontalVelocityX: 0, horizontalVelocityZ: 0 } : next; }
  private respawn(id: string) {
    const player = this.players.get(id);
    if (!player || this.phase !== 'playing' || !GAME_MODES[this.mode].respawnMs) return;
    const others = [...this.players.entries()].filter(([otherId]) => otherId !== id).map(([, p]) => ({ x: p.state.x, z: p.state.z, team: p.team, alive: p.combat.alive }));
    const selected = selectSafeSpawn(player.team, others, this.mapSpawns());
    // An occupied base is retried on the next tick, never replaced with the enemy base.
    if (!selected) return;
    player.combat = combat(id);
    player.state = { x: selected.x, y: 0, z: selected.z, verticalVelocity: 0, grounded: true };
    player.yaw = Math.atan2(selected.x, selected.z); player.pitch = 0;
    player.invulnerableUntil = Date.now() + 2_000;
    this.broadcastSnapshot();
  }
  private updateLobbyPhase() { if (this.phase === 'finished') return; const hasHuman = [...this.players.values()].some((player) => !player.isBot); if (!hasHuman || this.players.size < 2) { this.phase = 'lobby'; this.countdownEndsAt = 0; this.buyEndsAt = 0; this.phaseEndsAt = 0; return; } if (this.phase === 'lobby') { const now = Date.now(); this.matchClock.reset(now); const state = this.matchClock.advance(now); this.phase = state.phase; this.phaseEndsAt = state.phaseEndsAt; this.countdownEndsAt = state.phaseEndsAt; } }
  private advanceRoomClock() {
    if (this.phase === 'finished') {
      if (Date.now() - this.finishedAt < 15_000) return;
      for (const player of this.players.values()) player.score = 0;
      this.payloadWins = { blue: 0, red: 0 }; this.payloadRound = undefined;
      this.prepareSpawns(Date.now());
      this.roundNumber += 1; this.phase = 'lobby';
      if (this.roomId) void this.unlock();
      this.finishedAt = 0; this.startedAt = Date.now();
      this.updateLobbyPhase(); this.broadcastLobby(); return;
    }
    this.advanceLobbyClock();
    if (this.phase === 'playing' && this.mode === 'payload') this.advancePayload(Date.now());
    else if (this.phase === 'playing') this.checkMatch();
  }
  private advanceLobbyClock(now = Date.now()) { if (this.phase === 'lobby' || this.phase === 'finished') return; this.updateLobbyPhase(); const activePhase = this.phase as MatchPhase; if (activePhase === 'lobby') return; const previous = activePhase; const state = this.matchClock.advance(now); if (state.phase === 'finished') { this.checkMatch(now); return; } this.phase = state.phase; this.phaseEndsAt = state.phaseEndsAt; this.countdownEndsAt = state.phase === 'countdown' ? state.phaseEndsAt : 0; this.buyEndsAt = state.phase === 'buy' ? state.phaseEndsAt : 0; if (previous !== this.phase && this.phase === 'playing') this.beginPlaying(now); if (previous !== this.phase) this.broadcastLobby(); }
  private prepareSpawns(now: number) {
    const indices = { blue: 0, red: 0, solo: 0 };
    for (const [id, player] of this.players) {
      const points = this.mapSpawns().filter(point => !player.team || point.team === player.team);
      const point = points[indices[player.team ?? 'solo']++ % points.length]!;
      player.combat = combat(id);
      player.state = { x: point.x, y: 0, z: point.z, verticalVelocity: 0, grounded: true };
      player.yaw = Math.atan2(point.x, point.z); player.pitch = 0;
      player.invulnerableUntil = now + 2_000;
    }
    this.botReaction.clear();
  }
  private beginPlaying(now: number) {
    if (this.roomId) void this.lock();
    this.prepareSpawns(now);
    this.startedAt = now;
    if (this.mode === 'payload') this.payloadRound = new PayloadRound([-48, -36], now);
  }
  private checkMatch(now = Date.now()) {
    if (this.phase !== 'playing' || this.mode === 'payload') return;
    let result: import('../match/MatchRules.js').MatchResult | undefined;
    if (this.mode === 'elimination') {
      const alive = { blue: 0, red: 0 };
      for (const player of this.players.values()) if (player.combat.alive && player.team) alive[player.team]++;
      const timedOut = now - this.startedAt >= GAME_MODES.elimination.matchMs;
      if (!timedOut && alive.blue > 0 && alive.red > 0) return;
      result = { reason: timedOut ? 'time_limit' : 'elimination', draw: alive.blue === alive.red };
      if (!result.draw) result.winnerTeam = alive.blue > alive.red ? 'blue' : 'red';
    } else {
      const scores: Record<string, number> = this.mode === 'team_deathmatch' ? { blue: 0, red: 0 } : {};
      for (const [id, player] of this.players) {
        const key = this.mode === 'team_deathmatch' ? player.team! : id;
        scores[key] = (scores[key] ?? 0) + player.score;
      }
      result = resolveMatch(this.mode, scores, (now - this.startedAt) / 1000);
    }
    if (!result) return;
    this.phase = 'finished'; this.finishedAt = now; this.phaseEndsAt = now;
    this.broadcast('match_result', { ...result, matchId: `${this.roomId}:${this.roundNumber}` });
    this.broadcastLobby();
  }
  private phaseCountdownSeconds() { return this.phaseEndsAt && (this.phase === 'countdown' || this.phase === 'buy') ? Math.max(0, Math.ceil((this.phaseEndsAt - Date.now()) / 1_000)) : undefined; }
  private scoreSummary() { if (this.mode === 'payload') return { blueScore: this.payloadWins.blue, redScore: this.payloadWins.red }; let blueScore = 0; let redScore = 0; for (const player of this.players.values()) { const value = this.mode === 'elimination' ? Number(player.combat.alive) : player.score; if (player.team === 'blue') blueScore += value; if (player.team === 'red') redScore += value; } return { blueScore, redScore }; }
  private broadcastLobby() { this.broadcast('lobby', { phase: this.phase, phaseEndsAt: this.phaseEndsAt, countdownSeconds: this.phaseCountdownSeconds(), mode: this.mode, mapId: this.mapId, roundNumber: this.roundNumber, ...this.scoreSummary(), players: [...this.players].map(([id, player]) => ({ id, name: player.name, team: player.team, isBot: player.isBot })) }); }
  private broadcastSnapshot() { const now = Date.now(); const remainingSeconds = this.phase === 'lobby' ? 600 : this.phase === 'finished' ? 0 : this.matchClock.advance(now).remainingSeconds; this.broadcast('snapshot', { phase: this.phase, phaseEndsAt: this.phaseEndsAt, countdownSeconds: this.phaseCountdownSeconds(), serverTime: now, remainingSeconds, roundNumber: this.roundNumber, ...this.scoreSummary(), objective: this.payloadRound?.snapshot(now), players: [...this.players].map(([id, player]) => ({ id, skinId: this.playerSkins.get(id) ?? 'recruit', position: [player.state.x, player.state.y, player.state.z] as [number, number, number], yaw: player.yaw, pitch: player.pitch, health: player.combat.health, ammo: player.combat.ammo, reserve: player.combat.reserve, score: player.score, cash: player.cash, primaryWeaponId: player.primaryWeaponId, alive: player.combat.alive, respawnAt: this.respawnDeadlines.get(player.combat) ?? 0 })) }); }
  private advancePayload(now: number) { if (!this.payloadRound) return; this.payloadRound.tick(now, [...this.players.entries()].map(([id, player]) => ({ id, team: player.team!, alive: player.combat.alive, x: player.state.x, z: player.state.z }))); const winner = this.payloadRound.winner; if (!winner) return; this.payloadWins[winner] += 1; this.broadcast('round_result', { winnerTeam: winner }); if (this.payloadWins[winner] >= 5) { this.phase = 'finished'; this.finishedAt = now; this.phaseEndsAt = now; this.broadcast('match_result', { winnerTeam: winner, draw: false, matchId: `${this.roomId}:${this.roundNumber}` }); return; } this.prepareSpawns(now); this.roundNumber += 1; this.matchClock.reset(now); const state = this.matchClock.advance(now); this.phase = state.phase; this.phaseEndsAt = state.phaseEndsAt; this.payloadRound = undefined; this.broadcastLobby(); }
  private nextTeam() { if (!GAME_MODES[this.mode].team) return undefined; const blue = [...this.players.values()].filter((player) => player.team === 'blue').length; const red = this.players.size - blue; return blue <= red ? 'blue' : 'red'; }
}
