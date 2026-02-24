# Specification

## Summary
**Goal:** Add Edit Profile functionality to the Driver Dashboard, allowing drivers to update their profile information including service area, vehicle experience, transmission comfort, languages, and availability status.

**Planned changes:**
- Add "Edit Profile" button to Driver Dashboard page
- Create editable profile form modal/section with fields: servicePincode (required), serviceAreaName (required), vehicleExperience (multi-select checkboxes: Hatchback, Sedan, SUV, Luxury), transmissionComfort (multi-select checkboxes: Manual, Automatic, EV), languages (optional), and isAvailable (toggle switch)
- Implement Save button that calls existing saveCallerUserProfile backend function
- Update My Profile display card immediately after successful save without page refresh
- Ensure profile data persists across page refresh and logout/login cycles

**User-visible outcome:** Drivers can click "Edit Profile" on their dashboard to update their service area, vehicle experience, transmission preferences, languages, and availability status. Changes are saved to the backend and reflected immediately in the My Profile card, persisting across sessions.
