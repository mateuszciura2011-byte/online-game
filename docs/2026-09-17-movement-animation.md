# Remote walking follows rendered motion

RemotePlayers previously decided whether to animate legs from the newest two
network packets, while position rendering sampled an older interpolation window.
A newly received stop could freeze the legs while the model was still moving;
missing packets could leave a stationary model running indefinitely.

Walking detection now compares samples in the displayed timeline (100 ms render
delay and a 50 ms motion window). Once both samples clamp to the last known
position, the legs return to idle. Dead samples cannot trigger a walking step.

Both new regressions failed before the fix and passed after it. The older walking
test now samples the moving interval rather than a time beyond the last packet.
All 218 unit tests and the client TypeScript check passed.
All 11 browser scenarios in match.spec.ts and combat-upgrade.spec.ts passed,
covering multiplayer entry, sprint, firing, reload, training, pause and buy phase.
