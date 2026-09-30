import { playerRadius, type AabbCollider } from '../simulation/World.js';

type Point = { x: number; z: number };

/** Segment/AABB clipping, including thin walls that sampled rays can miss. */
export function pathClear(from: Point, to: Point, walls: readonly AabbCollider[], padding = 0): boolean {
  return !walls.some((wall) => {
    let entry = 0, exit = 1;
    for (const [origin, delta, min, max] of [
      [from.x, to.x - from.x, wall.minX - padding, wall.maxX + padding],
      [from.z, to.z - from.z, wall.minZ - padding, wall.maxZ + padding],
    ]) {
      if (Math.abs(delta) < 1e-9) { if (origin < min || origin > max) return false; }
      else {
        const a = (min - origin) / delta, b = (max - origin) / delta;
        entry = Math.max(entry, Math.min(a, b)); exit = Math.min(exit, Math.max(a, b));
        if (entry > exit) return false;
      }
    }
    return true;
  });
}

/** Shortest collision-safe route over the corners of arena cover. */
export function nextWaypoint(from: Point, to: Point, walls: readonly AabbCollider[]): Point | undefined {
  const clearance = playerRadius;
  if (pathClear(from, to, walls, clearance)) return to;
  const corners = walls.flatMap((wall) => [
    { x: wall.minX - 1.3, z: wall.minZ - 1.3 }, { x: wall.maxX + 1.3, z: wall.minZ - 1.3 },
    { x: wall.minX - 1.3, z: wall.maxZ + 1.3 }, { x: wall.maxX + 1.3, z: wall.maxZ + 1.3 },
  ]).filter((point) => pathClear(point, point, walls, clearance));
  const nodes = [from, to, ...corners];
  const distances = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
  distances[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || distances[i] < distances[current])) current = i;
    if (current < 0 || !Number.isFinite(distances[current])) return undefined;
    if (current === 1) {
      while (previous[current] > 0) current = previous[current];
      return nodes[current];
    }
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || !pathClear(nodes[current], nodes[i], walls, clearance)) continue;
      const distance = distances[current] + Math.hypot(nodes[i].x - nodes[current].x, nodes[i].z - nodes[current].z);
      if (distance < distances[i]) { distances[i] = distance; previous[i] = current; }
    }
  }
  return undefined;
}
