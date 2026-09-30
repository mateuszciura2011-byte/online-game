import { describe, expect, it } from 'vitest';
import { formatBuyCash, formatBuyPhase, syncBuyPhaseEnd } from './BuyPhase.js';

describe('buy phase', () => {
  it('shows a clear purchase countdown for the team round', () => {
    expect(formatBuyPhase(12)).toBe('FAZA KUPOWANIA — 12 s');
  });

  it('never shows a negative purchase countdown', () => {
    expect(formatBuyPhase(-2)).toBe('FAZA KUPOWANIA — 0 s');
  });

  it('formats the server-approved round cash', () => {
    expect(formatBuyCash(1_500)).toBe('KREDYTY: 1500');
  });

  it('uses the server phase end rather than restarting a 15-second purchase clock', () => {
    expect(syncBuyPhaseEnd(75_000, 74_000, 10_000)).toBe(11_000);
  });
});
