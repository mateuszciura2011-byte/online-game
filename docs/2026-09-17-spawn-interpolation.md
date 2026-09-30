# Spawn and round interpolation boundaries

Remote snapshots now carry a client-side continuity key built from the server's
round number and phase. Interpolation holds the previous pose across a phase,
round, or alive-state change, then adopts the new pose at its timestamp. Walking
animation also ignores displacement across that boundary. Ordinary within-round
movement and shortest-arc rotation interpolation remain unchanged.

A separate regression exposed division by zero when two received updates had the
same timestamp: position and yaw became NaN. The sampler now returns the latest
received update at that timestamp instead of interpolating a zero-length interval.

Three new tests reproduced the failures before their fixes. All 221 unit tests
and the client TypeScript check passed. Respawn geometry is covered by unit
tests; the browser regression suite does not simulate a complete death/respawn.
