# Reject unsuccessful profile and statistics responses

ProfileApi.get and getStats now check HTTP success before returning parsed data.
Previously JSON error responses were cast as valid profile/statistics objects,
allowing the statistics panel to render undefined and NaN instead of its existing
error message.

Both new API regressions failed before the fix. A browser regression also failed
before the change and passed afterward: an intercepted 503 displays the error,
and reopening the statistics panel after server recovery displays real statistics.

Verification: 226 unit tests passed, client TypeScript passed, and six browser
tests passed for errors/recovery, accounts, crates, settings and skin previews.
