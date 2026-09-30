export class GameApp {
  private started = false;

  constructor(private readonly boot: () => void) {}

  start() {
    if (this.started) return;
    this.started = true;
    this.boot();
  }
}
