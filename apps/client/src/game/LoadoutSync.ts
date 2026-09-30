type LifeState = { playerId: string; alive: boolean; phase: string; roundNumber: number };

/** Full loadout restoration belongs to life transitions, never weapon switching. */
export class LoadoutSync {
  private previous?: LifeState;
  shouldRestore(state: LifeState): boolean {
    const previous = this.previous;
    this.previous = { ...state };
    return state.alive && (!previous || previous.playerId !== state.playerId || !previous.alive ||
      previous.roundNumber !== state.roundNumber || (state.phase === 'playing' && previous.phase !== 'playing'));
  }
}
