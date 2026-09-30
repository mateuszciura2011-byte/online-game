import * as THREE from 'three';

type Tracer = { line: THREE.Line; life: number };
type Impact = { mesh: THREE.Mesh; life: number };

export class CombatVfx {
  private readonly tracers: Tracer[];
  private readonly impacts: Impact[];
  private cursor = 0;
  private impactCursor = 0;

  constructor(scene: THREE.Scene, size = 8) {
    this.tracers = Array.from({ length: size }, () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#b9f8ff', transparent: true, opacity: .9 }));
      line.visible = false;
      scene.add(line);
      return { line, life: 0 };
    });
    this.impacts = Array.from({ length: size }, () => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.09, 5, 4), new THREE.MeshBasicMaterial({ color: '#fff1a8' }));
      mesh.visible = false;
      scene.add(mesh);
      return { mesh, life: 0 };
    });
  }

  fire(origin: THREE.Vector3, direction: THREE.Vector3, target?: THREE.Vector3, hitSurface = Boolean(target)) {
    const tracer = this.tracers[this.cursor++ % this.tracers.length]!;
    const end = target?.clone() ?? origin.clone().addScaledVector(direction.normalize(), 24);
    const positions = tracer.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    positions.setXYZ(0, origin.x, origin.y, origin.z);
    positions.setXYZ(1, end.x, end.y, end.z);
    positions.needsUpdate = true;
    tracer.line.visible = true;
    tracer.life = .13;
    if (hitSurface) this.impact(end);
  }

  impact(position: THREE.Vector3) {
    const impact = this.impacts[this.impactCursor++ % this.impacts.length]!;
    impact.mesh.position.copy(position);
    impact.mesh.visible = true;
    impact.life = .16;
  }

  update(delta: number) {
    for (const tracer of this.tracers) {
      tracer.life = Math.max(0, tracer.life - delta);
      tracer.line.visible = tracer.life > 0;
    }
    for (const impact of this.impacts) {
      impact.life = Math.max(0, impact.life - delta);
      impact.mesh.visible = impact.life > 0;
    }
  }

  activeCount() { return this.tracers.filter((tracer) => tracer.life > 0).length; }
  activeImpactCount() { return this.impacts.filter((impact) => impact.life > 0).length; }
}
