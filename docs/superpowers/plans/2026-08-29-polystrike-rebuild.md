# PolyStrike Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a coherent original low-poly 5v5 browser shooter.

**Architecture:** Keep Colyseus server authoritative for the match state and use Three.js client modules for UI, input and rendering. Replace incremental UI wiring with isolated match, buy and menu modules.

**Tech Stack:** TypeScript, Vite, Three.js, Colyseus, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-29-polystrike-rebuild-design.md`

## Global Constraints

- Original low-poly art and names only.
- Server validates movement, firing, phase and purchases.
- Every behavior change starts with a failing test.

### Task 1: Rebuild match phase and round economy

**Files:** `apps/server/src/rooms/GameRoom.ts`, `apps/server/src/match/BuyPhase.ts`, tests alongside them.

- [ ] Add failing tests for 5v5 lobby, countdown, purchase phase and server-validated cash.
- [ ] Make each player state own `cash` and `purchasedWeaponId`.
- [ ] Add a validated `buy` message and expose cash in snapshots.
- [ ] Test server suite and typecheck.

### Task 2: Rebuild client buy HUD and input gates

**Files:** `apps/client/src/main.ts`, `apps/client/src/ui/BuyPhase.ts`, related tests.

- [ ] Add a failing UI-format test for cash and selected weapon.
- [ ] Render buy panel only from server phase and snapshot cash.
- [ ] Send purchases to the server; display accepted/rejected result.
- [ ] Ensure pointer lock and movement only activate in playing phase.

### Task 3: Rebuild menu paths

**Files:** `apps/client/src/main.ts`, `apps/client/src/style.css`, menu tests.

- [ ] Make quick match default to 5v5.
- [ ] Keep server join/create, training, skins, equipment, account and settings as separate panels.
- [ ] Remove duplicate/legacy panel paths.

### Task 4: Stabilise gameplay

**Files:** movement, combat, bot and map modules with tests.

- [ ] Verify normalized WASD movement and collision bounds.
- [ ] Verify firing, reload, respawn and bots through server snapshots.
- [ ] Verify training has ground bounds and compact guidance.

### Task 5: End-to-end verification and deployment

**Files:** `tests/e2e/match.spec.ts`, Desktop runtime copy.

- [ ] Test quick 5v5, buy phase, training and menu collection in Chromium.
- [ ] Run all tests and typechecks.
- [ ] Copy verified runtime files to `C:\Users\lukas\Desktop\online` and restart local game server.
