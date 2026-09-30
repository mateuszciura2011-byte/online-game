export class GameSession {
  private mode: 'menu' | 'training' | 'match' = 'menu';
  private paused = false;

  startTraining() { this.mode = 'training'; this.paused = false; }
  startMatch() { this.mode = 'match'; this.paused = false; }
  pause() { if (this.mode !== 'menu') this.paused = true; }
  resume() { this.paused = false; }
  end() { this.mode = 'menu'; this.paused = false; }
  isTraining() { return this.mode === 'training'; }
  isMatch() { return this.mode === 'match'; }
  isPaused() { return this.paused; }
}
