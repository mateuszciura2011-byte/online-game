import type { WeaponId } from '@polystrike/shared/weapons';
import type { AabbCollider } from '../simulation/World.js';

type ShotOrigin = { x: number; z: number };
type ShotCandidate = { id: string; x: number; z: number };
type ShotRequest = { origin: [number, number, number]; direction: [number, number, number] };

const range: Record<WeaponId, number> = { knife: 2, pistol: 32, smg: 28, rifle: 46, sniper: 90, shotgun: 14 };
const cone: Record<WeaponId, number> = { knife: .78, pistol: .18, smg: .22, rifle: .12, sniper: .055, shotgun: .42 };

function segmentHitsCollider(from: ShotOrigin, to: ShotOrigin, collider: AabbCollider) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / .1));
  for (let step = 1; step < steps; step += 1) {
    const ratio = step / steps;
    const x = from.x + (to.x - from.x) * ratio;
    const z = from.z + (to.z - from.z) * ratio;
    if (x >= collider.minX && x <= collider.maxX && z >= collider.minZ && z <= collider.maxZ) return true;
  }
  return false;
}

export function selectShotTarget(shooter: ShotOrigin, candidates: readonly ShotCandidate[], request: ShotRequest, colliders: readonly AabbCollider[], weaponId: WeaponId) {
  const length = Math.hypot(request.direction[0], request.direction[2]);
  if (!length) return undefined;
  const direction = { x: request.direction[0] / length, z: request.direction[2] / length };
  return candidates
    .map((candidate) => ({ candidate, dx: candidate.x - shooter.x, dz: candidate.z - shooter.z }))
    .map((entry) => ({ ...entry, distance: Math.hypot(entry.dx, entry.dz) }))
    .filter((entry) => entry.distance > 0 && entry.distance <= range[weaponId])
    .filter((entry) => (entry.dx * direction.x + entry.dz * direction.z) / entry.distance >= Math.cos(cone[weaponId]))
    .filter((entry) => !colliders.some((collider) => segmentHitsCollider(shooter, entry.candidate, collider)))
    .sort((left, right) => left.distance - right.distance)[0]?.candidate;
}
