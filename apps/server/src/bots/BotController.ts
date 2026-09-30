import type { AabbCollider } from '../simulation/World.js';
import { nextWaypoint, pathClear } from './Navigation.js';

export interface BotPosition {
  x: number;
  z: number;
  yaw: number;
  lastShotAt?: number;
  reactionReadyAt?: number;
  team?: 'blue' | 'red';
}

export interface BotTarget {
  id: string;
  x: number;
  z: number;
  alive: boolean;
  team?: 'blue' | 'red';
}

export interface BotAction {
  moveX: number;
  moveZ: number;
  yaw: number;
  fire: boolean;
  targetId?: string;
}

const FIRING_RANGE = 8;
const SHOT_INTERVAL_MS = 550;

/** Finds the nearest living enemy, then chases or fires at it. */
export function chooseBotAction(bot: BotPosition, targets: BotTarget[], now = Date.now(), colliders: readonly AabbCollider[] = []): BotAction {
  const target = targets
    .filter((candidate) => candidate.alive && (!bot.team || candidate.team !== bot.team))
    .map((candidate) => ({ candidate, distance: Math.hypot(candidate.x - bot.x, candidate.z - bot.z), visible: pathClear(bot, candidate, colliders) }))
    .sort((left, right) => Number(right.visible) - Number(left.visible) || left.distance - right.distance)[0];

  if (!target) return { moveX: 0.35, moveZ: 0.45, yaw: bot.yaw + 0.35, fire: false };
  if (!target.visible || target.distance > FIRING_RANGE) {
    const waypoint = nextWaypoint(bot, target.candidate, colliders);
    return { moveX: 0, moveZ: waypoint ? 1 : 0, yaw: waypoint ? Math.atan2(bot.x - waypoint.x, bot.z - waypoint.z) : bot.yaw, fire: false, targetId: target.candidate.id };
  }
  const dx = target.candidate.x - bot.x;
  const dz = target.candidate.z - bot.z;
  return {
    moveX: target.distance <= FIRING_RANGE ? (Math.floor(now / 900) % 2 === 0 ? -0.65 : 0.65) : 0.25,
    moveZ: target.distance > FIRING_RANGE ? 1 : target.distance < 3 ? -0.45 : 0,
    yaw: Math.atan2(-dx, -dz),
    fire: target.distance <= FIRING_RANGE && now >= (bot.reactionReadyAt ?? -Infinity) && now - (bot.lastShotAt ?? -Infinity) >= SHOT_INTERVAL_MS,
    targetId: target.candidate.id,
  };
}
