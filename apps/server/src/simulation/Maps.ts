import type { AabbCollider } from './World.js';
import { getMapDefinition } from '@polystrike/shared/maps';

export function mapColliders(mapId: string): AabbCollider[] {
  return [...getMapDefinition(mapId).colliders];
}
