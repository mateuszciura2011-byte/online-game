# Loadout request lifecycle and recovery

The loadout panel previously left save rejections unhandled and looked up its
catalog again after a delayed profile request. Closing it and opening settings
could produce a null.innerHTML exception. Both failures were reproduced with
browser tests before changing the implementation.

The panel now retains its own DOM references, ignores results after replacement,
reports load/save failures, and disables selection during a save. Successful
saves render the server-returned profile without a second GET. Failed saves
preserve the equipped selection and re-enable the controls for retry.

Client TypeScript validation passed. Browser regressions cover failed save/retry
and delayed loading after switching panels.
