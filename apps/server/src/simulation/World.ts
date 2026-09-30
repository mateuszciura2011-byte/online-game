import { MOVEMENT, moveToward } from '@polystrike/shared/config/movement';
import type { PlayerInput } from '@polystrike/shared/protocol';

export interface PlayerKinematicState { x: number; y: number; z: number; verticalVelocity: number; grounded: boolean; horizontalVelocityX?: number; horizontalVelocityZ?: number; }
export interface AabbCollider { minX: number; maxX: number; minZ: number; maxZ: number; }
export const playerRadius = 1.1;

function crossesCollider(from: PlayerKinematicState, to: PlayerKinematicState, wall: AabbCollider) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(to.x - from.x), Math.abs(to.z - from.z)) / .1));
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = from.x + (to.x - from.x) * ratio;
    const z = from.z + (to.z - from.z) * ratio;
    if (x >= wall.minX - playerRadius && x <= wall.maxX + playerRadius && z >= wall.minZ - playerRadius && z <= wall.maxZ + playerRadius) return true;
  }
  return false;
}

export function simulatePlayer(state: PlayerKinematicState, input: PlayerInput, deltaSeconds: number, colliders: readonly AabbCollider[]): PlayerKinematicState {
  const speed = input.sprint ? MOVEMENT.sprintSpeed : MOVEMENT.walkSpeed;
  const length = Math.hypot(input.moveX, input.moveZ) || 1;
  const next = { ...state };
  const targetVelocityX = ((Math.cos(input.yaw) * input.moveX - Math.sin(input.yaw) * input.moveZ) / length) * speed;
  const targetVelocityZ = ((-Math.sin(input.yaw) * input.moveX - Math.cos(input.yaw) * input.moveZ) / length) * speed;
  const hasMovement = input.moveX !== 0 || input.moveZ !== 0;
  const maximumChange = (hasMovement ? MOVEMENT.acceleration : MOVEMENT.braking) * deltaSeconds;
  next.horizontalVelocityX = moveToward(state.horizontalVelocityX ?? 0, targetVelocityX, maximumChange);
  next.horizontalVelocityZ = moveToward(state.horizontalVelocityZ ?? 0, targetVelocityZ, maximumChange);
  next.x += next.horizontalVelocityX * deltaSeconds;
  next.z += next.horizontalVelocityZ * deltaSeconds;
  if (input.jump && next.grounded) { next.verticalVelocity = MOVEMENT.jumpSpeed; next.grounded = false; }
  next.verticalVelocity -= MOVEMENT.gravity * deltaSeconds; next.y += next.verticalVelocity * deltaSeconds;
  if (next.y <= 0) { next.y = 0; next.verticalVelocity = 0; next.grounded = true; }
  const collides = (candidate: PlayerKinematicState) => colliders.some((wall) => crossesCollider(state, candidate, wall));
  if (collides(next)) {
    const slideZ = { ...next, x: state.x, horizontalVelocityX: 0 };
    if (!collides(slideZ) && slideZ.z !== state.z) return slideZ;
    const slideX = { ...next, z: state.z, horizontalVelocityZ: 0 };
    if (!collides(slideX) && slideX.x !== state.x) return slideX;
    return { ...next, x: state.x, z: state.z, horizontalVelocityX: 0, horizontalVelocityZ: 0 };
  }
  return next;
}
