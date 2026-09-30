type Position = { x: number; z: number };

export function damageIndicatorAngle(cameraYaw: number, recipient: Position, attacker: Position) {
  const dx = attacker.x - recipient.x;
  const dz = attacker.z - recipient.z;
  if (Math.hypot(dx, dz) < .01) return 0;
  const relative = Math.atan2(dx, -dz) - cameraYaw;
  const normalized = Math.atan2(Math.sin(relative), Math.cos(relative));
  return normalized * 180 / Math.PI;
}
