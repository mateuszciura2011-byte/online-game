import { expect, it } from 'vitest';
import { chooseBotAction } from './BotController.js';
import { nextWaypoint, pathClear } from './Navigation.js';
import { simulatePlayer } from '../simulation/World.js';

it('walks around a broad wall and reaches a firing position without crossing it', () => {
  const walls = [{ minX: -2, maxX: 2, minZ: -5, maxZ: -3 }];
  let state = { x: 0, z: 1, y: 0, verticalVelocity: 0, grounded: true };
  let fired = false;
  for (let tick = 0; tick < 200; tick++) {
    const action = chooseBotAction({ ...state, yaw: 0 }, [{ id: 'target', x: 0, z: -9, alive: true }], tick * 100, walls);
    const next = simulatePlayer(state, { ...action, sequence: tick, clientTime: tick * 100, pitch: 0, jump: false, sprint: false }, .1, walls);
    expect(pathClear(state, next, walls, 1.1)).toBe(true);
    state = next;
    if (action.fire) { fired = true; break; }
  }
  expect(fired).toBe(true);
});

it('detects even a very thin occluder', () => {
  expect(pathClear({ x: 0, z: 0 }, { x: 10, z: 0 }, [{ minX: 5.011, maxX: 5.012, minZ: -1, maxZ: 1 }])).toBe(false);
});

it('can route away when the body is legally close to a wall', () => {
  expect(nextWaypoint({ x: 2.12, z: 0 }, { x: 5, z: 0 }, [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }])).toEqual({ x: 5, z: 0 });
  expect(nextWaypoint({ x: 5, z: 0 }, { x: 2.12, z: 0 }, [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }])).toEqual({ x: 2.12, z: 0 });
});
