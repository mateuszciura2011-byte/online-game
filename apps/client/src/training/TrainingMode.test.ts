import { describe, expect, it } from 'vitest';
import { TrainingMode } from './TrainingMode.js';

describe('TrainingMode', () => {
  it('counts a hit and immediately respawns a destroyed target', () => {
    const training = new TrainingMode([{ id: 'target-a', position: [0, 1, -8] }]);

    training.recordShot();
    const result = training.hit('target-a', 100);

    expect(result).toEqual({ destroyed: true, respawned: true });
    expect(training.getStats()).toEqual({ shotsFired: 1, shotsHit: 1, accuracy: 100 });
    expect(training.getTarget('target-a')?.health).toBe(100);
  });
});
