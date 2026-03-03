# Specification

## Summary
**Goal:** Fix the Drop GPS and One Way / Round Trip logic in the customer booking form so that drop location behaves correctly for each trip type.

**Planned changes:**
- For One Way trips: show Drop fields normally and add a "Drop Location Mode: Manual | GPS" toggle that mirrors the existing Pickup Location Mode toggle in design and behavior.
- When Drop Location Mode is GPS (One Way): capture device geolocation, store latitude/longitude into drop location state, and reuse the existing GPS-to-area/pincode helper to auto-fill Drop Area and Drop Pincode; fields remain visible and editable.
- For Round Trip: disable or hide all Drop input fields, auto-sync drop location state to equal pickup location state, and display helper text "Round trip: Drop location is same as Pickup."
- On One Way form submit: map `dropoffLocation` from `dropLocation` state.
- On Round Trip form submit: map `dropoffLocation` to `pickupLocation` value.
- No `console.log` statements added; no auth, routing, or flicker regressions introduced.

**User-visible outcome:** Customers booking a One Way trip can set their drop location via Manual input or GPS (same experience as pickup), while Round Trip bookings automatically use the pickup location as the drop location with a clear helper message.
