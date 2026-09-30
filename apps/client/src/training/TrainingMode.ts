export type TrainingTarget = { id: string; position: [number, number, number]; health: number };

export class TrainingMode {
  private readonly targets = new Map<string, TrainingTarget>();
  private shotsFired = 0;
  private shotsHit = 0;

  constructor(targets: Array<Omit<TrainingTarget, 'health'>>) {
    targets.forEach((target) => this.targets.set(target.id, { ...target, health: 100 }));
  }

  recordShot() { this.shotsFired += 1; }
  reset() { this.shotsFired = 0; this.shotsHit = 0; for (const target of this.targets.values()) target.health = 100; }

  hit(targetId: string, damage: number) {
    const target = this.targets.get(targetId);
    if (!target) return { destroyed: false, respawned: false };
    this.shotsHit += 1;
    target.health -= damage;
    if (target.health > 0) return { destroyed: false, respawned: false };
    target.health = 100;
    return { destroyed: true, respawned: true };
  }

  getTarget(id: string) { return this.targets.get(id); }

  getStats() {
    return { shotsFired: this.shotsFired, shotsHit: this.shotsHit, accuracy: this.shotsFired ? Math.round(this.shotsHit / this.shotsFired * 100) : 0 };
  }
}
