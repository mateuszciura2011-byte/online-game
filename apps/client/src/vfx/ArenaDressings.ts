import * as THREE from 'three';

type ArenaPalette = { glow: string; metal: string; accent: string };

const palettes: Record<string, ArenaPalette> = {
  depot: { glow: '#27d8ff', metal: '#18394d', accent: '#2c6682' },
  crossroads: { glow: '#8d8cff', metal: '#2d3450', accent: '#6f79c9' },
  foundry: { glow: '#ff9a4b', metal: '#3b2922', accent: '#8b4d28' },
};

export class ArenaDressings {
  private readonly group = new THREE.Group();
  private glow = '#27d8ff';

  constructor(scene: THREE.Scene) {
    this.group.name = 'arena-dressings';
    scene.add(this.group);
  }

  setArena(mapId: string) {
    this.dispose();
    const palette = palettes[mapId] ?? palettes.depot;
    this.glow = palette.glow;
    const positions = mapId === 'crossroads'
      ? [[-13, -13], [13, -13], [-13, 13], [13, 13], [0, -15], [0, 15]]
      : mapId === 'foundry'
        ? [[-14, -10], [14, -10], [-14, 10], [14, 10], [0, -15], [0, 15]]
        : [[-15, -12], [15, -12], [-15, 12], [15, 12], [0, -16], [0, 16]];
    positions.forEach(([x, z], index) => this.group.add(this.createBeacon(x, z, palette, index)));
    if (mapId === 'foundry') this.group.add(this.createFurnace(0, -17, palette));
  }

  meshCount() {
    let count = 0;
    this.group.traverse((node) => { if (node instanceof THREE.Mesh) count += 1; });
    return count;
  }

  hasGlow(color: string) {
    return this.glow.toLowerCase() === color.toLowerCase();
  }

  dispose() {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.group.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      geometries.add(node.geometry);
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    this.group.clear();
  }

  private createBeacon(x: number, z: number, palette: ArenaPalette, index: number) {
    const beacon = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.BoxGeometry(.16, 3.2, .16), new THREE.MeshStandardMaterial({ color: palette.metal, roughness: .78 }));
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.05, .16, .46), new THREE.MeshStandardMaterial({ color: palette.glow, emissive: palette.glow, emissiveIntensity: 1.25, roughness: .35 }));
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .52), new THREE.MeshBasicMaterial({ color: palette.accent }));
    pole.position.y = 1.6;
    head.position.y = 3.2;
    head.rotation.y = index % 2 ? Math.PI / 2 : 0;
    stripe.position.y = 3.35;
    beacon.add(pole, head, stripe);
    beacon.position.set(x, 0, z);
    return beacon;
  }

  private createFurnace(x: number, z: number, palette: ArenaPalette) {
    const furnace = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 1.2), new THREE.MeshStandardMaterial({ color: palette.metal, roughness: .85 }));
    const core = new THREE.Mesh(new THREE.BoxGeometry(3.1, .7, .08), new THREE.MeshStandardMaterial({ color: palette.glow, emissive: palette.glow, emissiveIntensity: 1.8, roughness: .25 }));
    shell.position.y = 1.25;
    core.position.set(0, 1.25, .65);
    furnace.add(shell, core);
    furnace.position.set(x, 0, z);
    return furnace;
  }
}
