import * as THREE from 'three';
import { GAME_MODES, type GameMode } from '@polystrike/shared/protocol';
import { modePicker, bindModePickers } from './ui/GameModes.js';
import { RoomConnection } from './net/RoomConnection.js';
import { WeaponView, weaponHudText } from './game/WeaponView.js';
import { LoadoutSync } from './game/LoadoutSync.js';
import { RemotePlayers } from './game/RemotePlayers.js';
import { aimSensitivity, loadSettings, saveSettings } from './ui/Settings.js';
import {applyRenderQuality,qualityDescription} from './ui/RenderQuality.js';
import {mountMapCards} from './ui/MapCards.js';
import { formatCountdown, formatLobbySummary } from './ui/Lobby.js';
import { ProfileApi } from './net/ProfileApi.js';
import { buildDepot } from './maps/Depot.js';
import { buildCrossroads } from './maps/Crossroads.js';
import { buildFoundry } from './maps/Foundry.js';
import { buildAlleyways } from './maps/Alleyways.js';
import { buildCitadel } from './maps/Citadel.js';
import { buildCanal } from './maps/Canal.js';
import { AudioDirector } from './audio/AudioDirector.js';
import { settingsPanel } from './ui/SettingsPanel.js';
import { skinPreview } from './ui/SkinPreview.js';
import { addCoverDetails } from './maps/CoverDetails.js';
import { didWin, formatHitFeedback, formatKillFeed, formatMatchScore, messageTone, minimapPoint, resultCopy } from './ui/Hud.js';
import { reconcilePosition } from './game/ServerReconciliation.js';
import { TrainingMode } from './training/TrainingMode.js';
import { formatProfileStats } from './ui/ProfileStats.js';
import { formatBuyCash, formatBuyPhase, syncBuyPhaseEnd } from './ui/BuyPhase.js';
import { ArenaAtmosphere } from './vfx/ArenaAtmosphere.js';
import { ArenaDressings } from './vfx/ArenaDressings.js';
import { CombatVfx } from './vfx/CombatVfx.js';
import { GameSession } from './game/GameSession.js';
import { clampTrainingPosition, groundMoveDelta, resolveCameraCollision } from './game/GroundMovement.js';
import { FirstPersonWeapon } from './game/FirstPersonWeapon.js';
import { MenuPanelFocus } from './ui/MenuPanelFocus.js';
import { createTrainingTarget } from './training/TrainingTarget.js';
import { MOVEMENT, moveToward } from '@polystrike/shared/config/movement';
import { BUY_PRICES, WEAPONS } from '@polystrike/shared/weapons';
import { FireControl } from './game/FireControl.js';
import { traceShot } from './game/ShotTrace.js';
import { getMapDefinition } from '@polystrike/shared/maps';
import { PointerControls } from './input/PointerControls.js';
import { formatHud, shouldClearHudMessage } from './ui/HudView.js';
import { crosshairScale, recoilKick } from './ui/CombatFeedback.js';
import { MenuView } from './ui/MenuView.js';
import { GameApp } from './app/GameApp.js';
import { weaponPreview } from './ui/WeaponPreview.js';
import { applyArenaPresentation } from './maps/ArenaPresentation.js';
import { disposeMap } from './maps/MapResources.js';
import { configureMapShadows } from './maps/MapShadows.js';
import { combatStatus as formatCombatStatus } from './ui/CombatStatus.js';
import { scoreboardMarkup } from './ui/Scoreboard.js';
import { payloadActionProgress, payloadInstruction } from './ui/PayloadHud.js';
import { localKillFeedback } from './ui/MatchFeedback.js';
import { damageIndicatorAngle } from './ui/DamageIndicator.js';
import { advanceJump, consumeQueuedJump, shouldSnapToSpawn } from './game/PlayerMotion.js';
const scene = new THREE.Scene();
scene.background = new THREE.Color('#07101c');
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const pointerControls = new PointerControls();
pointerControls.attach(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(80, innerWidth / innerHeight, 0.1, 240);
camera.position.set(0, 1.7, 12);
camera.translateZ = (distance: number) => {
    const movement = groundMoveDelta(camera.rotation.y, -distance, 0, 1, 1);
    camera.position.x += movement.x;
    camera.position.z += movement.z;
    return camera;
};
scene.add(camera, new THREE.HemisphereLight('#e3f2ff', '#6e7361', 2));
const resizeViewport = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); };
resizeViewport();
addEventListener('resize', resizeViewport);
const muzzleFlash = new THREE.PointLight('#ffd68a', 0, 8);
muzzleFlash.position.set(.25, -.2, -.7);
camera.add(muzzleFlash);
let muzzleFlashLife = 0;
const combatVfx = new CombatVfx(scene);
const sun = new THREE.DirectionalLight('#ffffff', 2);
sun.position.set(8, 18, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -64;
sun.shadow.camera.right = 64;
sun.shadow.camera.top = 64;
sun.shadow.camera.bottom = -64;
sun.shadow.bias = -.00035;
scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(124, 124), new THREE.MeshStandardMaterial({ color: '#15334a' }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.1;
floor.receiveShadow = true;
scene.add(floor);
const mapGroup = new THREE.Group();
scene.add(mapGroup);
const arenaAtmosphere = new ArenaAtmosphere(scene);
const arenaDressings = new ArenaDressings(scene);
const trainingTargets = new THREE.Group();
scene.add(trainingTargets);
let activeMapId = 'depot';
const setMap = (mapId: string) => {
    activeMapId = mapId;
    applyArenaPresentation(scene,mapId);
    disposeMap(mapGroup);
    arenaAtmosphere.setArena(mapId);
    arenaDressings.dispose();
    if (mapId === 'crossroads')
        buildCrossroads(mapGroup);
    else if (mapId === 'foundry')
        buildFoundry(mapGroup);
    else if (mapId === 'alleyways')
        buildAlleyways(mapGroup);
    else if (mapId === 'citadel')
        buildCitadel(mapGroup);
    else if (mapId === 'canal')
        buildCanal(mapGroup);
    else
        buildDepot(mapGroup);
    // Collision-owned architectural details are emitted by the map builder.
    configureMapShadows(mapGroup);
};
setMap('depot');
const keys = new Set<string>();
const weapon = new WeaponView();
const loadoutSync = new LoadoutSync();
const trigger = new FireControl();
let reloadEndsAt = 0;
let resyncAmmoAfterReconnect = false;
let reloadWeaponId = weapon.weaponId;
const cancelReload = () => { if (weapon.reloading && !trainingActive) connection.cancelReload(); reloadEndsAt = 0; weapon.reloading = false; };
const firstPersonWeapon = new FirstPersonWeapon(camera);
const remotePlayers = new RemotePlayers(scene);
const settings = loadSettings();
applyRenderQuality(renderer,sun,scene,settings.quality,devicePixelRatio);
const audio = new AudioDirector();
audio.setVolume(settings.volume / 100);
audio.setChannelVolume('music', settings.musicVolume / 100);
audio.setChannelVolume('effects', settings.effectsVolume / 100);
addEventListener('pointerdown', () => { void audio.unlock(); void audio.transitionTo('menu'); }, { once: true });
const connection = new RoomConnection(() => profileApi.accountCode());
const profileApi = new ProfileApi();
const training = new TrainingMode([{ id: 'target-a', position: [-7, 1.5, -8] }, { id: 'target-b', position: [0, 1.5, -13] }, { id: 'target-c', position: [7, 1.5, -8] }]);
const trainingMeshes = new Map<string, THREE.Mesh>();
const gameSession = new GameSession();
let trainingActive = false;
connection.onSnapshot(() => {
    if (!gameSession.isTraining())
        return;
    gameSession.startMatch();
    trainingActive = false;
    disposeMap(trainingTargets);
    trainingMeshes.clear();
    hudMessage.textContent = '';
});
document.querySelector('#training')?.addEventListener('click', () => gameSession.startTraining());
let matchStartedAt = 0;
let matchShotsFired = 0;
let matchShotsHit = 0;
let matchDeaths = 0;
let matchKills = 0;
let wasAlive = true;
let matchStatsBound = false;
let respawnEndsAt = 0;
const hud = document.createElement('aside');
hud.id = 'hud';
hud.className = 'hidden';
hud.innerHTML = '<div id="crosshair">+</div><div id="hit-marker"><i>×</i><span></span></div><div id="damage-indicator">▲</div><div id="reload-bar"><span></span></div><div id="hud-health" class="hud-card">HP 100</div><div id="hud-score" class="hud-card">WYNIK 0</div><div id="hud-timer" class="hud-card">10:00</div><div id="payload-hud" class="hidden"></div><section id="team-briefing" class="hidden"></section><div id="weapon-held" class="hud-card">TRZYMASZ: PISTOLET</div><div id="hud-ammo" class="hud-card">TRZYMASZ: PISTOLET 12/48</div><div id="weapon-fire"></div><div id="hud-message"></div><section id="kill-feed"></section><canvas id="minimap" width="150" height="150"></canvas><section id="scoreboard" class="hidden"><h2>WYNIKI MECZU</h2><div id="scoreboard-rows"></div></section>';
document.body.append(hud);
const deathScreen = document.createElement('section');
deathScreen.id = 'death-screen';
deathScreen.className = 'hidden';
deathScreen.innerHTML = '<div><p>KONIEC TEGO ŻYCIA</p><h1>ZGINĄŁEŚ</h1><span>Odrodzenie za</span><strong id="respawn-countdown">30</strong><small>sekund · wrócisz automatycznie do gry</small></div>';
hud.append(deathScreen);
const respawnCountdown = deathScreen.querySelector('#respawn-countdown')!;
const modeStatus = document.createElement('div');
modeStatus.id = 'mode-status';
hud.append(modeStatus);

const combatStatus = document.createElement('div');
combatStatus.id = 'combat-status';
hud.append(combatStatus);
const controlLegend = document.createElement('div');
controlLegend.id = 'control-legend';
controlLegend.innerHTML = '<kbd>WASD</kbd> RUCH <kbd>SHIFT</kbd> SPRINT <kbd>SPACJA</kbd> SKOK <kbd>R</kbd> PRZEŁADUJ <kbd>ESC</kbd> PAUZA';
hud.append(controlLegend);
const inputHint = document.createElement('button');
inputHint.id = 'input-hint';
inputHint.textContent = 'KLIKNIJ, ABY STEROWAĆ';
inputHint.className = 'hidden input-hint--compact';
const hasMouseCapture = () => document.pointerLockElement === canvas;
document.body.classList.add('pointer-unlocked');
const showCaptureFailure = () => {
    inputHint.textContent = 'BRAK BLOKADY MYSZY — otwórz http://127.0.0.1:5173/ w Chrome lub Edge. Kliknij, aby ponowić.';
    inputHint.classList.remove('hidden');
};
const requestControls = () => { pointerControls.capture(showCaptureFailure); };
inputHint.addEventListener('click', requestControls);
document.body.append(inputHint);
const buyPanel = document.createElement('section');
buyPanel.id = 'buy-panel';
buyPanel.className = 'hidden';
buyPanel.innerHTML = '<strong id="buy-title">FAZA KUPOWANIA</strong><span id="buy-cash">KREDYTY: 800</span><span id="buy-help">WYBIERZ BROŃ NA TĘ RUNDĘ</span><div class="buy-weapon-grid"><button class="buy-weapon-card" data-buy-weapon="pistol"><small>PISTOLET</small><b>PISTOL</b><em>BEZPŁATNY</em></button><button class="buy-weapon-card" data-buy-weapon="smg"><small>PM</small><b>VORTEX</b><em>1200</em></button><button class="buy-weapon-card" data-buy-weapon="rifle"><small>KARABIN</small><b>RAPTOR</b><em>2200</em></button><button class="buy-weapon-card" data-buy-weapon="sniper"><small>SNAJPERKA</small><b>GHOSTLINE</b><em>4750</em></button><button class="buy-weapon-card" data-buy-weapon="shotgun"><small>STRZELBA</small><b>BREACH</b><em>1600</em></button></div>';
document.body.append(buyPanel);
buyPanel.setAttribute('aria-label','Zakup wyposażenia');
buyPanel.querySelectorAll<HTMLButtonElement>('[data-buy-weapon]').forEach(button=>{
  button.querySelector('b')!.insertAdjacentHTML('afterend',weaponPreview(button.dataset.buyWeapon as keyof typeof WEAPONS,false));
});
buyPanel.querySelectorAll<HTMLButtonElement>('[data-buy-weapon]').forEach((button) => button.addEventListener('click', () => { const weaponId = button.dataset.buyWeapon as 'pistol' | 'smg' | 'rifle' | 'sniper' | 'shotgun'; connection.sendBuy(weaponId); buyPanel.querySelector('#buy-help')!.textContent = `Czekam na potwierdzenie: ${button.querySelector('b')?.textContent ?? weaponId}`; }));
const results = document.createElement('section');
results.id = 'results';
results.className = 'hidden';
document.body.append(results);
const pausePanel = document.createElement('section');
pausePanel.id = 'pause-panel';
pausePanel.className = 'hidden';
pausePanel.innerHTML = '<small>MECZ WSTRZYMANY</small><h2>PAUZA</h2><strong id="pause-score">WYNIK 0</strong><span id="pause-context">TRENING · DEPOT</span><button data-pause="resume">WZNÓW GRĘ</button><button data-pause="leave">WYJDŹ DO MENU</button><p>ESC — wróć do gry</p>';
document.body.append(pausePanel);
pausePanel.setAttribute('role','dialog');pausePanel.setAttribute('aria-label','Pauza');
let matchPaused = false;
const hudHealth = hud.querySelector<HTMLElement>('#hud-health')!;
const hudScore = hud.querySelector<HTMLElement>('#hud-score')!;
const payloadHud = hud.querySelector<HTMLElement>('#payload-hud')!;
const teamBriefing = hud.querySelector<HTMLElement>('#team-briefing')!;
const hudTimer = hud.querySelector<HTMLElement>('#hud-timer')!;
const hudAmmo = hud.querySelector<HTMLElement>('#hud-ammo')!;
const crosshair = hud.querySelector<HTMLElement>('#crosshair')!;
const applyCrosshair=()=>{
    for(const element of [crosshair,document.querySelector<HTMLElement>('#crosshair-preview')])if(element){element.style.color=settings.crosshairColor;element.style.fontSize=`${settings.crosshairSize}px`;}
};
applyCrosshair();
const weaponHeld = hud.querySelector<HTMLElement>('#weapon-held')!;
const hitMarker = hud.querySelector<HTMLElement>('#hit-marker')!;
const hitMarkerLabel = hitMarker.querySelector<HTMLElement>('span')!;
let hitMarkerTimeout: number | undefined;
const showHitMarker = (_damage: number) => { hitMarker.classList.remove('hit-marker--active'); };
const damageIndicator = hud.querySelector<HTMLElement>('#damage-indicator')!;
let damageIndicatorTimeout: number | undefined;
const showDamageIndicator = (angle: number) => { damageIndicator.style.setProperty('--damage-angle', `${angle}deg`); damageIndicator.classList.add('damage-indicator--active'); if (damageIndicatorTimeout)
    clearTimeout(damageIndicatorTimeout); damageIndicatorTimeout = window.setTimeout(() => damageIndicator.classList.remove('damage-indicator--active'), 420); };
const reloadBar = hud.querySelector<HTMLElement>('#reload-bar')!;
const reloadBarLabel = reloadBar.querySelector<HTMLElement>('span')!;
reloadBar.setAttribute('role','progressbar');
reloadBar.setAttribute('aria-label','Przeładowanie');
reloadBar.setAttribute('aria-valuemin','0');
reloadBar.setAttribute('aria-valuemax','100');
const hudMessage = hud.querySelector<HTMLElement>('#hud-message')!;
const killFeed = hud.querySelector<HTMLElement>('#kill-feed')!;
const scoreboard = hud.querySelector<HTMLElement>('#scoreboard')!;
const scoreboardRows = hud.querySelector<HTMLElement>('#scoreboard-rows')!;
const initialHud = formatHud({ health: 100, cash: 800, weapon: weapon.weaponId, ammo: weapon.ammo[weapon.weaponId], reserve: weapon.reserve[weapon.weaponId] });
hudHealth.textContent = initialHud.health;
hudAmmo.textContent = `${initialHud.weapon} ${initialHud.ammo}`;
const ammoText = () => `AMUNICJA: ${weapon.ammo[weapon.weaponId]}/${weapon.reserve[weapon.weaponId]}`;
let presentedWeaponId: string | undefined;
let ownedPrimaryWeaponId = 'pistol';
let lastShotAt = Number.NEGATIVE_INFINITY;
let recoilDirection = 1;
const syncWeaponPresentation = () => { if (presentedWeaponId !== weapon.weaponId) {
    firstPersonWeapon.equip(weapon.weaponId);
    muzzleFlash.position.set(.22, -.08, firstPersonWeapon.muzzleZ);
    weaponHeld.textContent = `TRZYMASZ: ${firstPersonWeapon.name}`;
    presentedWeaponId = weapon.weaponId;
} hudAmmo.textContent = ammoText(); };
syncWeaponPresentation();
new MutationObserver(() => { hudMessage.className = `hud-message--${messageTone(hudMessage.textContent ?? '')}`; }).observe(hudMessage, { childList: true, characterData: true, subtree: true });
const minimap = hud.querySelector<HTMLCanvasElement>('#minimap')!;
const minimapContext = minimap.getContext('2d')!;
addEventListener('keydown', (event) => keys.add(event.code));
addEventListener('keyup', (event) => keys.delete(event.code));
const leaveMatch = () => {
    audio.stopEffects();combatVfx.update(1);muzzleFlashLife=0;
    cancelReload(); trigger.release(); keys.clear();
    buyPanel.classList.add('hidden'); inputHint.classList.add('hidden');
    remotePlayers.retain([]);
    if (!trainingActive) void connection.leave();
    trainingActive = false;
    disposeMap(trainingTargets);
    trainingMeshes.clear();
    matchPaused = false;
    gameSession.end();
    pausePanel.classList.add('hidden');
    pointerControls.release();
    document.body.classList.remove('playing', 'paused');
    hud.classList.add('hidden');
    document.querySelector('#menu')?.classList.remove('hidden');
    audio.stopMusic();
};
const resumeMatch = () => { matchPaused = false; gameSession.resume(); document.body.classList.remove('paused'); pausePanel.classList.add('hidden'); requestControls(); };
const pauseMatch = () => {
    if (hud.classList.contains('hidden')) return;
    audio.stopEffects();combatVfx.update(1);muzzleFlashLife=0;
    keys.clear(); trigger.release();
    localMovementVelocity.x = 0; localMovementVelocity.z = 0;
    jumpQueued = false; jumpInputQueued = false;
    pausePanel.querySelector('#pause-score')!.textContent = hudScore.textContent || 'WYNIK 0';
    pausePanel.querySelector('#pause-context')!.textContent = `${trainingActive ? 'TRENING' : activeMode.toUpperCase()} · ${activeMapId.toUpperCase()}`;
    matchPaused = true; gameSession.pause(); pointerControls.release();
    document.body.classList.add('paused'); pausePanel.classList.remove('hidden');
};
pausePanel.querySelector<HTMLButtonElement>('[data-pause="resume"]')?.addEventListener('click', resumeMatch);
pausePanel.querySelector<HTMLButtonElement>('[data-pause="leave"]')?.addEventListener('click', leaveMatch);
addEventListener('keydown', (event) => { if (event.code === 'Escape' && !hud.classList.contains('hidden')) { event.preventDefault(); if (matchPaused) resumeMatch(); else pauseMatch(); } });
addEventListener('keydown', (event) => { if (event.code === 'Tab' && !hud.classList.contains('hidden') && !matchPaused) {
    event.preventDefault();
    scoreboard.classList.remove('hidden');
} });
addEventListener('keyup', (event) => { if (event.code === 'Tab')
    scoreboard.classList.add('hidden'); });
const beginReload = () => {
    const config = WEAPONS[weapon.weaponId];
    if (weapon.reloading || weapon.weaponId === 'knife' || weapon.ammo[weapon.weaponId] >= config.magazine || weapon.reserve[weapon.weaponId] <= 0) return;
    weapon.reloading = true;
    reloadWeaponId = weapon.weaponId;
    reloadEndsAt = performance.now() + config.reloadMs;
    if (!trainingActive) connection.sendReload(weapon.weaponId);
    audio.playSfx('reload');
};
addEventListener('keydown', (event) => {
if (hud.classList.contains('hidden') || matchPaused || matchPhase !== 'playing' || event.repeat) return;
if (event.code === 'KeyR') beginReload();
const slots = ['knife', 'pistol', 'smg', 'rifle', 'sniper', 'shotgun'] as const; const index = Number(event.key) - 1; const selectedWeapon = slots[index];
if (selectedWeapon && selectedWeapon !== weapon.weaponId && (trainingActive || selectedWeapon === 'knife' || selectedWeapon === 'pistol' || selectedWeapon === ownedPrimaryWeaponId)) {
    cancelReload(); trigger.release(); reloadBar.classList.remove('reload-bar--active');
    weapon.equip(selectedWeapon);
    syncWeaponPresentation();
} });
canvas.addEventListener('click', requestControls);
document.addEventListener('pointerlockchange', () => {
    const locked = hasMouseCapture();
    if (locked) inputHint.textContent = 'KLIKNIJ, ABY STEROWAĆ';
    document.body.classList.toggle('pointer-unlocked', !locked);
    if (!locked) {
        keys.clear(); trigger.release(); jumpQueued = false; jumpInputQueued = false;
        localMovementVelocity.x = 0; localMovementVelocity.z = 0;
    }
    if (!locked && !hud.classList.contains('hidden') && !matchPaused && matchPhase !== 'buy') inputHint.classList.remove('hidden');
    else inputHint.classList.add('hidden');
});
document.addEventListener('pointerlockerror', () => { if (!hud.classList.contains('hidden') && !matchPaused) showCaptureFailure(); });
const fireShot = () => { if (weapon.fire()) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const trace = traceShot(camera.position, direction, WEAPONS[weapon.weaponId].range,
        [mapGroup, floor], trainingActive ? [...trainingMeshes.values()] : remotePlayers.shotTargets());
    combatVfx.fire(firstPersonWeapon.muzzleWorldPosition(new THREE.Vector3()), direction.clone(), trace.point, trace.impact);
    const kick = recoilKick(weapon.weaponId);
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - kick.vertical, -1.2, 1.2);
    camera.rotation.y += kick.horizontal * recoilDirection;
    recoilDirection *= -1;
    lastShotAt = performance.now();
    muzzleFlashLife = .07;
    firstPersonWeapon.fire();
    audio.playWeaponShot(weapon.weaponId);
    if (trainingActive) {
        training.recordShot();
        const hit = trace.target;
        if (hit) {
            const targetId = hit.object.userData.targetId as string;
            training.hit(targetId, 100);
            const target = training.getTarget(targetId)!;
            trainingMeshes.get(targetId)!.position.set(...target.position);
        }
        const stats = training.getStats();
        hudMessage.textContent = `TRENING: ${stats.shotsHit}/${stats.shotsFired} · ${stats.accuracy}%`;
    }
    else {
        matchShotsFired += 1;
        connection.sendFire({ sequence: ++inputSequence, clientTime: Date.now(), weaponId: weapon.weaponId, origin: [camera.position.x, camera.position.y, camera.position.z], direction: [direction.x, direction.y, direction.z] });
    }
    hudAmmo.textContent = ammoText();
}
else {
    if (weapon.reloading) return;
    audio.playSfx('empty');
    if (weapon.reserve[weapon.weaponId] > 0) beginReload();
    else {
        hudMessage.textContent = 'BRAK AMUNICJI';
        trigger.release();
    }
    hudAmmo.textContent = ammoText();
} };
canvas.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || !hasMouseCapture() || hud.classList.contains('hidden') || matchPaused || matchPhase !== 'playing') return;
    trigger.press();
    if (trigger.poll(weapon.weaponId, performance.now(), !weapon.reloading && (trainingActive || wasAlive))) fireShot();
});
addEventListener('mouseup', () => trigger.release());
addEventListener('blur', () => { keys.clear(); trigger.release(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { keys.clear(); trigger.release(); } });
let lastMousePosition: {
    x: number;
    y: number;
} | undefined;
addEventListener('mousemove', (event) => { const locked = document.pointerLockElement === canvas; if (!locked || (!trainingActive && !wasAlive) || matchPaused || matchPhase === 'buy' || hud.classList.contains('hidden'))
    return; const movementX = locked ? event.movementX : lastMousePosition ? event.clientX - lastMousePosition.x : 0; const movementY = locked ? event.movementY : lastMousePosition ? event.clientY - lastMousePosition.y : 0; lastMousePosition = { x: event.clientX, y: event.clientY }; const sensitivity = aimSensitivity(settings.sensitivity); camera.rotation.order = 'YXZ'; camera.rotation.y -= movementX * sensitivity; camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - movementY * sensitivity, -1.2, 1.2); });
const clock = new THREE.Clock();
const localMovementVelocity = { x: 0, z: 0 };
let nextFootstepAt = 0;
const quickWheel = document.querySelector<HTMLElement>('#quick-wheel')!;
addEventListener('keydown', (event) => { if (event.code === 'KeyQ')
    quickWheel.classList.remove('hidden'); });
addEventListener('keyup', (event) => { if (event.code === 'KeyE' && !trainingActive)
    connection.sendObjective(false); if (event.code === 'KeyQ')
    quickWheel.classList.add('hidden'); });
quickWheel.querySelectorAll<HTMLButtonElement>('button').forEach((button) => button.addEventListener('click', () => { connection.sendPing(button.textContent ?? 'POMOC!'); quickWheel.classList.add('hidden'); }));
let inputSequence = 0;
let lastInputSent = 0;
let matchPhase = 'lobby';
let previousSnapshotPhase = 'lobby';
let jumpQueued = false;
let jumpInputQueued = false;
let jumpState = { height: 0, velocity: 0, grounded: true };
addEventListener('keydown', (event) => { if (event.code === 'Space' && !event.repeat && (trainingActive || wasAlive) && hasMouseCapture() && !matchPaused && matchPhase === 'playing') {
    jumpQueued = true;
    jumpInputQueued = true;
} });
setInterval(() => { if (matchPhase !== 'playing' || matchPaused || (!trainingActive && !wasAlive)) {
    jumpQueued = false;
    jumpState = { height: 0, velocity: 0, grounded: true };
    return;
} jumpState = advanceJump(jumpState, jumpQueued, .05); jumpQueued = false; camera.position.y = 1.7 + jumpState.height; }, 50);
let activeMode: GameMode = 'free_for_all';
addEventListener('keydown', (event) => { if (event.code === 'KeyE' && !event.repeat && !trainingActive)
    connection.sendObjective(true); });
function render() { const dt = clock.getDelta(); muzzleFlashLife = Math.max(0, muzzleFlashLife - dt); const canMove = matchPhase === 'playing' && !matchPaused && hasMouseCapture() && (trainingActive || wasAlive); const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? MOVEMENT.sprintSpeed : MOVEMENT.walkSpeed; const forward = canMove ? (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) : 0; const side = canMove ? (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) : 0; const targetVelocity = groundMoveDelta(camera.rotation.y, forward, side, speed, 1); const hasMovement = forward !== 0 || side !== 0; const maximumChange = (hasMovement ? MOVEMENT.acceleration : MOVEMENT.braking) * dt; localMovementVelocity.x = moveToward(localMovementVelocity.x, targetVelocity.x, maximumChange); localMovementVelocity.z = moveToward(localMovementVelocity.z, targetVelocity.z, maximumChange); const current = { x: camera.position.x, y: camera.position.y, z: camera.position.z }; let desired = { x: current.x + localMovementVelocity.x * dt, y: current.y, z: current.z + localMovementVelocity.z * dt }; if (trainingActive)
    desired = clampTrainingPosition(desired); const resolved = resolveCameraCollision(current, desired, activeMapId); if (resolved === current) {
    localMovementVelocity.x = 0;
    localMovementVelocity.z = 0;
} camera.position.set(resolved.x, resolved.y, resolved.z); const actualMovementSpeed = Math.hypot(localMovementVelocity.x, localMovementVelocity.z); const sprinting = canMove && hasMovement && (keys.has('ShiftLeft') || keys.has('ShiftRight')); crosshair.style.setProperty('--crosshair-scale', String(crosshairScale({ movingSpeed: actualMovementSpeed, sprinting, firing: performance.now() - lastShotAt < 90 }))); if (canMove && actualMovementSpeed > 1 && performance.now() >= nextFootstepAt) {
    audio.playSfx('footstep');
    nextFootstepAt = performance.now() + (sprinting ? 260 : 390);
} muzzleFlash.intensity = muzzleFlashLife * 70; combatVfx.update(dt); firstPersonWeapon.update(dt); const inputNow = performance.now(); if (inputNow - lastInputSent >= 50) {
    const queuedJump = consumeQueuedJump(jumpInputQueued, canMove);
    jumpInputQueued = queuedJump.queued;
    connection.sendInput({ sequence: ++inputSequence, clientTime: Date.now(), moveX: side, moveZ: forward, yaw: camera.rotation.y, pitch: camera.rotation.x, jump: queuedJump.jump, sprint: canMove && (keys.has('ShiftLeft') || keys.has('ShiftRight')) });
    lastInputSent = inputNow - ((inputNow - lastInputSent) % 50);
} remotePlayers.render(Date.now(), camera); renderer.render(scene, camera); requestAnimationFrame(render); }
new GameApp(render).start();
let lastCombatFrame = performance.now();
function updateCombat(now: number) {
    const pausedDelta = Math.max(0,now - lastCombatFrame);
    lastCombatFrame = now;
    const active = !hud.classList.contains('hidden') && matchPhase === 'playing' && !matchPaused && hasMouseCapture() && (trainingActive || wasAlive);
    if (!active) {
        trigger.release();
        if (matchPaused && reloadEndsAt) reloadEndsAt += pausedDelta;
        else if (!matchPaused && weapon.reloading) cancelReload();
    }
    if (active && reloadEndsAt && now >= reloadEndsAt) {
        if (trainingActive) { weapon.reloading = false; if (weapon.weaponId === reloadWeaponId) weapon.reload(); }
        reloadEndsAt = 0;
        reloadBar.classList.remove('reload-bar--active');
        hudAmmo.textContent = ammoText();
    }
    if (trigger.poll(weapon.weaponId, now, active && !weapon.reloading)) fireShot();
    const lowAmmo = weapon.weaponId !== 'knife' && weapon.ammo[weapon.weaponId] <= Math.ceil(WEAPONS[weapon.weaponId].magazine * .25);
    hudAmmo.classList.toggle('ammo-low', lowAmmo);
    combatStatus.classList.toggle('combat-status--reload', weapon.reloading);
    const remaining=Math.max(0,reloadEndsAt-now);
    combatStatus.textContent = formatCombatStatus(weapon.weaponId,weapon.ammo[weapon.weaponId],weapon.reserve[weapon.weaponId],weapon.reloading,remaining/1000);
    const reloadProgress=weapon.reloading?Math.max(0,Math.min(1,1-remaining/WEAPONS[reloadWeaponId].reloadMs)):0;
    reloadBar.classList.toggle('reload-bar--active',weapon.reloading);
    reloadBarLabel.style.width=`${reloadProgress*100}%`;
    reloadBar.setAttribute('aria-valuenow',String(Math.round(reloadProgress*100)));
    reloadBar.setAttribute('aria-valuetext',weapon.reloading?combatStatus.textContent:'');
    firstPersonWeapon.setReloadProgress(reloadProgress);
    if (trainingActive) drawMinimap([{ id: '__training__', position: [camera.position.x, camera.position.y, camera.position.z], alive: true }]);
    requestAnimationFrame(updateCombat);
}
requestAnimationFrame(updateCombat);
let buyPhaseEndsAt = 0;
let buyWasOpen = false;
setInterval(() => {
    const buying = matchPhase === 'buy' && !hud.classList.contains('hidden') && !matchPaused;
    document.body.classList.toggle('buying', buying);
    inputHint.classList.toggle('hidden', hud.classList.contains('hidden') || matchPaused || matchPhase !== 'playing' || hasMouseCapture());
    if (buying && !buyWasOpen) { trigger.release(); keys.clear(); pointerControls.release(); inputHint.classList.add('hidden'); }
    buyWasOpen = buying;
    buyPanel.classList.toggle('hidden', !buying);
    if (!buying) {
        buyPhaseEndsAt = 0;
        return;
    }
    if (!buyPhaseEndsAt)
        buyPhaseEndsAt = Date.now() + 15000;
    const seconds = Math.max(0, (buyPhaseEndsAt - Date.now()) / 1000);
    buyPanel.querySelector('#buy-title')!.textContent = formatBuyPhase(seconds);
}, 100);
const panel = document.querySelector<HTMLDivElement>('#panel')!;
const menuView = new MenuView(document.querySelector<HTMLElement>('#menu')!, panel);
const panelFocus=new MenuPanelFocus(panel,[...document.querySelector<HTMLElement>('#menu')!.children].filter(el=>el!==panel) as HTMLElement[],()=>dismissPanel());
const dismissPanel=(restoreFocus=true)=>{menuView.close();panel.classList.add('hidden');panelFocus.close(restoreFocus);};
new MutationObserver(() => panel.querySelectorAll<HTMLSelectElement>('#quick-map, #map').forEach((select) => { if (!select.querySelector('option[value="foundry"]'))
    select.add(new Option('Odlewnia — piec hutniczy', 'foundry')); if(select.id==='quick-map')mountMapCards(select); })).observe(panel, { childList: true, subtree: true });
const status = document.querySelector<HTMLElement>('#status')!;
const playerNameInput = document.createElement('input');
playerNameInput.id = 'player-name';
playerNameInput.maxLength = 16;
playerNameInput.placeholder = 'NAZWA GRACZA (3–16)';
playerNameInput.value = localStorage.getItem('polystrike-player-name') ?? 'Gracz';
status.insertAdjacentElement('afterend', playerNameInput);
const playerName = () => { const name = playerNameInput.value.trim().slice(0, 16); if (name.length < 3)
    throw new Error('Nazwa gracza musi mieć 3–16 znaków.'); localStorage.setItem('polystrike-player-name', name); return name; };
const skinModel = document.querySelector<HTMLElement>('#skin-model')!;
const skinLabel = document.querySelector<HTMLElement>('.skin-preview b')!;
const applySkinPreview = (skinId: string) => { const skins: Record<string, {
    name: string;
    color: string;
}> = { recruit: { name: 'REKRUT', color: '#27d8ff' }, neon: { name: 'NEON', color: '#ff4ee8' }, frost: { name: 'MRÓZ', color: '#baf7ff' }, gold: { name: 'ZŁOTY SZTURM', color: '#ffd45b' } }; const skin = skins[skinId] ?? skins.recruit; skinModel.style.color = skin.color; skinModel.innerHTML = skinPreview(skinId); skinLabel.textContent = `AKTUALNY SKIN: ${skin.name}`; };
void profileApi.get().then((profile) => applySkinPreview(profile.equippedSkinId)).catch(() => undefined);
const show = (html: string) => {
    panel.innerHTML = `<div class="panel-toolbar"><small>POLYSTRIKE / CENTRUM GRACZA</small><button id="close-panel" aria-label="Zamknij">×</button></div><div class="panel-body">${html}</div>`;
    const quickMode = panel.querySelector<HTMLSelectElement>('#quick-mode');
    if (quickMode) quickMode.value = 'team_deathmatch';
    bindModePickers(panel);
    menuView.open('dialog'); panel.classList.remove('hidden');
    panelFocus.open();
    document.querySelector('#close-panel')?.addEventListener('click', () => dismissPanel());
};
const accountButton = document.createElement('button');
accountButton.id = 'account';
accountButton.textContent = 'KONTO';
document.querySelector('nav')?.insertBefore(accountButton, document.querySelector('[data-page="settings"]'));
const statsButton = document.createElement('button');
statsButton.id = 'stats';
statsButton.textContent = 'STATYSTYKI';
document.querySelector('nav')?.insertBefore(statsButton, document.querySelector('[data-page="settings"]'));
statsButton.addEventListener('click', async () => {
    show('<section id="stats-content" aria-live="polite" aria-busy="true"><h2>STATYSTYKI</h2><p>Ładowanie statystyk…</p></section>');
    const content = panel.querySelector<HTMLElement>('#stats-content')!;
    try {
        const stats = await profileApi.getStats();
        if (content.isConnected && !panel.classList.contains('hidden')) content.innerHTML = formatProfileStats(stats);
    } catch {
        if (content.isConnected && !panel.classList.contains('hidden')) content.innerHTML = '<h2>STATYSTYKI</h2><p>Nie udało się pobrać statystyk.</p>';
    } finally {
        content.setAttribute('aria-busy', 'false');
    }
});
accountButton.addEventListener('click', () => {
    show('<h2>KONTO</h2><p>Zarejestruj konto, aby zachować coiny, skiny i wyposażenie na innych komputerach.</p><input id="account-email" type="email" placeholder="E-MAIL"/><input id="account-password" type="password" placeholder="HASŁO (min. 10 znaków)"/><button id="account-register">UTWÓRZ KONTO</button><button id="account-login">ZALOGUJ SIĘ</button><p id="account-login-status"></p>');
    const statusLine = document.querySelector<HTMLElement>('#account-login-status')!;
    const credentials = () => ({ email: (document.querySelector('#account-email') as HTMLInputElement).value, password: (document.querySelector('#account-password') as HTMLInputElement).value });
    document.querySelector('#account-register')?.addEventListener('click', async () => { try {
        await profileApi.register(credentials().email, credentials().password);
        statusLine.textContent = 'Konto utworzone. Ten profil jest teraz zsynchronizowany.';
    }
    catch (error) {
        statusLine.textContent = error instanceof Error ? error.message : 'Nie udało się utworzyć konta.';
    } });
    document.querySelector('#account-login')?.addEventListener('click', async () => { try {
        const profile = await profileApi.signIn(credentials().email, credentials().password);
        applySkinPreview(profile.equippedSkinId);
        statusLine.textContent = 'Zalogowano. Postęp został odzyskany.';
    }
    catch (error) {
        statusLine.textContent = error instanceof Error ? error.message : 'Nie udało się zalogować.';
    } });
});
const playerTeams = new Map<string, string | undefined>();
const playerNames = new Map<string, string>();
const playerPositions = new Map<string, { x: number; z: number }>();
const mapPings: Array<{
    position: [
        number,
        number
    ];
    expiresAt: number;
}> = [];
const drawMinimap = (players: Array<{
    id: string;
    position: [
        number,
        number,
        number
    ];
    alive: boolean;
}>) => { minimapContext.clearRect(0, 0, 150, 150);
minimapContext.fillStyle = '#0a1925'; minimapContext.fillRect(0, 0, 150, 150);
for (const wall of getMapDefinition(activeMapId).colliders) {
    const [left, top] = minimapPoint([wall.minX, wall.minZ], getMapDefinition(activeMapId).arenaLimit + 3);
    const [right, bottom] = minimapPoint([wall.maxX, wall.maxZ], getMapDefinition(activeMapId).arenaLimit + 3);
    minimapContext.fillStyle = '#3d5a6b'; minimapContext.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
}
minimapContext.strokeStyle = '#203b4b'; minimapContext.lineWidth = 1; for (let line = 30; line < 150; line += 30) {
    minimapContext.beginPath();
    minimapContext.moveTo(line, 0);
    minimapContext.lineTo(line, 150);
    minimapContext.moveTo(0, line);
    minimapContext.lineTo(150, line);
    minimapContext.stroke();
} for (const player of players) {
    if (!player.alive)
        continue;
    const [x, y] = minimapPoint([player.position[0], player.position[2]], getMapDefinition(activeMapId).arenaLimit + 3);
    const isLocal = player.id === connection.room?.sessionId || player.id === '__training__';
    minimapContext.fillStyle = isLocal ? '#ffffff' : playerTeams.get(player.id) === 'blue' ? '#42b8ff' : playerTeams.get(player.id) === 'red' ? '#ff5a80' : '#ffd45b';
    minimapContext.beginPath();
    minimapContext.arc(x, y, player.id === connection.room?.sessionId ? 5 : 4, 0, Math.PI * 2);
    minimapContext.fill();
    if (isLocal) {
        minimapContext.save(); minimapContext.translate(x, y); minimapContext.rotate(-camera.rotation.y);
        minimapContext.beginPath(); minimapContext.moveTo(0, -12); minimapContext.lineTo(-4, -5); minimapContext.lineTo(4, -5); minimapContext.closePath(); minimapContext.fill(); minimapContext.restore();
    }
} const now = Date.now(); for (let index = mapPings.length - 1; index >= 0; index -= 1) {
    const ping = mapPings[index];
    if (ping.expiresAt <= now) {
        mapPings.splice(index, 1);
        continue;
    }
    const [x, y] = minimapPoint(ping.position, getMapDefinition(activeMapId).arenaLimit + 3);
    minimapContext.strokeStyle = '#27d8ff';
    minimapContext.lineWidth = 3;
    minimapContext.beginPath();
    minimapContext.arc(x, y, 8, 0, Math.PI * 2);
    minimapContext.stroke();
    minimapContext.fillStyle = '#27d8ff';
    minimapContext.font = 'bold 12px Arial';
    minimapContext.fillText('!', x - 2, y + 4);
} };
const bindRoom = () => { connection.onLobby((lobby) => { activeMode = lobby.mode; status.textContent = formatLobbySummary(lobby.players); setMap(lobby.mapId ?? 'depot'); playerTeams.clear(); playerNames.clear(); lobby.players.forEach((player) => { playerTeams.set(player.id, player.team); playerNames.set(player.id, player.name); }); }); connection.onSnapshot((snapshot) => { if (hud.classList.contains('hidden') || trainingActive) return; remotePlayers.retain(snapshot.players.filter(player => player.id !== connection.room?.sessionId).map(player => player.id)); matchPhase = snapshot.phase; const teamRound = GAME_MODES[activeMode].team; teamBriefing.classList.toggle('hidden', !teamRound || snapshot.phase === 'playing' || snapshot.phase === 'finished'); if (teamRound && snapshot.phase !== 'playing' && snapshot.phase !== 'finished') teamBriefing.textContent = `5 NA 5 · NIEBIESCY ${snapshot.blueScore ?? 0} : ${snapshot.redScore ?? 0} CZERWONI · PRZYGOTUJ SIĘ`; if (snapshot.phase === 'buy')
    buyPhaseEndsAt = syncBuyPhaseEnd(snapshot.phaseEndsAt, snapshot.serverTime); const minutes = Math.floor(snapshot.remainingSeconds / 60); const seconds = snapshot.remainingSeconds % 60; hudTimer.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`; snapshot.players.forEach((player) => playerPositions.set(player.id, { x: player.position[0], z: player.position[2] })); const local = snapshot.players.find((player) => player.id === connection.room?.sessionId);
    if (local) {
        ownedPrimaryWeaponId = local.primaryWeaponId;
        const team = playerTeams.get(local.id);
        modeStatus.textContent = GAME_MODES[activeMode].name.toUpperCase() + (team ? ` · TWOJA DRUŻYNA: ${team === 'blue' ? 'NIEBIESCY' : 'CZERWONI'}` : '');
        modeStatus.dataset.team = team ?? 'solo'; modeStatus.classList.remove('hidden');
    }
    if (local && loadoutSync.shouldRestore({ playerId: local.id, alive: local.alive, phase: snapshot.phase, roundNumber: snapshot.roundNumber })) {
        cancelReload(); trigger.release();
        if (local.ammo && local.reserve) { Object.assign(weapon.ammo, local.ammo); Object.assign(weapon.reserve, local.reserve); }
        if (Object.hasOwn(WEAPONS, local.primaryWeaponId)) weapon.equip(local.primaryWeaponId as import('@polystrike/shared/weapons').WeaponId);
        syncWeaponPresentation(); hudAmmo.textContent = ammoText();
        reloadBar.classList.remove('reload-bar--active');
        camera.position.set(local.position[0], local.position[1] + 1.7, local.position[2]);
        camera.rotation.set(local.pitch, local.yaw, 0);
    }
    if (snapshot.phase === 'countdown') {
    results.className = 'hidden';
    hudMessage.textContent = formatCountdown(snapshot.countdownSeconds ?? 0);
    if (local && shouldSnapToSpawn(previousSnapshotPhase, snapshot.phase))
        camera.position.set(local.position[0], local.position[1] + 1.7, local.position[2]);
    previousSnapshotPhase = snapshot.phase;
}
else if (local) {
    previousSnapshotPhase = snapshot.phase;
    if (snapshot.objective) {
        const team = playerTeams.get(local.id) as 'blue' | 'red' | undefined;
        payloadHud.classList.remove('hidden');
        const progress = payloadActionProgress(snapshot.objective, Date.now());
        payloadHud.textContent = `${team === 'blue' ? 'ATAKUJ' : 'BROŃ'} · ${progress || payloadInstruction(team, snapshot.objective, local.id)}`;
    }
    else if (activeMode === 'payload') {
        payloadHud.classList.remove('hidden');
        payloadHud.textContent = 'ŁADUNEK 5 NA 5 · PRZYGOTUJ SIĘ DO RUNDY';
    }
    else
        payloadHud.classList.add('hidden');
    if (!local.alive || snapshot.phase !== 'playing') cancelReload();
    if (resyncAmmoAfterReconnect && local.ammo && local.reserve) {
        connection.cancelReload(); reloadEndsAt = 0; weapon.reloading = false;
        Object.assign(weapon.ammo, local.ammo); Object.assign(weapon.reserve, local.reserve);
        reloadBar.classList.remove('reload-bar--active'); hudAmmo.textContent = ammoText();
        resyncAmmoAfterReconnect = false;
    }
    hudHealth.textContent = `HP ${local.health}`;
    hudScore.textContent = (activeMode === 'elimination' ? 'ŻYWI · ' : '') + formatMatchScore(activeMode, local.score, snapshot.blueScore, snapshot.redScore);
    if (local.alive) {
        respawnEndsAt = 0;
        deathScreen.classList.add('hidden');
        if (snapshot.phase === 'playing') {
            const reconciled = reconcilePosition([camera.position.x, camera.position.y, camera.position.z], [local.position[0], local.position[1] + 1.7, local.position[2]]);
            camera.position.set(...reconciled);
        }
        if (shouldClearHudMessage(snapshot.phase))
            hudMessage.textContent = '';
    }
    else {
        respawnEndsAt = Date.now() + Math.max(0, (local.respawnAt ?? snapshot.serverTime + 30000) - snapshot.serverTime);
        deathScreen.classList.toggle('hidden', snapshot.phase !== 'playing');
        const waitsForRound = GAME_MODES[activeMode].respawnMs === 0;
        deathScreen.querySelector('span')!.textContent = waitsForRound ? 'Jedno życie na rundę' : 'Odrodzenie za';
        respawnCountdown.textContent = waitsForRound ? '—' : String(Math.ceil(Math.max(0, respawnEndsAt - Date.now()) / 1000));
        deathScreen.querySelector('small')!.textContent = waitsForRound ? 'Wrócisz na początku następnej rundy' : 'sekund · wrócisz automatycznie do gry';
        hudMessage.textContent = '';
        keys.clear(); trigger.release();
        localMovementVelocity.x = 0; localMovementVelocity.z = 0;
        jumpQueued = false; jumpInputQueued = false;

    }
} scoreboardRows.innerHTML = scoreboardMarkup(snapshot.players,playerNames,playerTeams,connection.room?.sessionId??'',activeMode==='free_for_all'); drawMinimap(snapshot.players); const localTeam = local ? playerTeams.get(local.id) : undefined; snapshot.players.filter((player) => player.id !== connection.room?.sessionId).forEach((player) => { remotePlayers.push(player.id, { ...player, serverTime: snapshot.serverTime, continuityKey: `${snapshot.roundNumber}:${snapshot.phase}` }); remotePlayers.setSkin(player.id, player.skinId ?? 'recruit'); remotePlayers.setTeam(player.id, activeMode === 'free_for_all' ? 'enemy' : playerTeams.get(player.id) === localTeam ? 'ally' : 'enemy'); }); }); connection.onHit((hit) => { if (hit.targetId !== connection.room?.sessionId) {
    showHitMarker(hit.damage);
    hudMessage.textContent = formatHitFeedback(hit.damage);
    setTimeout(() => { if (hudMessage.textContent?.startsWith('TRAFIENIE'))
        hudMessage.textContent = ''; }, 280);
} }); connection.onPing((ping) => { mapPings.push({ position: ping.position, expiresAt: Date.now() + 5000 }); hudMessage.textContent = `${ping.senderName}: ${ping.message}`, setTimeout(() => { if (!hudMessage.textContent?.includes('VICTORY'))
    hudMessage.textContent = ''; }, 1600); }); connection.onKill((kill) => { const entry = document.createElement('div'); entry.textContent = formatKillFeed(kill.killerName, kill.targetName, kill.weaponId); killFeed.prepend(entry); const feedback = localKillFeedback(kill, connection.room?.sessionId); if (feedback) { hudMessage.textContent = feedback; setTimeout(() => { if (hudMessage.textContent === feedback) hudMessage.textContent = ''; }, 900); } setTimeout(() => entry.remove(), 4000); }); connection.onMatchResult((result) => { const won = didWin(result, connection.room?.sessionId, playerTeams.get(connection.room?.sessionId ?? '')); if (won)
    void profileApi.awardVictory(result.matchId); if (won)
    audio.play('victory'); const copy = result.draw ? 'REMIS' : resultCopy(won); hudMessage.textContent = copy; results.textContent = copy; results.className = result.draw ? '' : won ? 'victory' : 'defeat'; }); };
const bindMatchStats = () => {
    if (matchStatsBound)
        return;
    matchStatsBound = true;
    connection.onSnapshot((snapshot) => {
        if (snapshot.phase === 'playing' && matchStartedAt === 0)
            matchStartedAt = Date.now();
        const local = snapshot.players.find((player) => player.id === connection.room?.sessionId);
        if (!local)
            return;
        if (wasAlive && !local.alive)
            matchDeaths += 1;
        wasAlive = local.alive;
    });
    connection.onHit((hit) => { if (hit.shooterId === connection.room?.sessionId)
        matchShotsHit += 1; });
    connection.onKill((kill) => { if (kill.killerId === connection.room?.sessionId)
        matchKills += 1; });
    connection.onMatchResult((result) => {
        const won = didWin(result, connection.room?.sessionId, playerTeams.get(connection.room?.sessionId ?? ''));
        const playTimeSeconds = matchStartedAt ? Math.max(0, Math.floor((Date.now() - matchStartedAt) / 1000)) : 0;
        void profileApi.recordStats(result.matchId, { matchesPlayed: 1, wins: won ? 1 : 0, kills: matchKills, deaths: matchDeaths, shotsFired: matchShotsFired, shotsHit: matchShotsHit, playTimeSeconds }).catch(() => undefined);
    });
};
const startGame = () => { deathScreen.classList.add('hidden'); respawnEndsAt = 0; gameSession.startMatch(); matchPaused = false; document.body.classList.remove('paused'); pausePanel.classList.add('hidden'); matchStatsBound = false; matchStartedAt = 0; matchShotsFired = 0; matchShotsHit = 0; matchDeaths = 0; matchKills = 0; wasAlive = true; audio.setMusic('match'); bindRoom(); bindMatchStats(); connection.onDisconnect((code) => { if (code === 1000 || hud.classList.contains('hidden'))
    return; hudMessage.textContent = 'PRZYWRACANIE POŁĄCZENIA…'; void connection.reconnect().then(() => { resyncAmmoAfterReconnect = true; matchStatsBound = false; bindRoom(); bindMatchStats(); hudMessage.textContent = 'POŁĄCZENIE PRZYWRÓCONE'; setTimeout(() => { if (hudMessage.textContent === 'POŁĄCZENIE PRZYWRÓCONE')
    hudMessage.textContent = ''; }, 1500); }).catch(() => { hudMessage.textContent = 'UTRACONO POŁĄCZENIE'; }); }); results.className = 'hidden'; document.querySelector('#menu')?.classList.add('hidden'); document.body.classList.add('playing'); hud.classList.remove('hidden'); inputHint.classList.add('hidden'); lastMousePosition = undefined; };
const startTraining = () => { modeStatus.classList.add('hidden'); deathScreen.classList.add('hidden'); respawnEndsAt = 0; wasAlive = true; remotePlayers.retain([]); gameSession.startTraining(); matchPaused = false; document.body.classList.remove('paused'); pausePanel.classList.add('hidden'); trainingActive = true; matchPhase = 'playing'; setMap((document.querySelector('#training-map') as HTMLSelectElement).value); disposeMap(trainingTargets); trainingMeshes.clear(); for (const id of ['target-a', 'target-b', 'target-c']) {
    const target = training.getTarget(id)!;
    const index=['target-a','target-b','target-c'].indexOf(id);
    target.position=activeMapId==='depot'?([[-7,1.5,-8],[0,1.5,-13],[7,1.5,-8]][index] as [number,number,number]):([-24+index*6,1.5,index===1?41:44]);
    const mesh = createTrainingTarget(id);
    mesh.position.set(...target.position);
    mesh.userData.targetId = id;
    trainingTargets.add(mesh);
    trainingMeshes.set(id, mesh);
} audio.setMusic('match'); results.className = 'hidden'; document.querySelector('#menu')?.classList.add('hidden'); document.body.classList.add('playing'); hud.classList.remove('hidden'); inputHint.classList.add('hidden'); lastMousePosition = undefined; camera.position.set(activeMapId==='depot'?0:-18, 1.7, activeMapId==='depot'?12:51); hudMessage.textContent = 'TRENING: TRAF W CELE'; weapon.equip('rifle'); syncWeaponPresentation(); };
document.querySelector('#quick')?.addEventListener('click', () => { show('<h2>SZYBKA ROZGRYWKA</h2><p>Wybierz tryb i arenę. Boty automatycznie uzupełnią skład.</p>' + modePicker('quick-mode') + '<select id="quick-map"><option value="depot">Depot — magazyn</option><option value="crossroads">Crossroads — skrzyżowanie</option><option value="foundry">Odlewnia — piec hutniczy</option><option value="alleyways">Neonowe zaułki</option><option value="citadel">Cytadela</option><option value="canal">Kanał przemysłowy</option></select><button id="start-quick-match">ZNAJDŹ MECZ</button>'); document.querySelector('#start-quick-match')?.addEventListener('click', async () => { requestControls(); const mode = (document.querySelector('#quick-mode') as HTMLSelectElement).value as import('./net/RoomConnection.js').GameMode; const mapId = (document.querySelector('#quick-map') as HTMLSelectElement).value; status.textContent = `Łączenie: ${GAME_MODES[mode].name}…`; try {
    activeMode = mode;
    await connection.quickJoin(playerName(), mode, mapId);
    dismissPanel(false); startGame();
}
catch (error) {
    status.textContent = error instanceof Error && error.message.startsWith('Nazwa') ? error.message : 'Nie udało się połączyć z serwerem.';
} }); });
document.querySelector('#training')?.addEventListener('click', () => {
    cancelReload(); trigger.release(); keys.clear(); training.reset();
    reloadBar.classList.remove('reload-bar--active');
    for (const id of Object.keys(WEAPONS) as Array<keyof typeof WEAPONS>) {
        weapon.ammo[id] = WEAPONS[id].magazine;
        weapon.reserve[id] = WEAPONS[id].reserve;
    }
    localMovementVelocity.x = 0; localMovementVelocity.z = 0;
    jumpState = { height: 0, velocity: 0, grounded: true };
    jumpQueued = false; jumpInputQueued = false;
    camera.rotation.set(0, 0, 0, 'YXZ');
    hudHealth.textContent = 'HP 100'; hudScore.textContent = 'WYNIK 0'; hudTimer.textContent = '10:00';
    teamBriefing.classList.add('hidden'); payloadHud.classList.add('hidden');
    dismissPanel(false); requestControls(); startTraining();
});
document.querySelectorAll<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => {
    const page = button.dataset.page;
    if (page === 'create') {
        show('<h2>UTWÓRZ SERWER</h2><input id="room-name" placeholder="Nazwa serwera" value="Arena gracza"/>' + modePicker('mode') + '<select id="map"><option value="depot">Depot</option><option value="crossroads">Crossroads</option><option value="foundry">Odlewnia</option><option value="alleyways">Neonowe zaułki</option><option value="citadel">Cytadela</option><option value="canal">Kanał przemysłowy</option></select><label><input id="private" type="checkbox"/> Serwer prywatny</label><button id="create-room">UTWÓRZ</button>');
        document.querySelector('#create-room')?.addEventListener('click', async () => { requestControls(); const name = (document.querySelector('#room-name') as HTMLInputElement).value; const mode = (document.querySelector('#mode') as HTMLSelectElement).value as import('./net/RoomConnection.js').GameMode; const mapId = (document.querySelector('#map') as HTMLSelectElement).value; const isPrivate = (document.querySelector('#private') as HTMLInputElement).checked; try {
            const created = await connection.create(playerName(), mode, name, isPrivate, mapId);
            status.textContent = created.roomCode ? `Serwer utworzony. Kod: ${created.roomCode}` : 'Serwer utworzony.';
            dismissPanel(false); startGame();
        }
        catch (error) {
            status.textContent = error instanceof Error && error.message.startsWith('Nazwa') ? error.message : 'Nie udało się utworzyć serwera.';
        } });
    }
    if (page === 'join') {
        show('<h2>DOŁĄCZ DO SERWERA</h2><input id="join-code" placeholder="KOD SERWERA" maxlength="6"/><button id="join-code-button">DOŁĄCZ</button><h3>PUBLICZNE SERWERY</h3><div id="server-list">Ładowanie listy…</div>');
        document.querySelector('#join-code-button')?.addEventListener('click', async () => { requestControls(); const code = (document.querySelector('#join-code') as HTMLInputElement).value; try {
            await connection.joinByCode(playerName(), code);
            status.textContent = 'Dołączono do prywatnego serwera.';
            dismissPanel(false); startGame();
        }
        catch {
            status.textContent = 'Nie znaleziono serwera o tym kodzie.';
        } });
        connection.list().then((rooms) => { const list = document.querySelector('#server-list'); if (!list)
            return; list.innerHTML = rooms.filter((room) => !room.metadata?.roomCode).map((room) => `<button class="public-server" data-id="${room.roomId}" data-mode="${room.metadata?.mode ?? 'free_for_all'}">${room.metadata?.roomName ?? 'Arena'} · ${room.clients}/${room.maxClients}</button>`).join('') || '<p>Brak publicznych serwerów.</p>'; document.querySelectorAll<HTMLButtonElement>('.public-server').forEach((button) => button.addEventListener('click', async () => { requestControls(); try {
            await connection.joinPublic(playerName(), button.dataset.id!, button.dataset.mode as import('./net/RoomConnection.js').GameMode);
            status.textContent = 'Dołączono do serwera.';
            dismissPanel(false); startGame();
        }
        catch {
            status.textContent = 'Serwer jest już pełny.';
        } })); }).catch(() => { const list = document.querySelector('#server-list'); if (list)
            list.textContent = 'Nie udało się pobrać listy.'; });
    }
    if (page === 'loadout') {
        show('<h2>WYPOSAŻENIE</h2><p>WYBIERZ GŁÓWNĄ BROŃ</p><div id="weapon-catalog">Ładowanie…</div><p id="loadout-status" role="status" aria-live="polite"></p><p>Pistolet i nóż są zawsze dostępne.</p>');
        const list = document.querySelector<HTMLElement>('#weapon-catalog')!;
        const loadoutStatus = document.querySelector<HTMLElement>('#loadout-status')!;
        const catalog = [{ id: 'smg', name: 'P-9 SPECTRE', category: 'SMG', price: 1200, description: 'Szybka, lekka broń do walki na blisko.' }, { id: 'rifle', name: 'AR-47 PULSE', category: 'RIFLE', price: 2200, description: 'Uniwersalny karabin do większości starć.' }, { id: 'sniper', name: 'LANCE-90', category: 'SNIPER', price: 4750, description: 'Celna broń na daleki dystans.' }, { id: 'shotgun', name: 'BREACH-12', category: 'SHOTGUN', price: 1600, description: 'Potężna strzelba do ciasnych przejść.' }] as const;
        const renderLoadout = (profile: import('./net/ProfileApi.js').Profile) => {
            if (!list.isConnected) return;
            list.innerHTML = catalog.map(card => `<button class="weapon-card${profile.equippedPrimaryWeapon === card.id ? ' weapon-card--equipped' : ''}" aria-pressed="${profile.equippedPrimaryWeapon === card.id}" data-weapon="${card.id}" data-weapon-category="${card.category}"><span>${card.category}</span><strong>${card.name}</strong>${weaponPreview(card.id)}<small>${card.description}</small><b>${card.price}$ ${profile.equippedPrimaryWeapon === card.id ? '· WYPOSAŻONA' : '· WYBIERZ'}</b></button>`).join('');
            list.querySelectorAll<HTMLButtonElement>('.weapon-card').forEach(button => button.addEventListener('click', async () => {
                const buttons = list.querySelectorAll<HTMLButtonElement>('.weapon-card');
                buttons.forEach(item => { item.disabled = true; });
                loadoutStatus.textContent = 'Zapisywanie…';
                try {
                    const updated = await profileApi.equipWeapon(button.dataset.weapon as import('./net/ProfileApi.js').Profile['equippedPrimaryWeapon']);
                    if (!list.isConnected) return;
                    renderLoadout(updated);
                    loadoutStatus.textContent = 'Zapisano wyposażenie.';
                } catch {
                    if (list.isConnected) loadoutStatus.textContent = 'Nie udało się zapisać broni. Spróbuj ponownie.';
                } finally {
                    buttons.forEach(item => { item.disabled = false; });
                }
            }));
        };
        void profileApi.get().then(renderLoadout).catch(() => {
            if (list.isConnected) list.textContent = 'Nie udało się wczytać wyposażenia. Otwórz panel ponownie.';
        });
    }
    if (page === 'settings') {
        show(settingsPanel(settings));
        const crosshairColor=panel.querySelector<HTMLSelectElement>('#crosshair-color')!;
        crosshairColor.value=settings.crosshairColor;
        const crosshairSize=panel.querySelector<HTMLInputElement>('#crosshair-size')!;
        for(const control of [crosshairColor,crosshairSize])control.addEventListener('input',()=>{settings.crosshairColor=crosshairColor.value;settings.crosshairSize=Number(crosshairSize.value);applyCrosshair();saveSettings(settings);});
        applyCrosshair();
        document.querySelector('#test-audio')?.addEventListener('click', () => audio.playWeaponShot('pistol'));
        panel.querySelectorAll<HTMLInputElement>('input[type=range]').forEach(input => input.addEventListener('input', () => {
            const output = panel.querySelector(`output[data-value-for="${input.id}"]`);
            if (output) output.textContent = input.value + (input.max === '100' ? '%' : '');
        }));
        const quality = document.querySelector<HTMLSelectElement>('#quality')!;
        quality.value = settings.quality;
        panel.querySelectorAll('input[type=range],select').forEach((control) => control.addEventListener('input', () => { settings.sensitivity = Number((document.querySelector('#sensitivity') as HTMLInputElement).value); settings.volume = Number((document.querySelector('#volume') as HTMLInputElement).value); settings.musicVolume = Number((document.querySelector('#music-volume') as HTMLInputElement).value); settings.effectsVolume = Number((document.querySelector('#effects-volume') as HTMLInputElement).value); settings.quality = quality.value as typeof settings.quality; if(control===quality)applyRenderQuality(renderer,sun,scene,settings.quality,devicePixelRatio); panel.querySelector('#quality-description')!.textContent=qualityDescription[settings.quality]; audio.setVolume(settings.volume / 100); audio.setChannelVolume('music', settings.musicVolume / 100); audio.setChannelVolume('effects', settings.effectsVolume / 100); saveSettings(settings); }));
        document.querySelector('#show-account-code')?.addEventListener('click', async () => { (document.querySelector('#account-status')!).textContent = `Twój kod konta: ${await profileApi.accountCode()}`; });
        document.querySelector('#restore-account-button')?.addEventListener('click', async () => { try {
            await profileApi.restore((document.querySelector('#restore-account') as HTMLInputElement).value);
            (document.querySelector('#account-status')!).textContent = 'Konto przywrócone.';
        }
        catch {
            (document.querySelector('#account-status')!).textContent = 'Nieprawidłowy kod konta.';
        } });
    }
}));
const showSkinInventory = () => {
    show('<h2>SKINY I SKRZYNKI</h2><div id="skin-inspect" aria-live="polite"></div><div id="crate-store">Ładowanie ekwipunku…</div><div id="crate-result"></div><div id="skin-list"></div>');
    let crateResult = '';
    let inspectedSkin: string | undefined;
    const inventoryRoot = document.querySelector('#skin-list');
    const draw = async () => {
        const profile = await profileApi.get();
        if (!inventoryRoot?.isConnected || document.querySelector('#skin-list') !== inventoryRoot) return;
        const crates = profile.crateCount ?? 0;
        const winsNeeded = Math.max(0, Math.ceil((300 - profile.coins) / 100));
        const store = document.querySelector('#crate-store')!;
        const result = document.querySelector('#crate-result')!;
        const list = document.querySelector('#skin-list')!;
        store.className = 'crate-store';
        result.className = crateResult.startsWith('NOWY SKIN') ? 'crate-result crate-result--win' : crateResult.startsWith('Duplikat') ? 'crate-result crate-result--duplicate' : 'crate-result';
        list.className = 'skin-list';
        applySkinPreview(profile.equippedSkinId);
        store.innerHTML = `<p>COINY: <strong>${profile.coins}</strong> · SKRZYNKI: <strong>${crates}</strong></p><p>Za zwycięstwo dostajesz +100 coinów. ${winsNeeded ? `Do następnej skrzynki: ${winsNeeded} wygrane.` : 'Stać Cię na skrzynkę!'}</p><button id="buy-crate" ${profile.coins < 300 ? 'disabled' : ''}>KUP SKRZYNKĘ — 300 COINÓW</button><button id="open-owned-crate" ${crates < 1 ? 'disabled' : ''}>OTWÓRZ SKRZYNKĘ (${crates})</button>`;
        result.textContent = crateResult;
        document.querySelector('#buy-crate')?.classList.add('button--gold');
        document.querySelector('#open-owned-crate')?.classList.add('button--primary');
        const skins = [{ id: 'recruit', name: 'Rekrut' }, { id: 'neon', name: 'Neon' }, { id: 'frost', name: 'Mróz' }, { id: 'gold', name: 'Złoty Szturm' }];
        const inspect = (id: string) => {
            inspectedSkin = id;
            const skin = skins.find(item => item.id === id) ?? skins[0];
            const owned = profile.ownedSkinIds.includes(skin.id);
            document.querySelector('#skin-inspect')!.innerHTML = `${skinPreview(skin.id)}<div><small>PODGLĄD WYGLĄDU</small><h3>${skin.name}</h3><p>${profile.equippedSkinId === skin.id ? 'Aktualnie wyposażony' : owned ? 'Posiadasz ten skin' : 'Zablokowany — dostępny ze skrzynek'}</p><p class="skin-disclaimer">Wygląd nie zmienia obrażeń ani zdrowia.</p></div>`;
            list.querySelectorAll<HTMLButtonElement>('[data-preview-skin]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewSkin === skin.id)));
        };
        list.innerHTML = `<h3>KOLEKCJA / ${profile.ownedSkinIds.length} Z ${skins.length}</h3>${skins.map((skin) => `<article class="skin-tile"><button class="skin-preview-button" data-preview-skin="${skin.id}" aria-label="Obejrzyj ${skin.name}">${skinPreview(skin.id)}<strong>${skin.name}</strong></button><button class="equip-skin" data-skin="${skin.id}" ${profile.ownedSkinIds.includes(skin.id) ? '' : 'disabled'}>${profile.equippedSkinId === skin.id ? 'WYPOSAŻONY' : profile.ownedSkinIds.includes(skin.id) ? 'WYPOSAŻ' : 'ZABLOKOWANY'}</button></article>`).join('')}`;
        list.querySelectorAll<HTMLButtonElement>('[data-preview-skin]').forEach(button => button.addEventListener('click', () => {
            inspect(button.dataset.previewSkin!);
            document.querySelector('#skin-inspect')?.scrollIntoView({ block: 'nearest' });
        }));
        inspect(inspectedSkin ?? profile.equippedSkinId);
        document.querySelectorAll<HTMLButtonElement>('.equip-skin').forEach((button) => button.classList.add('skin-card'));
        document.querySelector('#buy-crate')?.addEventListener('click', async () => { try {
            await profileApi.buyCrate();
            crateResult = 'Skrzynka kupiona. Teraz ją otwórz!';
            await draw();
        }
        catch (error) {
            crateResult = error instanceof Error ? error.message : 'Nie udało się kupić skrzynki.';
            await draw();
        } });
        document.querySelector('#open-owned-crate')?.addEventListener('click', async () => { try {
            const prize = await profileApi.openCrate();
            crateResult = prize.duplicate ? 'Duplikat: +50 coinów.' : `NOWY SKIN: ${prize.skinId.toUpperCase()}!`;
            await draw();
        }
        catch (error) {
            crateResult = error instanceof Error ? error.message : 'Nie udało się otworzyć skrzynki.';
            await draw();
        } });
        document.querySelectorAll<HTMLButtonElement>('.equip-skin').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; try { const updated = await profileApi.equip(button.dataset.skin!); applySkinPreview(updated.equippedSkinId); inspectedSkin = updated.equippedSkinId; await draw(); } catch { button.disabled = false; result.textContent = 'Nie udało się wyposażyć skina. Spróbuj ponownie.'; } }));
    };
    void draw().catch(() => {
        if (inventoryRoot?.isConnected) inventoryRoot.textContent = 'Nie udało się wczytać kolekcji. Otwórz ją ponownie.';
    });
};
document.querySelectorAll<HTMLButtonElement>('[data-page="skins"]').forEach((button) => button.addEventListener('click', showSkinInventory));
let buySnapshotRoom: object | undefined;
let ammoSnapshotRoom: object | undefined;
let audioSnapshotRoom: object | undefined;
setInterval(() => {
    if (!connection.room || connection.room === buySnapshotRoom)
        return;
    buySnapshotRoom = connection.room;
    connection.onSnapshot((snapshot) => {
        const local = snapshot.players.find((player) => player.id === connection.room?.sessionId);
        if (!local)
            return;
        buyPanel.querySelector('#buy-cash')!.textContent = formatBuyCash(local.cash);
        if (snapshot.phase === 'buy') {
            weapon.equip(local.primaryWeaponId as 'pistol' | 'smg' | 'rifle' | 'sniper' | 'shotgun');
            syncWeaponPresentation();
            buyPanel.querySelector('#buy-help')!.textContent = `Wyposażono: ${local.primaryWeaponId.toUpperCase()}`;
            buyPanel.querySelectorAll<HTMLButtonElement>('[data-buy-weapon]').forEach((button) => {
                const weaponId = button.dataset.buyWeapon as keyof typeof BUY_PRICES;
                button.disabled = BUY_PRICES[weaponId] > local.cash;
                button.classList.toggle('buy-weapon-card--equipped', weaponId === local.primaryWeaponId);
                button.setAttribute('aria-pressed',String(weaponId === local.primaryWeaponId));
            });
        }
    });
}, 50);
setInterval(() => {
    if (!connection.room || connection.room === audioSnapshotRoom)
        return;
    audioSnapshotRoom = connection.room;
    connection.onSnapshot((snapshot) => {
        const music = snapshot.phase === 'buy' ? 'buy' : snapshot.phase === 'playing' ? 'match' : snapshot.phase === 'finished' ? 'none' : 'none';
        void audio.transitionTo(music);
        if (snapshot.phase === 'countdown' && snapshot.countdownSeconds !== undefined)
            audio.playCountdownSecond(snapshot.countdownSeconds);
        else
            audio.resetCountdown();
    });
    connection.onHit((hit) => {
        audio.playSfx(hit.targetId === connection.room?.sessionId ? 'damage' : 'hit');
        if (hit.targetId !== connection.room?.sessionId)
            return;
        const attacker = playerPositions.get(hit.shooterId);
        if (attacker)
            showDamageIndicator(damageIndicatorAngle(camera.rotation.y, { x: camera.position.x, z: camera.position.z }, attacker));
    });
    connection.onKill(() => audio.playSfx('kill'));
    connection.onPing(() => audio.playSfx('ping'));
    connection.onMatchResult((result) => audio.playSfx(result.draw ? 'defeat' : result.winnerPlayerId === connection.room?.sessionId ? 'victory' : 'defeat'));
}, 50);
setInterval(() => {
    if (!connection.room || connection.room === ammoSnapshotRoom)
        return;
    ammoSnapshotRoom = connection.room;
    connection.onAmmo((state) => {
        if (state.playerId !== connection.room?.sessionId)
            return;
        if (state.reloaded && state.weaponId === reloadWeaponId) { weapon.reloading = false; reloadEndsAt = 0; reloadBar.classList.remove('reload-bar--active'); }
        weapon.ammo[state.weaponId] = state.ammo;
        weapon.reserve[state.weaponId] = state.reserve;
        hudAmmo.textContent = ammoText();
    });
}, 50);
