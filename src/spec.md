# Specification

## Summary
**Goal:** Replace the simple customer booking form with a comprehensive trip planning form that captures trip type, journey type, vehicle preferences, flexible duration options, location details (manual or GPS), and contact information.

**Planned changes:**
- Add Trip Type field (Local/Outstation) and Journey Type field (One Way/Round Trip) with informational popups
- Add Vehicle Type dropdown (Hatchback/Sedan/SUV/Luxury)
- Implement smart Hire Duration: dropdown for Local trips (2-12 hours + Custom), datetime pickers with auto-calculated days for Outstation trips
- Add Location Mode toggle (Manual Entry/Use GPS) with GPS fallback to manual entry on permission denial
- Implement conditional Drop location fields (visible only for Outstation + One Way trips)
- Add Contact section with Phone Number (10-digit validation) and optional Landmark
- Remove distance and fare amount fields, display informational message about automatic fare calculation
- Update backend Trip data model to store all new fields (tripType, journeyType, vehicleType, duration fields, location fields, contact fields)
- Update backend createTrip function and frontend mutation hook to handle all new trip parameters

**User-visible outcome:** Customers can book trips with detailed planning options including trip type selection, vehicle preferences, flexible duration choices, GPS or manual location entry, and contact details. The form adapts dynamically based on trip type and journey type selections, showing only relevant fields for each scenario.
