# Specification

## Summary
**Goal:** Fix pickup and drop field visibility rules in `RideRequestForm.tsx` so they follow the correct independent logic based on `pickupLocationMode` and `journeyType`.

**Planned changes:**
- Fix pickup manual field visibility: show `pickupPincode` and `pickupArea` inputs if and only if `pickupLocationMode === 'manual'`, completely independent of `journeyType`.
- Fix drop field visibility: when `journeyType === 'oneway'`, always show `dropPincode` and `dropArea` as required; when `journeyType === 'roundtrip'`, show a "Return to same pickup location" checkbox (default checked), hiding drop fields and mirroring pickup values in UI state when checked, or showing drop fields as required when unchecked.
- Drop field visibility must never depend on `pickupLocationMode`.
- In the existing GPS error/failure handler, set `pickupLocationMode = 'manual'` when geolocation permission is denied or the API call fails, causing pickup manual fields to reappear automatically.

**User-visible outcome:** The booking form correctly shows/hides pickup and drop location fields based on the selected location mode and journey type, and automatically falls back to manual pickup entry when GPS fails.
