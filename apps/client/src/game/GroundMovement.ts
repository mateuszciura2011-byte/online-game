export function groundMoveDelta(yaw: number, forward: number, side: number, speed: number, seconds: number) {
  const length = Math.hypot(forward, side) || 1;
  return {
    x: ((Math.cos(yaw) * side - Math.sin(yaw) * forward) / length) * speed * seconds,
    z: ((-Math.sin(yaw) * side - Math.cos(yaw) * forward) / length) * speed * seconds
  };
}

export function clampTrainingPosition(position: { x: number; y: number; z: number }) {
  return {
    x: Math.max(-getMapDefinition('depot').arenaLimit, Math.min(getMapDefinition('depot').arenaLimit, position.x)),
    y: Math.max(1.7, position.y),
    z: Math.max(-getMapDefinition('depot').arenaLimit, Math.min(getMapDefinition('depot').arenaLimit, position.z))
  };
}

type CameraPosition = { x: number; y: number; z: number };
type Collider = { minX: number; maxX: number; minZ: number; maxZ: number };

const box = (x: number, z: number, width: number, depth: number): Collider => ({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
const isInsideArena = (position: CameraPosition, arenaLimit: number) => Math.abs(position.x) <= arenaLimit && Math.abs(position.z) <= arenaLimit;

function crossesWall(from: CameraPosition, to: CameraPosition, wall: Collider) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(to.x - from.x), Math.abs(to.z - from.z)) / .08));
  const radius = 1.1;
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = from.x + (to.x - from.x) * ratio;
    const z = from.z + (to.z - from.z) * ratio;
    if (x >= wall.minX - radius && x <= wall.maxX + radius && z >= wall.minZ - radius && z <= wall.maxZ + radius) return true;
  }
  return false;
}

export function resolveCameraCollision(from: CameraPosition, to: CameraPosition, mapId: string): CameraPosition {
  const map = getMapDefinition(mapId);
  const walls = map.colliders;
  const clear = (candidate: CameraPosition) => isInsideArena(candidate, map.arenaLimit) && !walls.some((wall) => crossesWall(from, candidate, wall));
  if (clear(to)) return to;
  const slideZ = { x: from.x, y: to.y, z: to.z };
  if (clear(slideZ)) return slideZ;
  const slideX = { x: to.x, y: to.y, z: from.z };
  return clear(slideX) ? slideX : from;
}
import { getMapDefinition } from '@polystrike/shared/maps';
