import * as THREE from 'three';

/** Pooled, low-overdraw particles used as ambient dust or furnace sparks. */
export class ArenaAtmosphere {
  readonly points: THREE.Points;
  private readonly positions: Float32Array;
  private readonly speeds: Float32Array;
  private foundry = false;
  private lastTime = performance.now();

  constructor(scene: THREE.Scene, count = 72) {
    this.positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);
    for (let index = 0; index < count; index += 1) this.reset(index, true);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#8ed9ef', size: .06, transparent: true, opacity: .35, depthWrite: false }));
    scene.add(this.points);
    requestAnimationFrame(() => this.tick());
  }

  setArena(mapId: string) {
    this.foundry = mapId === 'foundry';
    (this.points.material as THREE.PointsMaterial).color.set(this.foundry ? '#ff9a4b' : '#8ed9ef');
    (this.points.material as THREE.PointsMaterial).opacity = this.foundry ? .65 : .28;
  }

  particleCount() { return this.speeds.length; }

  private tick() {
    const now = performance.now();
    const dt = Math.min(.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    for (let index = 0; index < this.speeds.length; index += 1) {
      const offset = index * 3;
      this.positions[offset] += (this.foundry ? .18 : .05) * dt;
      this.positions[offset + 1] += this.speeds[index] * dt;
      if (this.positions[offset + 1] > 10 || this.positions[offset] > 27) this.reset(index, false);
    }
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    requestAnimationFrame(() => this.tick());
  }

  private reset(index: number, initial: boolean) {
    const offset = index * 3;
    this.positions[offset] = (Math.random() - .5) * 52;
    this.positions[offset + 1] = initial ? Math.random() * 10 : 0;
    this.positions[offset + 2] = (Math.random() - .5) * 52;
    this.speeds[index] = this.foundry ? .8 + Math.random() * .9 : .06 + Math.random() * .15;
  }
}
