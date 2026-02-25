# Specification

## Summary
**Goal:** Fix conditional rendering logic for pickup and drop location fields in `RideRequestForm.tsx` to ensure correct visibility based on the appropriate state variables.

**Planned changes:**
- Fix pickup manual fields (pickup pincode + pickup area) to show only when `pickupLocationMode === 'manual'` and hide when `pickupLocationMode === 'gps'`, removing any dependency on `journeyType`.
- Fix drop fields (drop pincode + drop area) visibility and required flags: show and require when `journeyType === 'oneway'`; hide when `journeyType === 'roundtrip'` and `returnToSamePickup === true`; show and require when `journeyType === 'roundtrip'` and `returnToSamePickup === false`.
- In the GPS geolocation handler, set `pickupLocationMode` to `'manual'` when geolocation permission is denied or `getCurrentPosition` fails, causing pickup fields to become visible.

**User-visible outcome:** The booking form correctly shows/hides pickup and drop fields based on location mode and journey type selections, and automatically falls back to manual pickup entry if GPS access is denied or fails.
