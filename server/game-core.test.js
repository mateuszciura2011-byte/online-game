import test from 'node:test';
import assert from 'node:assert/strict';
import { ArenaGame, MAX_PLAYERS } from './game-core.js';

test('limits a room to ten players', () => {
  const game = new ArenaGame({ random: () => 0.5 });
  for (let index = 0; index < MAX_PLAYERS; index += 1) {
    assert.equal(game.addPlayer(`player-${index}`, `P${index}`).ok, true);
  }
  assert.equal(game.addPlayer('overflow', 'Overflow').ok, false);
});

test('keeps movement inside the arena walls', () => {
  const game = new ArenaGame({ random: () => 0.5 });
  game.addPlayer('player', 'Player');
  game.setInput('player', { moveX: 1, moveZ: 0, yaw: 0, pitch: 0, sprint: false });

  for (let tick = 0; tick < 300; tick += 1) game.step(1 / 20);

  const player = game.players.get('player');
  assert.ok(player.x <= 22);
  assert.ok(player.x >= -22);
});

test('awards a kill and respawns the target after three seconds', () => {
  const game = new ArenaGame({ random: () => 0.5 });
  game.addPlayer('shooter', 'Shooter');
  game.addPlayer('target', 'Target');
  const shooter = game.players.get('shooter');
  const target = game.players.get('target');
  shooter.x = 0; shooter.z = 0; shooter.yaw = 0;
  target.x = 0; target.z = -4;

  game.fire('shooter');
  game.fire('shooter');
  game.fire('shooter');
  game.fire('shooter');

  assert.equal(target.alive, false);
  assert.equal(shooter.kills, 1);

  for (let tick = 0; tick < 61; tick += 1) game.step(1 / 20);
  assert.equal(target.alive, true);
  assert.equal(target.health, 100);
});

test('ends a prototype match when a player reaches the score limit', () => {
  const game = new ArenaGame({ random: () => 0.5, scoreLimit: 2 });
  game.addPlayer('shooter', 'Shooter');
  game.addPlayer('target', 'Target');
  const shooter = game.players.get('shooter');
  const target = game.players.get('target');
  shooter.kills = 1;
  shooter.x = 0; shooter.z = 0; shooter.yaw = 0;
  target.x = 0; target.z = -4;

  for (let shot = 0; shot < 4; shot += 1) game.fire('shooter');

  assert.equal(game.winnerId, 'shooter');
});
