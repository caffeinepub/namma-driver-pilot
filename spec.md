# Specification

## Summary
**Goal:** Restore admin role access in the backend by seeding a stable admin principals set with two specific principals and updating the admin check logic accordingly.

**Planned changes:**
- Replace the current admin principals set in `backend/main.mo` with a `stable` variable containing exactly two principals: `6ngnc-ph7ou-g23nw-z2zbr-czprs-ohpe6-2wolp-eeo7o-c32lo-deiso-yqe` and `g3c77-j7yp6-ydsrd-2zp2q-vajyd-4ymec-tydvo-kcxwl-s7reg-37yws-eae`
- Update `isAdmin(caller)` to return `true` if and only if the caller is present in the stable admin principals set
- Update `getMyRole()` to return `#admin` when `isAdmin(caller)` is true, otherwise return the stored user role as before

**User-visible outcome:** The two specified principals will have admin access restored after canister upgrade, with the admin set persisting across future upgrades. No frontend or other backend logic is affected.
