import { describe, expect, it } from 'vitest';
import { simulatePlayer } from './World.js';

const base = { x: 0, y: 0, z: 0, verticalVelocity: 0, grounded: true };
const input = { sequence: 1, clientTime: 0, moveX: 0, moveZ: 1, yaw: 0, pitch: 0, jump: false, sprint: false };
describe('simulatePlayer', () => {
  it('continues jumping when horizontal movement is blocked by a wall', () => {
    const next = simulatePlayer(base, { ...input, jump: true }, .1, [{ minX: -2, maxX: 2, minZ: -1.7, maxZ: -1.2 }]);
    expect(next.z).toBe(0);
    expect(next.y).toBeGreaterThan(0);
    expect(next.grounded).toBe(false);
  });
  it('reaches a responsive first movement step for a shooter', () => {
    expect(simulatePlayer(base, input, .1, []).z).toBeCloseTo(-.2);
  });
  it('ramps up speed instead of instantly moving at the maximum rate', () => {
    expect(simulatePlayer(base, input, .1, []).z).toBeGreaterThan(-4.8);
  });

  it('moves forward at the arena walking speed', () => expect(simulatePlayer(base, input, 1, []).z).toBe(-5.4));
  it('moves much faster while sprinting', () => expect(simulatePlayer(base, { ...input, sprint: true }, 1, []).z).toBe(-9));
  it('turns forward movement with the camera yaw', () => expect(simulatePlayer(base, { ...input, yaw: Math.PI / 2 }, 1, []).x).toBe(-5.4));
  it('does not move through a wall', () => expect(simulatePlayer(base, input, 1, [{ minX: -1, maxX: 1, minZ: -1.7, maxZ: -1.5 }])).toMatchObject(base));
  it('keeps the whole player body away from a wall instead of only checking its centre', () => {
    const nearWall = { ...base, z: 4 };
    expect(simulatePlayer(nearWall, input, .1, [{ minX: -3, maxX: 3, minZ: -3, maxZ: 3 }]).z).toBe(4);
  });
});
