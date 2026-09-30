import type { ObjectiveSnapshot } from '@polystrike/shared/payload';

export function payloadInstruction(team: 'blue' | 'red' | undefined, objective: Pick<ObjectiveSnapshot, 'state' | 'actionPlayerId'>, playerId?: string) {
  if (objective.actionPlayerId === playerId && objective.state === 'planting') return 'PODKŁADANIE ŁADUNKU…';
  if (objective.actionPlayerId === playerId && objective.state === 'defusing') return 'ROZBRAJANIE ŁADUNKU…';
  if (team === 'blue' && objective.state === 'ready') return 'PRZYTRZYMAJ E, ABY PODŁOŻYĆ ŁADUNEK';
  if (team === 'red' && objective.state === 'planted') return 'PRZYTRZYMAJ E, ABY ROZBROIĆ ŁADUNEK';
  if (objective.state === 'planted') return 'ŁADUNEK PODŁOŻONY — BROŃ STREFY';
  return team === 'blue' ? 'ATAKUJ — DOSTARCZ ŁADUNEK' : 'BROŃ — ZATRZYMAJ ATAK';
}

export function payloadActionProgress(objective: Pick<ObjectiveSnapshot, 'state' | 'actionEndsAt'>, now: number) {
  const duration = objective.state === 'planting' ? 2_500 : objective.state === 'defusing' ? 4_000 : 0;
  if (!duration || !objective.actionEndsAt) return '';
  const percent = Math.max(0, Math.min(100, Math.round((1 - (objective.actionEndsAt - now) / duration) * 100)));
  return `${objective.state === 'planting' ? 'PODKŁADANIE' : 'ROZBRAJANIE'}: ${percent}%`;
}
