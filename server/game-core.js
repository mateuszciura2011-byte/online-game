export const MAX_PLAYERS = 10;
const ARENA_LIMIT = 22;
const WALK_SPEED = 5;
const SPRINT_SPEED = 7;
const RESPAWN_SECONDS = 3;
const PISTOL_DAMAGE = 25;

const SPAWNS = [
  [-15, -15], [15, -15], [-15, 15], [15, 15],
  [0, -18], [0, 18], [-18, 0], [18, 0],
];

export class ArenaGame {
  constructor({ random = Math.random, scoreLimit = 15 } = {}) {
    this.random = random;
    this.scoreLimit = scoreLimit;
    this.players = new Map();
    this.events = [];
    this.winnerId = null;
  }

  addPlayer(id, name, isBot = false, team) {
    if (this.players.size >= MAX_PLAYERS) return { ok: false, reason: 'room_full' };
    const [x, z] = this.spawnPoint();
    this.players.set(id, {
      id, name: name.slice(0, 16), isBot, team,
      x, y: 1.6, z, yaw: 0, pitch: 0,
      health: 100, alive: true, kills: 0, deaths: 0,
      respawnAt: 0, input: { moveX: 0, moveZ: 0, yaw: 0, pitch: 0, sprint: false },
    });
    return { ok: true };
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  setInput(id, input) {
    const player = this.players.get(id);
    if (!player || !player.alive) return;
    player.input = {
      moveX: clamp(Number(input.moveX) || 0, -1, 1),
      moveZ: clamp(Number(input.moveZ) || 0, -1, 1),
      yaw: Number(input.yaw) || 0,
      pitch: clamp(Number(input.pitch) || 0, -1.35, 1.35),
      sprint: Boolean(input.sprint),
    };
  }

  step(deltaSeconds) {
    for (const player of this.players.values()) {
      if (!player.alive) {
        player.respawnAt -= deltaSeconds;
        if (player.respawnAt <= 0) this.respawn(player);
        continue;
      }
      const { moveX, moveZ, yaw, pitch, sprint } = player.input;
      player.yaw = yaw;
      player.pitch = pitch;
      const length = Math.hypot(moveX, moveZ);
      if (length > 0) {
        const speed = sprint ? SPRINT_SPEED : WALK_SPEED;
        const forwardX = Math.sin(yaw);
        const forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw);
        const rightZ = Math.sin(yaw);
        player.x = clamp(player.x + ((forwardX * moveZ) + (rightX * moveX)) / length * speed * deltaSeconds, -ARENA_LIMIT, ARENA_LIMIT);
        player.z = clamp(player.z + ((forwardZ * moveZ) + (rightZ * moveX)) / length * speed * deltaSeconds, -ARENA_LIMIT, ARENA_LIMIT);
      }
    }
  }

  fire(id) {
    const shooter = this.players.get(id);
    if (!shooter || !shooter.alive) return { ok: false };
    const forwardX = Math.sin(shooter.yaw);
    const forwardZ = -Math.cos(shooter.yaw);
    let bestTarget;
    let bestDistance = Infinity;
    for (const target of this.players.values()) {
      if (!target.alive || target.id === shooter.id) continue;
      const dx = target.x - shooter.x;
      const dz = target.z - shooter.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 35 || distance === 0) continue;
      const aim = (dx / distance) * forwardX + (dz / distance) * forwardZ;
      if (aim > 0.96 && distance < bestDistance) {
        bestTarget = target;
        bestDistance = distance;
      }
    }
    if (!bestTarget) return { ok: true, hit: false };
    bestTarget.health = Math.max(0, bestTarget.health - PISTOL_DAMAGE);
    this.events.push({ type: 'hit', attackerId: shooter.id, targetId: bestTarget.id, damage: PISTOL_DAMAGE });
    if (bestTarget.health === 0) {
      bestTarget.alive = false;
      bestTarget.deaths += 1;
      bestTarget.respawnAt = RESPAWN_SECONDS;
      shooter.kills += 1;
      this.events.push({ type: 'kill', attackerId: shooter.id, targetId: bestTarget.id });
      if (shooter.kills >= this.scoreLimit) this.winnerId = shooter.id;
    }
    return { ok: true, hit: true, targetId: bestTarget.id };
  }

  snapshot() {
    return [...this.players.values()].map(({ input, respawnAt, ...player }) => ({ ...player, respawnSeconds: Math.max(0, Math.ceil(respawnAt)) }));
  }

  spawnPoint() {
    return SPAWNS[Math.floor(this.random() * SPAWNS.length)];
  }

  respawn(player) {
    const [x, z] = this.spawnPoint();
    player.x = x;
    player.z = z;
    player.yaw = 0;
    player.pitch = 0;
    player.health = 100;
    player.alive = true;
    player.respawnAt = 0;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
