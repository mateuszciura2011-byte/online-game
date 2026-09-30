import { describe, expect, it } from 'vitest';
import { RateLimiter } from './RateLimiter.js';

describe('RateLimiter', () => {
  it('blocks messages sent above the configured limit inside one time window', () => {
    const limiter = new RateLimiter(2, 1_000);
    expect(limiter.allow('player', 0)).toBe(true);
    expect(limiter.allow('player', 100)).toBe(true);
    expect(limiter.allow('player', 200)).toBe(false);
    expect(limiter.allow('player', 1_001)).toBe(true);
  });
});
