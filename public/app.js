import * as THREE from '/vendor/three.module.js';

const socket = window.io();
const canvas = document.querySelector('#game');
const menu = document.querySelector('#menu');
const playButton = document.querySelector('#play');
const nameInput = document.querySelector('#name');
const hud = document.querySelector('#hud');
const healthLabel = document.querySelector('#health');
const scoreboard = document.querySelector('#scoreboard');
const result = document.querySelector('#result');
const resultLabel = document.querySelector('#result-label');
const hint = document.querySelector('#hint');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#091a2b');
scene.fog = new THREE.Fog('#091a2b', 25, 90);
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 120);
camera.rotation.order = 'YXZ';
scene.add(camera);
const clock = new THREE.Clock();
const keys = new Set();
const remotes = new Map();
let playerId = '';
let gameStarted = false;
let winnerShown = false;

buildArena();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

playButton.addEventListener('click', () => {
  gameStarted = true;
  winnerShown = false;
  socket.emit('join', { name: nameInput.value });
  menu.classList.add('hidden');
  result.classList.add('hidden');
  hud.classList.remove('hidden');
  canvas.requestPointerLock();
});
document.querySelector('#again').addEventListener('click', () => window.location.reload());
canvas.addEventListener('click', () => { if (gameStarted) canvas.requestPointerLock(); });
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== canvas || !gameStarted) return;
  camera.rotation.y -= event.movementX * 0.0024;
  camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - event.movementY * 0.0024, -1.25, 1.25);
});
window.addEventListener('keydown', (event) => keys.add(event.code));
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('mousedown', (event) => {
  if (event.button === 0 && gameStarted && document.pointerLockElement === canvas) socket.emit('fire');
});

socket.on('welcome', ({ id, message }) => {
  playerId = id;
  hint.textContent = message;
});
socket.on('room_error', (message) => { hint.textContent = message; menu.classList.remove('hidden'); });
socket.on('state', ({ players, winnerId, scoreLimit }) => {
  updateWorld(players);
  updateScoreboard(players, scoreLimit);
  const self = players.find((player) => player.id === playerId);
  if (self) healthLabel.textContent = self.alive ? self.health : `RESPAWN ${self.respawnSeconds}`;
  if (winnerId && !winnerShown) {
    winnerShown = true;
    resultLabel.textContent = winnerId === playerId ? 'VICTORY' : 'DEFEAT';
    resultLabel.style.color = winnerId === playerId ? '#29d6ff' : '#ff6b88';
    result.classList.remove('hidden');
    document.exitPointerLock();
  }
});

setInterval(() => {
  if (!gameStarted || !playerId || winnerShown) return;
  socket.emit('input', {
    moveX: (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0),
    moveZ: (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0),
    yaw: camera.rotation.y,
    pitch: camera.rotation.x,
    sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'),
  });
}, 50);

function buildArena() {
  scene.add(new THREE.HemisphereLight('#a6d8ff', '#05101a', 2));
  const sun = new THREE.DirectionalLight('#bceaff', 2.6);
  sun.position.set(12, 22, 8); sun.castShadow = true; scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), new THREE.MeshStandardMaterial({ color: '#132b3d', roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(50, 25, '#296080', '#173b52'); grid.position.y = 0.01; scene.add(grid);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#1b4058', roughness: 0.7 });
  const coverMaterial = new THREE.MeshStandardMaterial({ color: '#ef9b3d', roughness: 0.6 });
  const walls = [ [0, 3, -25, 50, 6, 1], [0, 3, 25, 50, 6, 1], [-25, 3, 0, 1, 6, 50], [25, 3, 0, 1, 6, 50] ];
  const covers = [ [-10, 1.5, -7, 4, 3, 2], [10, 1.5, 7, 4, 3, 2], [-7, 1.5, 10, 2, 3, 4], [7, 1.5, -10, 2, 3, 4], [0, 2.5, 0, 5, 5, 5] ];
  for (const [x, y, z, width, height, depth] of walls) addBox(x, y, z, width, height, depth, wallMaterial);
  for (const [x, y, z, width, height, depth] of covers) addBox(x, y, z, width, height, depth, coverMaterial);
  for (const [x, z, color] of [[-20, -20, '#29d6ff'], [20, 20, '#ff4673'], [-20, 20, '#ffe05b'], [20, -20, '#7affb0']]) {
    const light = new THREE.PointLight(color, 18, 15); light.position.set(x, 6, z); scene.add(light);
  }
}

function addBox(x, y, z, width, height, depth, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
}

function updateWorld(players) {
  const known = new Set();
  for (const player of players) {
    if (player.id === playerId) {
      camera.position.set(player.x, player.y, player.z);
      continue;
    }
    known.add(player.id);
    let mesh = remotes.get(player.id);
    if (!mesh) {
      mesh = createPlayerMesh(player.isBot); remotes.set(player.id, mesh); scene.add(mesh);
    }
    mesh.visible = player.alive;
    mesh.position.lerp(new THREE.Vector3(player.x, 0, player.z), 0.45);
    mesh.rotation.y = player.yaw;
  }
  for (const [id, mesh] of remotes) if (!known.has(id)) { scene.remove(mesh); remotes.delete(id); }
}

function createPlayerMesh(isBot) {
  const group = new THREE.Group();
  const color = isBot ? '#ff5d7e' : '#38d9ff';
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.6, 1.5, 6), new THREE.MeshStandardMaterial({ color }));
  body.position.y = 0.85; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), new THREE.MeshStandardMaterial({ color: '#f4d3bf' }));
  head.position.y = 1.95; head.castShadow = true;
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.85), new THREE.MeshStandardMaterial({ color: '#222a35' }));
  gun.position.set(0.28, 1.35, -0.45);
  group.add(body, head, gun);
  return group;
}

function updateScoreboard(players, scoreLimit) {
  const rows = [...players].sort((a, b) => b.kills - a.kills).slice(0, 6).map((player) => {
    const classes = `${player.id === playerId ? 'self' : ''} ${player.isBot ? 'bot' : ''}`;
    return `<div class="${classes}">${escapeHtml(player.name)} <b>${player.kills}</b></div>`;
  }).join('');
  scoreboard.innerHTML = `<div class="score-title">FFA · PIERWSZY DO ${scoreLimit}</div>${rows}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
}

function render() {
  const delta = clock.getDelta();
  if (gameStarted && !winnerShown) camera.position.y += Math.sin(performance.now() * 0.008) * 0.0003 * delta;
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
