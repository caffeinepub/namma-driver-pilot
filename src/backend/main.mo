import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat64 "mo:core/Nat64";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Types
  public type UserRole = AccessControl.UserRole;

  public type AppRole = {
    #customer;
    #driver;
    #admin;
  };

  public type LockedRole = {
    role : AppRole;
    isLocked : Bool;
  };

  public type UserProfile = {
    principalId : Principal;
    email : Text;
    fullName : Text;
    role : LockedRole;
    createdTime : Time.Time;
  };

  public type TripStatus = {
    #requested;
    #accepted;
    #completed;
    #cancelled;
  };

  public type TripType = {
    #local;
    #outstation;
  };

  public type JourneyType = {
    #oneWay;
    #roundTrip;
  };

  public type VehicleType = {
    #hatchback;
    #sedan;
    #suv;
    #luxury;
  };

  public type Duration = {
    #hours : Nat;
    #days : Nat;
  };

  public type Location = {
    pincode : Text;
    area : Text;
    latitude : ?Float;
    longitude : ?Float;
  };

  public type Trip = {
    tripId : Text;
    customerId : Principal;
    driverId : ?Principal;
    tripType : TripType;
    journeyType : JourneyType;
    vehicleType : VehicleType;
    duration : Duration;
    startDateTime : ?Time.Time;
    endDateTime : ?Time.Time;
    pickupLocation : Location;
    dropoffLocation : ?Location;
    phone : Text;
    landmark : ?Text;
    status : TripStatus;
    createdTime : Time.Time;
  };

  module Profile {
    public func compareByEmail(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.email, profile2.email);
    };
  };

  module Trip {
    public func compareByTripId(trip1 : Trip, trip2 : Trip) : Order.Order {
      Text.compare(trip1.tripId, trip2.tripId);
    };

    public func compareByPickupLocation(trip1 : Trip, trip2 : Trip) : Order.Order {
      Text.compare(trip1.pickupLocation.area, trip2.pickupLocation.area);
    };

    public func compareByDropoffLocation(trip1 : Trip, trip2 : Trip) : Order.Order {
      switch (trip1.dropoffLocation, trip2.dropoffLocation) {
        case (?loc1, ?loc2) { Text.compare(loc1.area, loc2.area) };
        case (?_, null) { #greater };
        case (null, ?_) { #less };
        case (null, null) { #equal };
      };
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let trips = Map.empty<Text, Trip>();

  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper function to get user's app role
  private func getUserAppRole(user : Principal) : ?AppRole {
    switch (userProfiles.get(user)) {
      case (?profile) { ?profile.role.role };
      case (null) { null };
    };
  };

  // Helper function to check if user is a customer
  private func isCustomer(user : Principal) : Bool {
    switch (getUserAppRole(user)) {
      case (?#customer) { true };
      case (?#admin) { true }; // Admins can act as customers
      case (_) { false };
    };
  };

  // Helper function to check if user is a driver
  private func isDriver(user : Principal) : Bool {
    switch (getUserAppRole(user)) {
      case (?#driver) { true };
      case (?#admin) { true }; // Admins can act as drivers
      case (_) { false };
    };
  };

  // Helper function to check if user is an admin
  private func isAppAdmin(user : Principal) : Bool {
    switch (getUserAppRole(user)) {
      case (?#admin) { true };
      case (_) { false };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    if (caller != user and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // CRITICAL: Users can NEVER set their own role to admin through this endpoint
    // Admin role can only be assigned through AccessControl.assignRole (admin-only) or admin secret code
    if (profile.role.role == #admin) {
      Runtime.trap("Unauthorized: Admin role cannot be self-assigned");
    };

    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        // Prevent changing locked role
        if (existingProfile.role.isLocked) {
          if (existingProfile.role.role != profile.role.role) {
            Runtime.trap("Role is locked and cannot be changed");
          };

          // If the locked role matches, allow profile update but preserve the locked role
          userProfiles.add(caller, { profile with
            role = existingProfile.role;
          });
          return;
        };

        // If role is not locked, allow update but ensure it's not admin
        if (profile.role.role == #admin) {
          Runtime.trap("Unauthorized: Admin role cannot be self-assigned");
        };
      };
      case (null) {
        // New user - ensure they cannot create themselves as admin
        if (profile.role.role == #admin) {
          Runtime.trap("Unauthorized: Admin role cannot be self-assigned");
        };
      };
    };

    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateUserRoleAndLock(role : AppRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update roles");
    };

    // CRITICAL: Users can only lock customer or driver roles, never admin
    // Admin role can only be assigned through AccessControl.assignRole or admin secret code
    if (role == #admin) {
      Runtime.trap("Unauthorized: Admin role cannot be self-assigned");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User not found");
      };
      case (?userProfile) {
        if (userProfile.role.isLocked) {
          Runtime.trap("Role is already locked and cannot be changed");
        };

        // Ensure the role being locked is not admin
        if (role == #admin) {
          Runtime.trap("Unauthorized: Admin role cannot be self-assigned");
        };

        let updatedProfile : UserProfile = {
          userProfile with
          role = {
            role;
            isLocked = true;
          };
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  // Trip Management

  public shared ({ caller }) func createTrip(
    tripType : TripType,
    journeyType : JourneyType,
    vehicleType : VehicleType,
    duration : Duration,
    startDateTime : ?Time.Time,
    endDateTime : ?Time.Time,
    pickupLocation : Location,
    dropoffLocation : ?Location,
    phone : Text,
    landmark : ?Text
  ) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create trips");
    };

    if (not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can create trips");
    };

    let tripId = phone.concat("-").concat(pickupLocation.pincode).concat("-").concat(Time.now().toText());
    let newTrip : Trip = {
      tripId;
      customerId = caller;
      driverId = null;
      tripType;
      journeyType;
      vehicleType;
      duration;
      startDateTime;
      endDateTime;
      pickupLocation;
      dropoffLocation;
      phone;
      landmark;
      status = #requested;
      createdTime = Time.now();
    };

    trips.add(tripId, newTrip);
    tripId;
  };

  public query ({ caller }) func getMyTrips() : async [Trip] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view trips");
    };

    let userTrips = trips.values().toList<Trip>().filter(
      func(trip) {
        // Customers see their own trips
        if (isCustomer(caller) and trip.customerId == caller) {
          return true;
        };
        // Drivers see trips they accepted
        if (isDriver(caller)) {
          switch (trip.driverId) {
            case (?driverId) { return driverId == caller };
            case (null) { return false };
          };
        };
        false;
      }
    );

    userTrips.toArray();
  };

  public query ({ caller }) func getRequestedTrips() : async [Trip] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view requested trips");
    };

    if (not isDriver(caller)) {
      Runtime.trap("Unauthorized: Only drivers can view requested trips");
    };

    let requestedTrips = trips.values().toList<Trip>().filter(
      func(trip) { trip.status == #requested }
    );

    requestedTrips.toArray();
  };

  public shared ({ caller }) func acceptTrip(tripId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can accept trips");
    };

    if (not isDriver(caller)) {
      Runtime.trap("Unauthorized: Only drivers can accept trips");
    };

    switch (trips.get(tripId)) {
      case (null) {
        Runtime.trap("Trip not found");
      };
      case (?trip) {
        if (trip.status != #requested) {
          Runtime.trap("Trip is not available for acceptance");
        };

        // Prevent customers from accepting their own trips
        if (trip.customerId == caller) {
          Runtime.trap("Unauthorized: Cannot accept your own trip");
        };

        let updatedTrip : Trip = { trip with
          driverId = ?caller;
          status = #accepted;
        };
        trips.add(tripId, updatedTrip);
      };
    };
  };

  public shared ({ caller }) func completeTrip(tripId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can complete trips");
    };

    if (not isDriver(caller)) {
      Runtime.trap("Unauthorized: Only drivers can complete trips");
    };

    switch (trips.get(tripId)) {
      case (null) {
        Runtime.trap("Trip not found");
      };
      case (?trip) {
        switch (trip.driverId) {
          case (?driverId) {
            if (driverId != caller) {
              Runtime.trap("Unauthorized: Only the assigned driver can complete this trip");
            };
          };
          case (null) {
            Runtime.trap("Trip has no assigned driver");
          };
        };

        if (trip.status != #accepted) {
          Runtime.trap("Trip must be in accepted status to complete");
        };

        let updatedTrip : Trip = { trip with status = #completed };
        trips.add(tripId, updatedTrip);
      };
    };
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view users");
    };

    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };

    userProfiles.values().toArray().sort(Profile.compareByEmail);
  };

  public query ({ caller }) func getAllTrips() : async [Trip] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view trips");
    };

    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all trips");
    };

    trips.values().toArray().sort(Trip.compareByTripId);
  };
};
