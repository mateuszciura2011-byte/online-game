export type KillEvent = { killerId: string; targetId: string };

export function localKillFeedback(kill: KillEvent, playerId?: string) {
  if (!playerId) return '';
  if (kill.killerId === playerId) return 'ELIMINACJA +1';
  if (kill.targetId === playerId) return 'ZGINĄŁEŚ — ODRODZENIE…';
  return '';
}

export function respawnFeedback(remainingMs: number) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return seconds ? `ODRODZENIE ZA ${seconds}…` : 'ODRODZENIE…';
}
