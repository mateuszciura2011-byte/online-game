# PolyStrike Full Game Repair, Style and Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair PolyStrike end to end and deliver a coherent original low-poly 5v5 shooter with industrial-neon visuals, licensed music and complete gameplay audio.

**Architecture:** Colyseus remains authoritative for phases, movement, purchases, health and results. The Three.js client is split out of the current monolithic `main.ts` into focused session, input, HUD, menu, rendering and audio modules; UI appearance lives in CSS rather than injected style strings.

**Tech Stack:** TypeScript 5.7, Vite 6, Three.js 0.180, Colyseus 0.18, Vitest 3, Playwright, Web Audio API, `.ogg`/`.mp3` assets.

**Spec:** `docs/superpowers/specs/2026-08-29-full-game-repair-style-audio-design.md`

## Global Constraints

- Use only original names, maps and art; do not copy Counter-Strike assets, music, voices or UI.
- Preserve existing profiles, statistics, coins, crates, owned skins and account restore codes.
- The server validates movement, fire, purchases, damage, phases and rewards.
- Every behavior change starts with a failing test and ends with client, server, shared and browser verification.
- Every external audio asset must be documented in `apps/client/public/audio/LICENSES.md` with title, author, source URL, license and attribution.
- The project is not a Git repository. Replace commit steps with a verified checkpoint: list changed files and record passing commands in the task log.
- Deploy only after all verification commands pass, to `C:\Users\lukas\Desktop\online`.

---

### Task 1: Establish a clean baseline and split client ownership

**Files:**
- Create: `apps/client/src/app/GameApp.ts`
- Create: `apps/client/src/input/PointerControls.ts`
- Create: `apps/client/src/ui/HudView.ts`
- Create: `apps/client/src/ui/MenuView.ts`
- Modify: `apps/client/src/main.ts`
- Test: `apps/client/src/input/PointerControls.test.ts`
- Test: `apps/client/src/ui/HudView.test.ts`

**Interfaces:**
- Produces: `PointerControls.attach(canvas)`, `PointerControls.release()`, `HudView.render(snapshot)`, `MenuView.open(page)`, `GameApp.start()`.
- Consumes: existing `RoomConnection`, `WeaponView`, `ProfileApi`, map builders and settings.

- [ ] **Step 1: Write failing ownership tests**

```ts
expect(pointer.shouldCapture({ phase: 'playing', menuOpen: false })).toBe(true);
expect(pointer.shouldCapture({ phase: 'buy', menuOpen: false })).toBe(false);
expect(formatHud({ health: 72, cash: 800, weapon: 'rifle', ammo: 24, reserve: 96 }))
  .toMatchObject({ health: 'HP 72', cash: '$800', ammo: '24 / 96' });
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm --dir apps/client run test -- src/input/PointerControls.test.ts src/ui/HudView.test.ts`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Move behavior without changing gameplay**

Create the exported APIs above. `main.ts` must only construct dependencies, call `new GameApp(...)` and start it. Move pointer-lock lifecycle into `PointerControls`, HUD DOM creation/update into `HudView`, and menu panel rendering into `MenuView`.

- [ ] **Step 4: Remove injected UI style strings**

Delete `uxStyle`, `hudStyle`, `menuStyle` and `buyPhaseStyle` creation from `main.ts`. Move their rules to `apps/client/src/style.css` without changing selectors yet.

- [ ] **Step 5: Verify the checkpoint**

Run: `pnpm --dir apps/client run test && pnpm --dir apps/client run typecheck && pnpm test:e2e`

Expected: all existing tests pass and menu/training/quick match remain reachable.

---

### Task 2: Make the 5v5 match lifecycle fully authoritative

**Files:**
- Create: `apps/server/src/match/MatchClock.ts`
- Modify: `packages/shared/src/protocol.ts`
- Modify: `packages/shared/src/state.ts`
- Modify: `apps/server/src/rooms/GameRoom.ts`
- Modify: `apps/client/src/net/RoomConnection.ts`
- Test: `apps/server/src/match/MatchClock.test.ts`
- Test: `apps/server/src/rooms/GameRoom.test.ts`

**Interfaces:**
- Produces: `MatchPhase = 'lobby' | 'countdown' | 'buy' | 'playing' | 'finished'`, `MatchClock.advance(now)`, typed `LobbySnapshot` and `GameSnapshot`.
- Consumes: `GameMode`, player state, buy rules and match result rules.

- [ ] **Step 1: Write failing phase-transition tests**

```ts
const clock = new MatchClock({ countdownMs: 10_000, buyMs: 15_000, matchMs: 600_000 });
expect(clock.advance(10_000).phase).toBe('buy');
expect(clock.advance(25_000).phase).toBe('playing');
expect(clock.advance(625_000).phase).toBe('finished');
```

- [ ] **Step 2: Verify RED**

Run: `pnpm --dir apps/server run test -- src/match/MatchClock.test.ts`

Expected: FAIL because `MatchClock` is absent.

- [ ] **Step 3: Implement deterministic match timing**

Move all `Date.now()` phase calculations out of `GameRoom` into `MatchClock`. Include `phaseEndsAt`, `countdownSeconds`, `remainingSeconds`, `roundNumber`, blue score and red score in snapshots.

- [ ] **Step 4: Enforce phase gates**

Reject `input` and `fire` outside `playing`; accept `buy` only during `buy`; clear velocity when leaving `playing`; reset round weapons, ammo, health and spawn protection when a round starts.

- [ ] **Step 5: Verify server and protocol**

Run: `pnpm --dir packages/shared run test && pnpm --dir apps/server run test && pnpm --dir apps/server run typecheck && pnpm --dir apps/client run typecheck`

Expected: all suites pass with no untyped snapshot fields.

---

### Task 3: Stabilize movement, pointer lock and collision

**Files:**
- Modify: `packages/shared/src/config/movement.ts`
- Modify: `apps/server/src/simulation/World.ts`
- Modify: `apps/client/src/game/GroundMovement.ts`
- Modify: `apps/client/src/input/PointerControls.ts`
- Test: `apps/server/src/simulation/World.test.ts`
- Test: `apps/client/src/game/GroundMovement.test.ts`
- Test: `tests/e2e/match.spec.ts`

**Interfaces:**
- Produces: `simulatePlayer(state, input, dt, colliders)`, `groundMoveDelta(yaw, forward, side, speed, dt)`, pointer state events.
- Consumes: shared `MOVEMENT` configuration and map colliders.

- [ ] **Step 1: Add failing movement contracts**

```ts
expect(length(groundMoveDelta(0, 1, 1, 3.6, 1))).toBeCloseTo(3.6);
expect(simulatePlayer(base, forward, 1, thinWall).z).toBe(0);
expect(simulatePlayer(base, forward, 1 / 20, []).y).toBe(0);
```

- [ ] **Step 2: Verify RED and implement**

Run: `pnpm --dir apps/server run test -- src/simulation/World.test.ts && pnpm --dir apps/client run test -- src/game/GroundMovement.test.ts`

Normalize diagonal input, use frame-rate-independent acceleration/braking, keep swept collision checks for thin walls, and clamp training bounds.

- [ ] **Step 3: Add pointer-lock browser coverage**

In Playwright, start training, click the canvas, assert `document.pointerLockElement === canvas` when supported, press Escape, and assert the cursor/menu return without duplicate overlays.

- [ ] **Step 4: Verify the checkpoint**

Run: `pnpm --dir packages/shared run test && pnpm --dir apps/server run test && pnpm --dir apps/client run test && pnpm test:e2e`

---

### Task 4: Complete weapon feel and server combat

**Files:**
- Modify: `packages/shared/src/config/weapons.ts`
- Create: `apps/client/src/game/WeaponController.ts`
- Modify: `apps/client/src/game/WeaponView.ts`
- Modify: `apps/server/src/combat/CombatSystem.ts`
- Modify: `apps/server/src/rooms/GameRoom.ts`
- Test: `packages/shared/src/config/weapons.test.ts`
- Test: `apps/client/src/game/WeaponController.test.ts`
- Test: `apps/client/src/game/WeaponView.test.ts`
- Test: `apps/server/src/combat/CombatSystem.test.ts`
- Test: `apps/server/src/rooms/GameRoom.test.ts`

**Interfaces:**
- Produces: `WeaponController.fire(now)`, `reload()`, `equip(id)`, `getViewState()`, authoritative `FireResult`.
- Consumes: `WeaponId`, `WEAPONS`, purchased primary weapon and server time.

- [ ] **Step 1: Write failing configuration and combat tests**

```ts
expect(Object.keys(WEAPONS)).toEqual(['knife', 'pistol', 'smg', 'rifle', 'sniper', 'shotgun']);
expect(resolveShot({ weaponId: 'shotgun', distance: 8, pelletsHit: 5 }).damage).toBeGreaterThan(0);
expect(canFire({ ownedPrimary: 'smg' }, 'rifle')).toBe(false);
```

- [ ] **Step 2: Implement one authoritative path**

The client sends origin, direction, sequence and weapon ID. The server validates ownership, rate of fire, range, target cone, friendly fire and ammo. The server emits `hit`, `kill`, `ammo` and `damage` messages; the client displays them but never decides damage.

- [ ] **Step 3: Add view feedback**

Implement recoil return, muzzle flash, reload timing, empty-magazine feedback, hit marker and weapon-specific low-poly view geometry. Do not play a shot effect when `fire()` returns false.

- [ ] **Step 4: Verify the checkpoint**

Run: `pnpm --dir packages/shared run test && pnpm --dir apps/server run test && pnpm --dir apps/client run test && pnpm typecheck`

---

### Task 5: Repair bots, spawns and maps

**Files:**
- Modify: `apps/server/src/bots/BotController.ts`
- Modify: `apps/server/src/match/SpawnSelector.ts`
- Modify: `apps/server/src/simulation/Maps.ts`
- Modify: `apps/client/src/maps/Depot.ts`
- Modify: `apps/client/src/maps/Crossroads.ts`
- Modify: `apps/client/src/maps/Foundry.ts`
- Test: bot, spawn and map tests.

**Interfaces:**
- Produces: `chooseBotAction(bot, enemies, now)`, `selectSafeSpawn(team, players, spawns)`, matching visual/collision map definitions.
- Consumes: team assignments, alive players and authoritative colliders.

- [ ] **Step 1: Write failing team and spawn tests**

```ts
expect(chooseBotAction(blueBot, [blueAlly, redEnemy], now).targetId).toBe(redEnemy.id);
expect(selectSafeSpawn('blue', players, spawns).team).toBe('blue');
expect(mapColliders('foundry')).toHaveLength(5);
```

- [ ] **Step 2: Implement stable bot behavior**

Bots acquire only living enemies, rotate gradually, stop before obstacles, fire within weapon range, and respawn after the same delay as humans. Quick match creates exactly five blue and five red slots.

- [ ] **Step 3: Align visual maps and collision maps**

Give each map clear spawns, two main routes, one central conflict area, cover sized for the player capsule and industrial-neon landmark colors. Every rendered blocking object gets a matching server collider.

- [ ] **Step 4: Verify the checkpoint**

Run: `pnpm --dir apps/server run test && pnpm --dir apps/client run test -- src/maps/Maps.test.ts && pnpm typecheck`

---

### Task 6: Repair menu, profiles, skins and crates

**Files:**
- Modify: `apps/client/src/ui/MenuView.ts`
- Create: `apps/client/src/ui/ProfileView.ts`
- Create: `apps/client/src/ui/InventoryView.ts`
- Modify: `apps/client/src/net/ProfileApi.ts`
- Modify: `apps/server/src/profile/ProfileStore.ts`
- Modify: `apps/server/src/profile/CrateService.ts`
- Test: profile, inventory and crate tests.

**Interfaces:**
- Produces: `ProfileView.render(profile)`, `InventoryView.render(profile)`, existing profile REST endpoints with typed errors.
- Consumes: account code, profile, owned skins, equipped skin/weapon, coins, crates and match rewards.

- [ ] **Step 1: Write failing economy and duplicate tests**

```ts
expect(buyCrate(profileWith300Coins)).toMatchObject({ coins: 0, crateCount: 1 });
expect(openDuplicate(profileWithCrate)).toMatchObject({ crateCount: 0, coins: 50 });
expect(awardVictory(profile, sameMatchIdTwice).coins).toBe(100);
```

- [ ] **Step 2: Implement clear menu flows**

Use one modal container and one close action. Keep quick 5v5, servers, training, skins/crates, loadout, account, statistics and settings separate. Show disabled actions with an explanation, not a silent button.

- [ ] **Step 3: Verify persistence and account transfer**

Test reload, code restore, invalid code, skin equip, weapon equip, crate purchase/open and duplicate refund.

- [ ] **Step 4: Verify the checkpoint**

Run: `pnpm --dir apps/server run test && pnpm --dir apps/client run test && pnpm test:e2e`

---

### Task 7: Apply the industrial-neon visual system

**Files:**
- Create: `apps/client/src/styles/tokens.css`
- Create: `apps/client/src/styles/menu.css`
- Create: `apps/client/src/styles/hud.css`
- Create: `apps/client/src/styles/panels.css`
- Modify: `apps/client/src/style.css`
- Modify: `apps/client/src/vfx/ArenaAtmosphere.ts`
- Test: `apps/client/src/vfx/ArenaAtmosphere.test.ts`
- Test: `tests/e2e/visual.spec.ts`

**Interfaces:**
- Produces: CSS variables `--blue-team`, `--red-team`, `--reward`, `--danger`, reusable `.panel`, `.action`, `.hud-card`, `.team-badge`.
- Consumes: DOM emitted by `MenuView`, `HudView`, `ProfileView` and `InventoryView`.

- [ ] **Step 1: Define tokens and remove cascade conflicts**

```css
:root {
  --bg-0: #030914;
  --bg-1: #071827;
  --blue-team: #27d8ff;
  --red-team: #ff8a3d;
  --reward: #ffd45b;
  --danger: #ff537d;
}
```

Import the four style files once from `style.css`. No UI CSS remains embedded in TypeScript.

- [ ] **Step 2: Restyle menu and HUD**

Keep the animated skin preview, add active/focus/disabled states, constrain overlays to safe areas, make the buy panel usable at 1280×720, and ensure the crosshair remains unobstructed.

- [ ] **Step 3: Improve scene readability**

Use team rim colors, restrained emissive materials, distance fog, directional key light and pooled particles. Quality settings disable expensive particles and lower pixel ratio without changing gameplay.

- [ ] **Step 4: Add fixed-view visual checks**

Playwright captures menu, buy phase, playing HUD, inventory and results at 1280×720. Assertions verify no horizontal scroll, no overlay covers the crosshair, and primary actions remain visible.

- [ ] **Step 5: Verify the checkpoint**

Run: `pnpm --dir apps/client run test && pnpm --dir apps/client run typecheck && pnpm exec playwright test tests/e2e/visual.spec.ts`

---

### Task 8: Add licensed music and complete game audio

**Files:**
- Create: `apps/client/src/audio/AudioManifest.ts`
- Replace: `apps/client/src/audio/AudioDirector.ts`
- Modify: `apps/client/src/audio/AudioDirector.test.ts`
- Create: `apps/client/public/audio/LICENSES.md`
- Add: `apps/client/public/audio/music/menu.ogg`
- Add: `apps/client/public/audio/music/buy.ogg`
- Add: `apps/client/public/audio/music/match.ogg`
- Add: `apps/client/public/audio/stingers/victory.ogg`
- Add: `apps/client/public/audio/stingers/defeat.ogg`
- Add: weapon, UI, footsteps and crate effects under `apps/client/public/audio/sfx/`.

**Interfaces:**
- Produces: `AudioDirector.unlock()`, `transitionTo('menu' | 'buy' | 'match' | 'none')`, `playSfx(id)`, `setChannelVolume(channel, value)`, `stopAll()`.
- Consumes: match phase, weapon events, profile events and settings volumes.

- [ ] **Step 1: Write failing audio lifecycle tests**

```ts
await audio.transitionTo('menu');
expect(audio.currentMusic()).toBe('menu');
await audio.transitionTo('match');
expect(audio.activeMusicTracks()).toHaveLength(1);
audio.setChannelVolume('music', 2);
expect(audio.getChannelVolume('music')).toBe(1);
```

- [ ] **Step 2: Verify RED and implement the audio graph**

Run: `pnpm --dir apps/client run test -- src/audio/AudioDirector.test.ts`

Use one `AudioContext`, gain nodes for master/music/effects/UI, HTMLAudioElement or decoded buffers for loops, and 600 ms crossfades. `unlock()` is called from the first click. Failed loads are caught and reported once without stopping gameplay.

- [ ] **Step 3: Integrate events**

Map menu, buy, match and results phases to music. Map footsteps, fire, reload, empty, hit, damage, kill, countdown, buy, ping, crate and result events to SFX. Rate-limit footsteps and countdown ticks.

- [ ] **Step 4: Document and validate assets**

For every file, add a complete line to `LICENSES.md`. Reject assets without explicit game-use permission. Convert source WAV files to `.ogg` and `.mp3`, normalize loudness, trim silence and keep loops gapless.

- [ ] **Step 5: Verify the checkpoint**

Run: `pnpm --dir apps/client run test && pnpm --dir apps/client run typecheck && pnpm test:e2e`

Manually verify that only one music loop plays, sliders change the correct channels, and muting music does not mute weapon effects.

---

### Task 9: Complete end-to-end coverage and deploy

**Files:**
- Modify: `tests/e2e/match.spec.ts`
- Modify: `tests/e2e/visual.spec.ts`
- Create: `tests/e2e/profile.spec.ts`
- Create: `docs/verification/2026-08-29-full-game-repair.md`
- Deploy verified files to: `C:\Users\lukas\Desktop\online`

**Interfaces:**
- Consumes all previous modules.
- Produces a verified local build and a written test record.

- [ ] **Step 1: Cover complete user journeys**

Add Playwright journeys for quick 5v5 through buy phase, server creation/join, pointer controls, death/spectator/respawn, training bounds, account restore, crate buy/open, audio settings and Victory/Defeat.

- [ ] **Step 2: Run the complete verification matrix**

Run:

```powershell
pnpm --dir packages/shared run test
pnpm --dir apps/server run test
pnpm --dir apps/client run test
pnpm typecheck
pnpm build
pnpm test:e2e
```

Expected: zero failed tests, zero TypeScript errors and successful production builds.

- [ ] **Step 3: Record evidence**

Write command results, test counts, known browser warnings, checked resolutions and manual audio checks to `docs/verification/2026-08-29-full-game-repair.md`.

- [ ] **Step 4: Deploy exact verified files**

Copy the verified project to `C:\Users\lukas\Desktop\online`, restart the Vite and Colyseus processes, then confirm HTTP 200 from `http://127.0.0.1:5173/` and `http://127.0.0.1:2567/servers`.

- [ ] **Step 5: Run smoke tests against the deployed runtime**

Run `pnpm exec playwright test --reporter=list` with the deployed services active. Do not report completion until every journey passes against the deployed copy.
