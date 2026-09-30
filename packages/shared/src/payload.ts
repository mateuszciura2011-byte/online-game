export type PayloadState = 'ready' | 'planting' | 'planted' | 'defusing' | 'defused' | 'detonated';

export interface ObjectiveSnapshot {
  state: PayloadState;
  position: [number, number];
  actionEndsAt: number;
  actionPlayerId?: string;
  plantedEndsAt: number;
}

export interface ObjectiveAction { active: boolean; }

export function createPayloadObjective(position: [number, number]): ObjectiveSnapshot {
  return { state: 'ready', position, actionEndsAt: 0, actionPlayerId: undefined, plantedEndsAt: 0 };
}
