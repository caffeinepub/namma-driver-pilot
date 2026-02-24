# Specification

## Summary
**Goal:** Add a hidden admin recovery route and backend function that allows any logged-in user to upgrade their role to admin using a secret code.

**Planned changes:**
- Add a new backend function `upgradeCurrentUserToAdmin(code : Text)` to the existing main actor that overwrites the caller's role to `#admin` in existing user profile storage if the code matches `"NAMMA5600"`, otherwise returns an error result with message `"Invalid admin code"`
- Add a new frontend route `/admin/upgrade` (accessible to any logged-in user, not linked anywhere in the UI) that renders a title "Admin Upgrade", a text input labelled "Enter Admin Setup Code", and a button labelled "Upgrade to Admin"
- On successful upgrade, redirect the user to `/admin/dashboard`; on failure, display the error message returned by the backend

**User-visible outcome:** A user who knows the direct URL `/admin/upgrade` can navigate to it while logged in, enter the secret code, and have their role upgraded to admin, after which they are redirected to the admin dashboard.
