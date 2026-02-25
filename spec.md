# Specification

## Summary
**Goal:** Fix GPS mode visibility in the Customer Booking Form so that manual pickup fields are shown or hidden based on the selected location mode.

**Planned changes:**
- In `RideRequestForm.tsx`, conditionally render the Pickup Pincode and Pickup Area fields: hide them when `locationMode === 'gps'`, show and require them when `locationMode === 'manual'`.
- In `RideRequestForm.tsx`, when the geolocation error callback fires (GPS permission denied), automatically set `locationMode` back to `'manual'` and display the inline error message: "Location permission denied. Please enter pickup manually."

**User-visible outcome:** When a customer selects "Use GPS," the manual pickup fields disappear. If GPS permission is denied, the form automatically switches back to manual mode, re-shows the pickup fields, and displays an explanatory error message.
