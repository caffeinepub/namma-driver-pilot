# Specification

## Summary
**Goal:** Lock the driver availability toggle whenever the driver has an accepted trip, preventing them from setting themselves Unavailable mid-trip, and automatically unlock it once all accepted trips are completed.

**Planned changes:**
- Backend: Add a guard to the `updateAvailability` function that rejects attempts to set availability to `false` when the driver has any trip with status `accepted`, returning a descriptive error message.
- Frontend (Driver Dashboard): Derive a `hasAcceptedTrip` boolean from the driver's accepted trips list; when true, force the availability toggle to display Available, render it as disabled/greyed-out, and show helper text: "Availability is locked while you have an accepted trip."
- Frontend (Driver Dashboard): When the accepted trips list becomes empty after marking a trip as completed, re-enable the availability toggle and restore the driver's last persisted availability value.
- Frontend (Driver Dashboard): Add a post-build checklist as a code comment or dev/QA callout with two steps: (1) Accept trip → toggle disabled and availability shows Available; (2) Complete trip → toggle re-enabled.

**User-visible outcome:** Drivers with an active accepted trip will see their availability toggle greyed out and locked to Available. Once the accepted trip is marked as completed, the toggle becomes interactive again and reflects the driver's previously saved availability value.
