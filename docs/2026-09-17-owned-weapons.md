# Weapon selection follows the match inventory

## Reproduced problem

The keyboard handler equipped every weapon locally, even when the server only
allowed the player's primary, pistol and knife. This produced a visible weapon
whose shots the server rejected. Selecting the already-held weapon also cancelled
reloads unnecessarily.

## Change

- Multiplayer selection uses the primary reported in the latest local-player snapshot.
- Pistol and knife remain available; unowned choices leave the current weapon and reload untouched.
- Selecting the already-held weapon does not interrupt its reload.
- Training retains access to every weapon for practice.
- Existing key assignments are unchanged.

## Verification

The new multiplayer browser regression failed before the fix (an unowned sniper
appeared instead of the pistol) and passed after it. It verifies reload completion
after ignored choices, then switching to the owned rifle and knife. A separate
browser case exercises the unrestricted training inventory.

Client TypeScript check and production build passed. All 214 unit tests passed.
The complete browser suite passed: 30 scenarios, including both new regressions.
The build retains the pre-existing warning about the main JavaScript bundle size.
