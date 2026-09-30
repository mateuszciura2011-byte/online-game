import { MOVEMENT } from '@polystrike/shared/config/movement';

export type JumpState = { height: number; velocity: number; grounded: boolean };

export function shouldSnapToSpawn(previousPhase: string, nextPhase: string) {
  return previousPhase === 'lobby' && nextPhase === 'countdown';
}

export function consumeQueuedJump(queued: boolean, canMove: boolean) {
  return { jump: queued && canMove, queued: false };
}

export function advanceJump(state: JumpState, requested: boolean, deltaSeconds: number): JumpState {
  let velocity = state.velocity;
  let grounded = state.grounded;
  if (requested && grounded) { velocity = MOVEMENT.jumpSpeed; grounded = false; }
  velocity -= MOVEMENT.gravity * deltaSeconds;
  const height = state.height + velocity * deltaSeconds;
  return height <= 0 ? { height: 0, velocity: 0, grounded: true } : { height, velocity, grounded };
}
