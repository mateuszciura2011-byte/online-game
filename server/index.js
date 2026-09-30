import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { ArenaGame, MAX_PLAYERS } from './game-core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
let game = createGame();
let nextBotTick = 0;
let resetAt = 0;

app.use(express.static(publicDir));
app.get('/vendor/three.module.js', (_request, response) => {
  response.sendFile(path.join(rootDir, 'node_modules', 'three', 'build', 'three.module.js'));
});
app.use((_request, response) => response.sendFile(path.join(publicDir, 'index.html')));

io.on('connection', (socket) => {
  makeRoomForHuman();
  const joined = game.addPlayer(socket.id, `Gracz-${game.players.size + 1}`);
  if (!joined.ok) {
    socket.emit('room_error', 'Serwer jest pełny. Spróbuj ponownie za chwilę.');
    socket.disconnect();
    return;
  }

  socket.emit('welcome', { id: socket.id, message: 'Witaj na arenie PolyStrike.' });
  socket.on('join', ({ name } = {}) => {
    const player = game.players.get(socket.id);
    if (player && typeof name === 'string') player.name = cleanName(name);
  });
  socket.on('input', (input) => game.setInput(socket.id, input ?? {}));
  socket.on('fire', () => {
    if (!game.winnerId) game.fire(socket.id);
  });
  socket.on('disconnect', () => game.removePlayer(socket.id));
});

setInterval(() => {
  const now = Date.now();
  if (!game.winnerId) {
    updateBots(now);
    game.step(1 / 20);
  } else if (!resetAt) {
    resetAt = now + 6000;
  } else if (now >= resetAt) {
    const connectedPlayers = [...io.sockets.sockets.keys()];
    game = createGame();
    for (const id of connectedPlayers) game.addPlayer(id, `Gracz-${game.players.size + 1}`);
    resetAt = 0;
  }
  io.emit('state', { players: game.snapshot(), winnerId: game.winnerId, scoreLimit: game.scoreLimit });
}, 50);

function createGame() {
  const next = new ArenaGame({ scoreLimit: 15 });
  for (let index = 1; index <= 3; index += 1) next.addPlayer(`bot-${index}`, `BOT-${index}`, true);
  return next;
}

function makeRoomForHuman() {
  if (game.players.size < MAX_PLAYERS) return;
  const bot = [...game.players.values()].find((player) => player.isBot);
  if (bot) game.removePlayer(bot.id);
}

function updateBots(now) {
  if (now - nextBotTick < 180) return;
  nextBotTick = now;
  const humans = [...game.players.values()].filter((player) => !player.isBot && player.alive);
  for (const bot of game.players.values()) {
    if (!bot.isBot || !bot.alive) continue;
    const target = humans.sort((left, right) => distance(bot, left) - distance(bot, right))[0];
    if (!target) {
      game.setInput(bot.id, { moveX: 0, moveZ: 0, yaw: bot.yaw + 0.3, pitch: 0, sprint: false });
      continue;
    }
    const dx = target.x - bot.x;
    const dz = target.z - bot.z;
    const range = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, -dz);
    game.setInput(bot.id, { moveX: 0, moveZ: range > 8 ? 1 : 0, yaw, pitch: 0, sprint: range > 14 });
    if (range < 20) game.fire(bot.id);
  }
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function cleanName(value) {
  const name = value.replace(/[<>]/g, '').trim();
  return name.slice(0, 16) || 'Gracz';
}

const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => console.log(`PolyStrike działa na http://localhost:${port}`));
