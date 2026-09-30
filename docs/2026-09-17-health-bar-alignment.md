# Camera-aligned player health bars

The previous overhead plane looked toward the scene origin, not the active
camera. It could turn edge-on while the viewer moved. Its health-dependent
offset was also applied in the soldier's local X axis, so reducing health moved
the bar sideways in the wrong direction when the soldier turned.

RemotePlayers.render now receives the active camera. The health plane cancels
its parent world rotation and adopts the camera's world rotation. Its shrinking
offset is transformed in the same frame, preserving the left edge. Existing
team colours, character skins and health values are unchanged. Quaternion
temporaries are reused rather than allocated for each player on each frame.

Two geometry regressions failed before the fix and passed after it: camera
alignment at several soldier headings and a stationary left edge at 100/50/0 HP.
All 216 unit tests and the client TypeScript check passed.
All 30 browser scenarios passed. Production build passed with the existing
large-bundle warning (main JavaScript approximately 741 kB before compression).
