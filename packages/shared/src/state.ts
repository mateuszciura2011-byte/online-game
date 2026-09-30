import type { GameMode } from './protocol.js';
import type { ObjectiveSnapshot } from './payload.js';

export type TeamId = 'blue' | 'red';
export type MatchPhase = 'lobby' | 'countdown' | 'buy' | 'playing' | 'finished';

export interface PlayerState { id: string; name: string; team?: TeamId; health: number; alive: boolean; kills: number; deaths: number; }
export interface RoomState { id: string; mode: GameMode; phase: MatchPhase; players: PlayerState[]; }

export interface LobbySnapshot {
  phase: MatchPhase;
  phaseEndsAt: number;
  countdownSeconds?: number;
  mode: GameMode;
  mapId: string;
  roundNumber: number;
  blueScore: number;
  redScore: number;
  objective?: ObjectiveSnapshot;
  players: Array<{ id: string; name: string; team?: TeamId; isBot: boolean }>;
}

export interface GameSnapshot {
  phase: MatchPhase;
  phaseEndsAt: number;
  countdownSeconds?: number;
  serverTime: number;
  remainingSeconds: number;
  roundNumber: number;
  blueScore: number;
  redScore: number;
  objective?: ObjectiveSnapshot;
  players: Array<{ id: string; skinId?: string; ammo?: Record<import('./config/weapons.js').WeaponId, number>; reserve?: Record<import('./config/weapons.js').WeaponId, number>; position: [number, number, number]; yaw: number; pitch: number; health: number; score: number; cash: number; primaryWeaponId: string; alive: boolean; respawnAt?: number }>;
}
