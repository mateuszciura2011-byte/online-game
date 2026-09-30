# Skins in multiplayer

The equipped profile skin now accompanies all four join paths (quick match,
create, room code, public room). The server resolves the opaque account token
against AccountService, verifies ownership and known skin IDs, then sends only
the cosmetic ID in snapshots. Invalid or absent credentials use recruit.
Client-submitted cosmetic IDs cannot unlock cosmetics.

Remote characters apply neon/frost/gold armour and helmet palettes independently
from team markers. Skins do not affect hitboxes, movement, damage or weapon stats.
Equipment is captured when joining a match; changing it live within a match is
not implemented. These are material variants of the existing low-poly models,
not newly imported character assets. Bots remain recruits.

Browser integration testing also exposed intentional departures waiting for
reconnection: Colyseus uses close code 4000. The room now distinguishes that
from an unexpected disconnect, while retaining the reconnect window for drops.

Tests cover owned/unowned/invalid skins, authenticated snapshot output, token
exclusion, independent model materials/team colours, and voluntary departure.
Browser test uses two actual clients and rejects a forged gold skin.

Verification: 203 unit tests passed; 26 browser tests passed; client/server
TypeScript checks passed; production build passed (existing large-bundle warning).
Read-only review found no critical/important issue. Remaining coverage gap:
owned non-default skin is verified with in-memory server and renderer tests,
not with a persisted non-default account in the browser integration test.
