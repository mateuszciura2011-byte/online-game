import { describe, expect, it } from 'vitest';
import { chooseBotAction } from './BotController.js';

describe('bot controller', () => {
  const wall = { minX: -1, maxX: 1, minZ: -4, maxZ: -3 };
  it('does not fire at an enemy through cover and steers around it', () => {
    const action = chooseBotAction({ x: 0, z: 0, yaw: 0 }, [{ id: 'enemy', x: 0, z: -6, alive: true }], 1000, [wall]);
    expect(action.fire).toBe(false);
    expect(Math.abs(action.yaw)).toBeGreaterThan(.2);
    expect(action.moveZ).toBe(1);
  });
  it('prefers a visible enemy to a closer enemy behind cover', () => {
    const action = chooseBotAction({ x: 0, z: 0, yaw: 0 }, [{ id: 'hidden', x: 0, z: -6, alive: true }, { id: 'visible', x: 7, z: 0, alive: true }], 1000, [wall]);
    expect(action.targetId).toBe('visible');
  });
  it('walks toward a visible enemy outside firing range', () => {
    expect(chooseBotAction({ x: 0, z: 0, yaw: 0 }, [{ id: 'enemy', x: 0, z: -12, alive: true }])).toMatchObject({ moveZ: 1, fire: false });
  });
  it('fires at a visible enemy in range', () => {
    expect(chooseBotAction({ x: 0, z: 0, yaw: 0 }, [{ id: 'enemy', x: 0, z: -5, alive: true }])).toMatchObject({ moveZ: 0, fire: true });
  });
  it('waits briefly between shots at an enemy in range', () => {
    expect(chooseBotAction({ x: 0, z: 0, yaw: 0, lastShotAt: 1_000 }, [{ id: 'enemy', x: 0, z: -5, alive: true }], 1_250)).toMatchObject({ fire: false });
  });
  it('strafes around an enemy instead of standing still at firing range', () => {
    expect(chooseBotAction({ x: 0, z: 0, yaw: 0 }, [{ id: 'enemy', x: 0, z: -5, alive: true }], 1_000)).toMatchObject({ moveX: 0.65, moveZ: 0, fire: true });
  });
  it('backs away while strafing when an enemy gets too close', () => {
    expect(chooseBotAction({ x: 0, z: 0, yaw: 0 }, [{ id: 'enemy', x: 0, z: -2, alive: true }], 1_000)).toMatchObject({ moveX: 0.65, moveZ: -0.45 });
  });
  it('waits for its reaction delay before firing at a newly seen enemy', () => {
    expect(chooseBotAction({ x: 0, z: 0, yaw: 0, reactionReadyAt: 1_400 }, [{ id: 'enemy', x: 0, z: -5, alive: true }], 1_000)).toMatchObject({ fire: false });
  });
  it('targets the nearest living enemy instead of a teammate', () => {
    const action = chooseBotAction(
      { x: 0, z: 0, yaw: 0, team: 'blue' },
      [
        { id: 'ally', x: 0, z: -2, alive: true, team: 'blue' },
        { id: 'enemy', x: 0, z: -6, alive: true, team: 'red' },
      ],
      1_000,
    );
    expect(action.targetId).toBe('enemy');
  });
});
