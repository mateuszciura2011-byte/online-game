import { WEAPONS } from '@polystrike/shared/weapons';
import type { FireRequest, PlayerInput } from '@polystrike/shared/protocol';
import type { ObjectiveAction } from '@polystrike/shared/payload';

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const finiteVector = (value: unknown): value is [number, number, number] => Array.isArray(value) && value.length === 3 && value.every(finite);

export function isValidPlayerInput(value: unknown): value is PlayerInput {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<PlayerInput>;
  const sequence = input.sequence;
  return typeof sequence === 'number' && Number.isSafeInteger(sequence) && sequence >= 0 && finite(input.clientTime) && finite(input.moveX) && Math.abs(input.moveX) <= 1 && finite(input.moveZ) && Math.abs(input.moveZ) <= 1 && finite(input.yaw) && finite(input.pitch) && typeof input.jump === 'boolean' && typeof input.sprint === 'boolean';
}

export function isValidFireRequest(value: unknown): value is FireRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<FireRequest>;
  const sequence = request.sequence;
  return typeof sequence === 'number' && Number.isSafeInteger(sequence) && sequence >= 0 && finite(request.clientTime) && typeof request.weaponId === 'string' && request.weaponId in WEAPONS && finiteVector(request.origin) && finiteVector(request.direction);
}

export function isValidPing(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= 20; }
export function isValidObjectiveAction(value: unknown): value is ObjectiveAction { return Boolean(value) && typeof value === 'object' && typeof (value as { active?: unknown }).active === 'boolean'; }
