import { describe, expect, it } from 'vitest';
import { isValidFireRequest, isValidObjectiveAction, isValidPlayerInput } from './messages.js';

describe('message validation', () => {
  it('rejects player input containing non-finite coordinates', () => {
    expect(isValidPlayerInput({ sequence: 1, clientTime: Date.now(), moveX: Number.NaN, moveZ: 0, yaw: 0, pitch: 0, jump: false, sprint: false })).toBe(false);
    expect(isValidPlayerInput({ sequence: 1, clientTime: Date.now(), moveX: 0, moveZ: 0, yaw: 0, pitch: Infinity, jump: false, sprint: false })).toBe(false);
  });

  it('accepts bounded player input and rejects an unknown weapon', () => {
    expect(isValidPlayerInput({ sequence: 1, clientTime: Date.now(), moveX: 1, moveZ: -1, yaw: 0, pitch: 0, jump: false, sprint: true })).toBe(true);
    expect(isValidFireRequest({ sequence: 1, clientTime: Date.now(), weaponId: 'laser', origin: [0, 0, 0], direction: [0, 0, -1] })).toBe(false);
  });
  it('accepts only a boolean payload interaction hold', () => {
    expect(isValidObjectiveAction({ active: true })).toBe(true);
    expect(isValidObjectiveAction({ active: 'yes' })).toBe(false);
  });
});
