import * as THREE from 'three';

export function traceShot(origin: THREE.Vector3, direction: THREE.Vector3, range: number, obstacles: THREE.Object3D[], targets: THREE.Object3D[]) {
  for (const object of [...obstacles, ...targets]) object.updateWorldMatrix(true, true);
  const ray = new THREE.Raycaster(origin, direction.clone().normalize(), 0, range);
  const wall = ray.intersectObjects(obstacles, true)[0];
  const target = ray.intersectObjects(targets, true)[0];
  const hit = target && (!wall || target.distance < wall.distance) ? target : wall;
  return {
    point: hit?.point ?? origin.clone().addScaledVector(ray.ray.direction, range),
    impact: Boolean(hit),
    target: hit === target ? target : undefined,
  };
}
