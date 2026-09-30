import { describe, expect, it } from 'vitest';
import { clampTrainingPosition, groundMoveDelta, resolveCameraCollision } from './GroundMovement.js';

describe('groundMoveDelta', () => {
  it('preserves jump height while limiting horizontal training movement', () => {
    expect(clampTrainingPosition({ x: 0, y: 2.6, z: 0 }).y).toBe(2.6);
  });
  it('moves forward on the arena floor without a vertical component', () => {
    expect(groundMoveDelta(0, 1, 0, 5, 1)).toEqual({ x: 0, z: -5 });
  });

  it('keeps a training player on the arena floor and within its playable boundary', () => {
    expect(clampTrainingPosition({ x: 100, y: -5, z: -100 })).toEqual({ x: 57.8, y: 1.7, z: -57.8 });
  });

  it('stops the local camera before it enters a depot cover block', () => {
    expect(resolveCameraCollision({ x: 0, y: 1.7, z: 4 }, { x: 0, y: 1.7, z: 0 }, 'depot')).toEqual({ x: 0, y: 1.7, z: 4 });
  });

  it('keeps the camera far enough from cover that a wall cannot fill the screen', () => {
    expect(resolveCameraCollision({ x: 0, y: 1.7, z: 4 }, { x: 0, y: 1.7, z: 3.6 }, 'depot')).toEqual({ x: 0, y: 1.7, z: 4 });
  });
});
