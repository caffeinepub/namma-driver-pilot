# Specification

## Summary
**Goal:** Implement comprehensive filtering and smart ordering for driver Available Trips section based on 7 criteria including driver availability, verification status, service area match, vehicle/transmission compatibility, and prioritize trips in driver's service area.

**Planned changes:**
- Update backend getRequestedTrips function to filter trips using all 7 criteria: trip status "requested", driver availability, driver verification (if field exists), no active trips, matching pickup pincode with driver service pincode, compatible vehicle type, and compatible transmission type
- Implement smart ordering logic to display trips where pickup area name contains driver's service area name first, followed by other matching trips
- Update frontend AvailableTripsSection component to display the filtered and ordered trips from backend without additional client-side filtering

**User-visible outcome:** Drivers will see only relevant trip requests in their Available Trips section that match their service area, vehicle capabilities, and current availability status, with trips in their specific service area appearing first for easier selection.
