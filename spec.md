# Specification

## Summary
**Goal:** Restore the "My Trips" history UI for both the Customer Dashboard and the Driver Dashboard.

**Planned changes:**
- Add a "My Trips" section to the Customer Dashboard that filters and displays trips where `trip.customerPrincipal == caller`, showing status, pickup/dropoff locations, vehicle type, fare, and timestamps.
- Ensure newly booked trips appear in the Customer "My Trips" list immediately after booking without a hard refresh.
- Add a "My Trips" tab to the Driver Dashboard (alongside the existing "Available Trips" tab) showing trips where `trip.driverPrincipal == caller`.
- Update the "Available Trips" tab to show only trips with no driver assigned.
- Remove the "coming soon" placeholder text from the Driver Dashboard.

**User-visible outcome:** Customers can see all their trips in a "My Trips" section immediately after booking. Drivers can switch between "Available Trips" and "My Trips" tabs to view open trips and their own assigned trips respectively.
