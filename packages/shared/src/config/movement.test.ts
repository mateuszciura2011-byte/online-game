import { describe, expect, it } from 'vitest';
import { moveToward } from './movement.js';

describe('moveToward', () => {
  it('accelerates toward the requested speed without jumping to full velocity', () => {
    expect(moveToward(0, 0.5, 0.15)).toBe(0.15);
  });

  it('brakes to a complete stop without reversing direction', () => {
    expect(moveToward(-0.1, 0, 0.3)).toBe(0);
  });
});
