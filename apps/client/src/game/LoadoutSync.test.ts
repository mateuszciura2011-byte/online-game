import { expect, it } from 'vitest';
import { LoadoutSync } from './LoadoutSync.js';

it('restores ammunition on join, respawn and round start, not ordinary updates', () => {
  const sync = new LoadoutSync();
  const state = { alive: true, phase: 'countdown', roundNumber: 1, playerId: 'one' };
  expect(sync.shouldRestore(state)).toBe(true);
  expect(sync.shouldRestore(state)).toBe(false);
  expect(sync.shouldRestore({ ...state, phase: 'playing' })).toBe(true);
  expect(sync.shouldRestore({ ...state, phase: 'playing' })).toBe(false);
  expect(sync.shouldRestore({ ...state, phase: 'playing', alive: false })).toBe(false);
  expect(sync.shouldRestore({ ...state, phase: 'playing', alive: true })).toBe(true);
  expect(sync.shouldRestore({ ...state, roundNumber: 2 })).toBe(true);
  expect(sync.shouldRestore({ ...state, playerId: 'two' })).toBe(true);
});
