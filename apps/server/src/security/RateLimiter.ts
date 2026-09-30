type Counter = { startedAt: number; count: number };

export class RateLimiter {
  private counters = new Map<string, Counter>();
  constructor(private readonly limit: number, private readonly windowMs: number) {}
  allow(key: string, now = Date.now()) {
    const previous = this.counters.get(key);
    if (!previous || now - previous.startedAt >= this.windowMs) { this.counters.set(key, { startedAt: now, count: 1 }); return true; }
    if (previous.count >= this.limit) return false;
    previous.count += 1;
    return true;
  }
}
