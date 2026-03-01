# Specification

## Summary
**Goal:** Fix the Candid opt variant encoding for role submission in the frontend so that roles are sent as the correct Candid format instead of plain strings.

**Planned changes:**
- In `useQueries.ts`, convert the role string to the Candid opt variant format before calling the backend `updateRole` mutation (e.g., `"customer"` → `[{ customer: null }]`)
- Apply the same conversion in `SelectRolePage.tsx` wherever the role is submitted
- Apply the same conversion in `RoleSelectionWarningModal.tsx` wherever the role is submitted

**User-visible outcome:** Role selection no longer causes a Candid variant encoding error from the backend; selecting and saving a role (customer, driver, or admin) is successfully processed by the backend.
