import { describe, expect, it } from 'vitest';
import { reconcilePosition } from './ServerReconciliation.js';

describe('server reconciliation', () => {
  it('moves a predicted position toward the authoritative snapshot', () => {
    expect(reconcilePosition([0, 0, 12], [8, 1.7, 0], .5)).toEqual([4, .85, 6]);
  });

  it('never overshoots an authoritative position', () => {
    expect(reconcilePosition([0, 0, 0], [5, 0, -5], 5)).toEqual([5, 0, -5]);
  });
});
