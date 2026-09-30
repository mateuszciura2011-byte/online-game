import type { WeaponId } from './config/weapons.js';

export type GameMode = 'team_deathmatch' | 'free_for_all' | 'payload' | 'elimination';

export const GAME_MODES: Record<GameMode, { name: string; description: string; team: boolean; buyMs: number; matchMs: number; respawnMs: number }> = {
  free_for_all: { name: 'Deathmatch — każdy na każdego', description: 'Bez drużyn. Wygraj, zdobywając 30 eliminacji lub najlepszy wynik w 10 minut. Odrodzenie: 30 s.', team: false, buyMs: 0, matchMs: 600000, respawnMs: 30000 },
  team_deathmatch: { name: 'Drużynowy deathmatch — 5 na 5', description: 'Dwie bazy na przeciwnych końcach mapy. Pierwsza drużyna z 50 eliminacjami wygrywa. Limit: 10 minut. Odrodzenie: 30 s.', team: true, buyMs: 15000, matchMs: 600000, respawnMs: 30000 },
  elimination: { name: 'Eliminacja — 5 na 5', description: 'Jedno życie na rundę. Wyeliminuj całą drużynę rywali. Po 2 minutach wygrywa drużyna z większą liczbą żywych graczy; równy wynik to remis.', team: true, buyMs: 15000, matchMs: 120000, respawnMs: 0 },
  payload: { name: 'Ładunek — atak i obrona', description: 'Niebiescy podkładają ładunek w punkcie A, czerwoni bronią i rozbrajają. Przytrzymaj E przy celu. Pierwsza drużyna z 5 wygranymi rundami zwycięża.', team: true, buyMs: 15000, matchMs: 75000, respawnMs: 30000 },
};

export interface PlayerInput {
  sequence: number;
  clientTime: number;
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
  jump: boolean;
  sprint: boolean;
}

export interface FireRequest {
  sequence: number;
  clientTime: number;
  weaponId: WeaponId;
  origin: [number, number, number];
  direction: [number, number, number];
}
