import * as THREE from 'three';

type ArenaAtmosphere = {
  color: string;
  glow: string;
  position: readonly [number, number];
  rotation?: number;
};

type FacadeDetails = {
  color: string;
  glow: string;
  position: readonly [number, number];
  rotation?: number;
};

type WayfindingDetails = {
  color: string;
  position: readonly [number, number];
  rotation?: number;
};

const box = (root: THREE.Object3D, name: string, x: number, y: number, z: number, width: number, height: number, depth: number, material: THREE.Material) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
};

/** Adds a distant, non-blocking landmark so players can recognise each low-poly arena at a glance. */
export function addArenaAtmosphere(scene: THREE.Object3D, mapId: string, atmosphere: ArenaAtmosphere) {
  const root = new THREE.Group();
  root.name = `${mapId}-skyline-beacon`;
  root.position.set(atmosphere.position[0], 0, atmosphere.position[1]);
  root.rotation.y = atmosphere.rotation ?? 0;
  const steel = new THREE.MeshStandardMaterial({ color: atmosphere.color, roughness: .58, metalness: .55 });
  const glow = new THREE.MeshStandardMaterial({ color: atmosphere.glow, emissive: atmosphere.glow, emissiveIntensity: 1.3, roughness: .26, metalness: .28 });
  const dark = new THREE.MeshStandardMaterial({ color: '#10283a', roughness: .84, metalness: .35 });

  box(root, `${mapId}-beacon-base`, 0, .6, 0, 5.4, 1.2, 2.4, dark);
  box(root, `${mapId}-beacon-pylon-left`, -2, 4.3, 0, .34, 7.4, .34, steel);
  box(root, `${mapId}-beacon-pylon-right`, 2, 4.3, 0, .34, 7.4, .34, steel);
  box(root, `${mapId}-beacon-sign`, 0, 6.3, 0, 4.6, 1.5, .22, glow);
  box(root, `${mapId}-beacon-cap`, 0, 8.1, 0, 5.4, .26, 1.1, steel);
  box(root, `${mapId}-beacon-antenna`, 0, 10.1, 0, .16, 3.7, .16, glow);
  scene.add(root);
  return root;
}

/** Painted route lines and inset panels make the floor readable without creating collision. */
export function addArenaGroundDetails(scene: THREE.Object3D, mapId: string, color: string) {
  const root = new THREE.Group();
  root.name = `${mapId}-ground-grid`;
  const paint = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .24, roughness: .65, metalness: .22 });
  const inset = new THREE.MeshStandardMaterial({ color: '#173449', roughness: .92, metalness: .18 });
  for (const [x, z, width, depth] of [[0, -20, 11, .16], [0, 20, 11, .16], [-20, 0, .16, 11], [20, 0, .16, 11]] as number[][]) {
    box(root, `${mapId}-route-line`, x, .025, z, width, .025, depth, paint);
  }
  for (const [x, z] of [[-13, -13], [13, -13], [-13, 13], [13, 13]] as number[][]) {
    box(root, `${mapId}-ground-panel`, x, .018, z, 2.8, .018, 2.8, inset);
    box(root, `${mapId}-ground-panel-line`, x, .04, z, 2.1, .02, .12, paint);
  }
  scene.add(root);
  return root;
}

/** A shallow facade kit adds windows, service trim and pipes without changing the playable collision layout. */
export function addArenaFacadeDetails(scene: THREE.Object3D, mapId: string, details: FacadeDetails) {
  const root = new THREE.Group();
  root.name = `${mapId}-facade-kit`;
  root.position.set(details.position[0], 0, details.position[1]);
  root.rotation.y = details.rotation ?? 0;
  const wall = new THREE.MeshStandardMaterial({ color: details.color, roughness: .78, metalness: .24 });
  const glow = new THREE.MeshStandardMaterial({ color: details.glow, emissive: details.glow, emissiveIntensity: .85, roughness: .3, metalness: .2 });
  const trim = new THREE.MeshStandardMaterial({ color: '#163449', roughness: .56, metalness: .62 });
  box(root, `${mapId}-facade-wall`, 0, 3.4, 0, 8.6, 6.8, .62, wall);
  for (const x of [-2.7, 0, 2.7]) {
    box(root, `${mapId}-facade-window`, x, 4.1, .35, 1.65, 2.4, .08, glow);
    box(root, `${mapId}-facade-sill`, x, 2.7, .43, 2, .16, .22, trim);
  }
  box(root, `${mapId}-facade-cornice`, 0, 6.9, 0, 9.3, .35, .95, trim);
  box(root, `${mapId}-facade-pipe`, -4, 3.2, .52, .3, 5.2, .3, trim);
  box(root, `${mapId}-facade-pipe-cap`, -4, 5.9, .52, .68, .18, .68, glow);
  scene.add(root);
  return root;
}

/** Low route signs improve orientation while remaining outside the collision layout. */
export function addArenaWayfinding(scene: THREE.Object3D, mapId: string, details: WayfindingDetails) {
  const root = new THREE.Group();
  root.name = `${mapId}-wayfinding`;
  root.position.set(details.position[0], 0, details.position[1]);
  root.rotation.y = details.rotation ?? 0;
  const frame = new THREE.MeshStandardMaterial({ color: '#173449', roughness: .55, metalness: .55 });
  const sign = new THREE.MeshStandardMaterial({ color: details.color, emissive: details.color, emissiveIntensity: 1.1, roughness: .28, metalness: .18 });
  box(root, `${mapId}-route-post`, 0, 1.15, 0, .16, 2.3, .16, frame);
  box(root, `${mapId}-route-sign`, 0, 2.1, 0, 2.1, .58, .14, sign);
  box(root, `${mapId}-route-arrow`, .36, 2.1, .1, .52, .2, .06, frame).rotation.z = -Math.PI / 4;
  box(root, `${mapId}-route-foot`, 0, .08, 0, .9, .12, .5, frame);
  scene.add(root);
  return root;
}
