# Specification

## Summary
**Goal:** Fix the runtime crash caused by the JavaScript `in` operator being applied to trip fields in driver frontend components.

**Planned changes:**
- Scan `DriverDashboard`, `DriverTripList`, `AvailableTripsSection`, all `TripCard` components, and any helper/utility files for uses of the `in` operator on `trip.status`, `trip.tripType`, `trip.journeyType`, and `trip.vehicleType`
- Replace every such `in` operator check with safe comparison logic: use `===` when the value is a string, or `Object.keys(value)[0]` to extract the key when the value is an object
- Ensure all trip data in `DriverDashboard`, `DriverTripList`, and `AvailableTripsSection` is passed through the existing `normalizeTrip()` utility before being used in render logic or passed to child components

**User-visible outcome:** The driver dashboard loads without throwing "Cannot use 'in' operator to search for '#local' in local" after login, and trip data renders correctly.
