# Statistics panel request ownership

The statistics panel opens immediately with a loading state. Success and error
responses only update its captured content element while still connected and
visible; they no longer call show() and replace a newer panel.

A delayed-response browser regression failed before the change and passed after
it. Seven browser tests covering panel replacement, save failure/retry, account
restoration, crates and settings passed. All 226 unit tests and client TypeScript
validation passed.
