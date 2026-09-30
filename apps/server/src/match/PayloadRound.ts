import { createPayloadObjective, type ObjectiveSnapshot } from '@polystrike/shared/payload';

export type PayloadTeam = 'blue' | 'red';
export interface PayloadPlayer { id: string; team: PayloadTeam; alive: boolean; x: number; z: number; }

const ROUND_MS = 75_000;
const PLANT_MS = 2_500;
const DEFUSE_MS = 4_000;
const DETONATE_MS = 35_000;
const INTERACT_DISTANCE = 2.2;

export class PayloadRound {
  private readonly startedAt: number;
  private objective: ObjectiveSnapshot;
  private holding = new Set<string>();
  winner?: PayloadTeam;

  constructor(position: [number, number], startedAt: number) {
    this.startedAt = startedAt;
    this.objective = createPayloadObjective(position);
  }

  setHolding(playerId: string, active: boolean) {
    if (active) this.holding.add(playerId);
    else this.holding.delete(playerId);
  }

  tick(now: number, players: readonly PayloadPlayer[]) {
    if (this.winner) return;
    if (this.objective.state === 'planted' && now >= this.objective.plantedEndsAt) {
      this.objective = { ...this.objective, state: 'detonated' };
      this.winner = 'blue';
      return;
    }
    if (this.objective.state === 'ready' && now - this.startedAt >= ROUND_MS) {
      this.winner = 'red';
      return;
    }
    const actionPlayer = this.objective.actionPlayerId ? players.find((player) => player.id === this.objective.actionPlayerId) : undefined;
    if ((this.objective.state === 'planting' || this.objective.state === 'defusing') && (!actionPlayer || !this.holding.has(actionPlayer.id) || !this.canAct(actionPlayer))) {
      this.objective = { ...this.objective, state: this.objective.state === 'planting' ? 'ready' : 'planted', actionEndsAt: 0, actionPlayerId: undefined };
    }
    if (this.objective.state === 'planting' && now >= this.objective.actionEndsAt) {
      this.objective = { ...this.objective, state: 'planted', actionEndsAt: 0, actionPlayerId: undefined, plantedEndsAt: now + DETONATE_MS };
      return;
    }
    if (this.objective.state === 'defusing' && now >= this.objective.actionEndsAt) {
      this.objective = { ...this.objective, state: 'defused', actionEndsAt: 0, actionPlayerId: undefined };
      this.winner = 'red';
      return;
    }
    if (this.objective.state === 'ready') this.startAction(now, players, 'blue', 'planting', PLANT_MS);
    if (this.objective.state === 'planted') this.startAction(now, players, 'red', 'defusing', DEFUSE_MS);
  }

  snapshot(_now: number) { return { ...this.objective }; }

  private startAction(now: number, players: readonly PayloadPlayer[], team: PayloadTeam, state: 'planting' | 'defusing', duration: number) {
    const actor = players.find((player) => player.team === team && this.holding.has(player.id) && this.canAct(player));
    if (actor) this.objective = { ...this.objective, state, actionEndsAt: now + duration, actionPlayerId: actor.id };
  }

  private canAct(player: PayloadPlayer) {
    return player.alive && Math.hypot(player.x - this.objective.position[0], player.z - this.objective.position[1]) <= INTERACT_DISTANCE;
  }
}
