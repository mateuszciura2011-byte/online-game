export type MatchPhase = 'countdown' | 'buy' | 'playing' | 'finished';

export type MatchClockConfig = {
  countdownMs: number;
  buyMs: number;
  matchMs: number;
};

export type MatchClockSnapshot = {
  phase: MatchPhase;
  phaseEndsAt: number;
  countdownSeconds?: number;
  remainingSeconds: number;
};

export class MatchClock {
  private startedAt = 0;

  constructor(private readonly config: MatchClockConfig) {}

  reset(startedAt: number) {
    this.startedAt = startedAt;
  }

  advance(now: number): MatchClockSnapshot {
    const elapsed = Math.max(0, now - this.startedAt);
    const buyStartsAt = this.config.countdownMs;
    const playStartsAt = buyStartsAt + this.config.buyMs;
    const matchEndsAt = playStartsAt + this.config.matchMs;

    if (elapsed < buyStartsAt) {
      return this.snapshot('countdown', this.startedAt + buyStartsAt, now);
    }
    if (elapsed < playStartsAt) {
      return this.snapshot('buy', this.startedAt + playStartsAt, now);
    }
    if (elapsed < matchEndsAt) {
      return this.snapshot('playing', this.startedAt + matchEndsAt, now);
    }
    return { phase: 'finished', phaseEndsAt: this.startedAt + matchEndsAt, remainingSeconds: 0 };
  }

  private snapshot(phase: Exclude<MatchPhase, 'finished'>, phaseEndsAt: number, now: number): MatchClockSnapshot {
    const seconds = Math.max(0, Math.ceil((phaseEndsAt - now) / 1_000));
    return {
      phase,
      phaseEndsAt,
      countdownSeconds: phase === 'playing' ? undefined : seconds,
      remainingSeconds: phase === 'playing' ? seconds : Math.ceil(this.config.matchMs / 1_000),
    };
  }
}
