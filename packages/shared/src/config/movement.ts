export const MOVEMENT = {
  walkSpeed: 5.4,
  sprintSpeed: 9,
  acceleration: 20,
  braking: 24,
  jumpSpeed: 6,
  gravity: 18
} as const;

export function moveToward(current: number, target: number, maximumChange: number) {
  if (current < target) return Math.min(current + maximumChange, target);
  return Math.max(current - maximumChange, target);
}
