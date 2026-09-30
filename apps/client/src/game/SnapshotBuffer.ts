export interface PlayerSnapshot { serverTime: number; position: [number, number, number]; yaw: number; pitch: number; alive: boolean; health?: number; continuityKey?: string; }
export function sampleSnapshot(snapshots: readonly PlayerSnapshot[], renderTime: number): PlayerSnapshot | undefined {
  if (!snapshots.length) return undefined;
  const next = snapshots.find(snapshot => snapshot.serverTime >= renderTime) ?? snapshots[snapshots.length - 1];
  const previous = [...snapshots].reverse().find(snapshot => snapshot.serverTime <= renderTime) ?? snapshots[0];
  if (previous === next || previous.serverTime === next.serverTime) return previous;
  // A spawn or round transition is a discontinuity, not movement across the arena.
  if (previous.alive !== next.alive || previous.continuityKey !== next.continuityKey) return previous;
  const alpha = (renderTime - previous.serverTime) / (next.serverTime - previous.serverTime);
  return {
    serverTime: renderTime,
    position: previous.position.map((value, index) => value + (next.position[index] - value) * alpha) as [number, number, number],
    yaw: previous.yaw + Math.atan2(Math.sin(next.yaw - previous.yaw), Math.cos(next.yaw - previous.yaw)) * alpha,
    pitch: previous.pitch + (next.pitch - previous.pitch) * alpha,
    alive: previous.alive,
    health: previous.health,
    continuityKey: previous.continuityKey
  };
}
