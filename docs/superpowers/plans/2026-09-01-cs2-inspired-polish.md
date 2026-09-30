# CS2-inspired Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PolyStrike's match flow clearer and closer in feel to the supplied CS2 reference while retaining original low-poly art.

**Architecture:** Preserve the existing Three.js match and Colyseus networking. Add presentation-only UI around the existing quick-match and lobby data, then validate both visual state and join flow in Playwright.

**Tech Stack:** TypeScript, Three.js, DOM/CSS, Vitest, Playwright.

**Spec:** User-approved reference recording `Nagrywanie ekranu 2026-09-01 161141.mp4`.

## Global Constraints

- Retain low-poly geometry and original PolyStrike names/art.
- Do not copy CS2 graphics, maps, sounds, or text.
- Every behavior change follows a red-green test cycle.

---

### Task 1: Map-card quick match

**Files:**
- Modify: `apps/client/src/main.ts`
- Modify: `apps/client/src/style.css`
- Test: `tests/e2e/visual.spec.ts`

- [ ] Write a failing Playwright test asserting that quick match shows a selectable map card with a map name and mode label.
- [ ] Run that test and confirm it fails because cards do not exist.
- [ ] Render existing map definitions as accessible buttons; selection updates the existing quick-match map value.
- [ ] Style cards with original low-poly colors, selected state and compact map description.
- [ ] Run the focused Playwright test and TypeScript check.

### Task 2: Pre-round team briefing

**Files:**
- Modify: `apps/client/src/main.ts`
- Modify: `apps/client/src/style.css`
- Test: `tests/e2e/match.spec.ts`

- [ ] Write a failing browser test for a team-mode briefing that shows both team names before play.
- [ ] Run the test and confirm it fails.
- [ ] Use the existing lobby player/team data to populate the briefing during countdown and buy phases.
- [ ] Keep the briefing compact and hide it when the round starts.
- [ ] Run its focused test and the full match test file.

### Task 3: Match HUD and pause polish

**Files:**
- Modify: `apps/client/src/main.ts`
- Modify: `apps/client/src/style.css`
- Test: `tests/e2e/visual.spec.ts`, `tests/e2e/match.spec.ts`

- [ ] Write a failing test that the paused match retains the match HUD and uses in-game controls.
- [ ] Run it and confirm the target behavior is absent.
- [ ] Refine spacing, hierarchy and labels for score, phase, objective and pause without covering the crosshair.
- [ ] Run focused tests, TypeScript and the complete browser suite.
