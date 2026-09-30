export interface SpawnPoint { x: number; z: number; team?: 'blue' | 'red'; }
export interface AlivePlayer { x: number; z: number; team?: 'blue' | 'red'; alive: boolean; }
export function selectSafeSpawn(team: 'blue' | 'red' | undefined, players: readonly AlivePlayer[], candidates: readonly SpawnPoint[]) {
  const available = candidates.filter(spawn => (!team || spawn.team === team) && !players.some(player => player.alive && Math.hypot(player.x - spawn.x, player.z - spawn.z) < 1.2));
  return available.sort((a, b) => nearest(b, players, team) - nearest(a, players, team))[0];
}
function nearest(point: SpawnPoint, players: readonly AlivePlayer[], team?: 'blue' | 'red') { const enemies = players.filter((player) => player.alive && (!team || player.team !== team)); return enemies.length ? Math.min(...enemies.map((player) => Math.hypot(point.x - player.x, point.z - player.z))) : Infinity; }
