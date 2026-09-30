# Shared profile initialization

Concurrent profile consumers previously created separate anonymous accounts.
Initialization now shares one pending promise, cleared after success or failure
so a failed request can be retried. Resume failures other than the server's
explicit 401 invalid-account response no longer fall through to account creation.
Failed creation responses cannot be persisted as a session.

An explicit login/restore that completes during initialization is retained rather
than overwritten by the late initialization result.

Three regression tests failed before the fix and passed after it. All 224 unit
tests and client TypeScript validation passed. Six browser tests passed covering
account restoration, crates, settings, skin previews and profile match loadout.
Tests use synthetic account identifiers; existing profile data was not edited.
