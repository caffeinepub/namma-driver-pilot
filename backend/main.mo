import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Nat64 "mo:core/Nat64";
import Array "mo:core/Array";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let OWNER_ADMIN_PRINCIPAL = "6ngnc-ph7ou-g23nw-z2zbr-czprs-ohpe6-2wolp-eeo7o-c32lo-deiso-yqe";
  type StableAdminSet = Set.Set<Text>;

  public type UserRole = AccessControl.UserRole;

  public type Role = {
    #customer;
    #driver;
    #admin;
  };

  public type UserProfile = {
    principalId : Principal;
    fullName : Text;
    email : Text;
    role : ?Role;
    createdTime : Time.Time;
    servicePincode : Text;
    serviceAreaName : Text;
    vehicleExperience : [VehicleExperience];
    transmissionComfort : [TransmissionComfort];
    isAvailable : Bool;
    totalEarnings : Nat64;
    languages : ?[Text];
  };

  public type VehicleExperience = {
    #hatchback;
    #sedan;
    #suv;
    #luxury;
  };

  public type TransmissionComfort = {
    #manual;
    #automatic;
    #ev;
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

  public type TransmissionType = {
    #automatic;
    #manual;
    #ev;
  };

  public type DriverProfile = {
    serviceAreaName : Text;
    servicePincode : Text;
    vehicleExperience : [VehicleType];
    transmissionComfort : [TransmissionType];
    languages : [Text];
    isAvailable : Bool;
    updatedTime : Nat64;
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

  public type TripRequest = {
    tripId : Text;
    customerId : ?Principal;
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
    totalFare : Nat;
    ratePerHour : Nat;
    billableHours : Nat;
  };

  public type TripStatus = {
    #requested;
    #accepted;
    #completed;
    #cancelled;
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
    totalFare : Nat;
    ratePerHour : Nat;
    billableHours : Nat;
  };

  public type LocalPricing = {
    base_first_hour : Float;
    min_hours : Float;
    per_min_after_first_hour : Float;
    free_wait_mins : Float;
    wait_per_min : Float;
  };

  public type OutstationPricing = {
    min_days : Float;
    driver_bata_per_day : Float;
    commission_rate : Float;
    km_slab_1_limit : Float;
    km_slab_2_limit : Float;
    km_slab_3_limit : Float;
    per_km_slab_1 : Float;
    per_km_slab_2 : Float;
    per_km_slab_3 : Float;
    per_km_slab_4 : Float;
    extra_driver_comp_per_100km_over_400 : Float;
  };

  public type VehicleMultiplier = {
    hatchback : Float;
    sedan : Float;
    suv : Float;
    luxury : Float;
  };

  public type Commission = {
    local : Float;
    outstation : Float;
  };

  public type PricingConfig = {
    local : LocalPricing;
    outstation : OutstationPricing;
    vehicle_multiplier : VehicleMultiplier;
    commission : Commission;
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

  // Persistent admin set containing all admin principal texts.
  // Admin access is determined solely by membership in this persistent set — never by profile role fields.
  var adminPrincipalSet : StableAdminSet = Set.fromArray([OWNER_ADMIN_PRINCIPAL]);

  // Pricing configuration with default values
  var pricingConfig : ?PricingConfig = null;

  let userProfiles = Map.empty<Principal, UserProfile>();
  // New persistent storage for driver profiles
  let driverProfiles = Map.empty<Principal, DriverProfile>();
  let trips = Map.empty<Text, Trip>();

  // Persistent roles storage keyed by principal
  let userRoles = Map.empty<Principal, { #customer; #driver }>();

  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Internal synchronous admin check: returns true if and only if the principal
  // is present in the persistent admin set. Admin access is determined solely by
  // principal identity, not by any saved role field in the user profile.
  private func isPersistentAdmin(user : Principal) : Bool {
    adminPrincipalSet.contains(user.toText());
  };

  private func isAnonymous(caller : Principal) : Bool {
    caller.isAnonymous();
  };

  // Default pricing configuration
  let defaultPricingConfig : PricingConfig = {
    local = {
      base_first_hour = 200;
      min_hours = 1;
      per_min_after_first_hour = 3.5;
      free_wait_mins = 10;
      wait_per_min = 1.5;
    };
    outstation = {
      min_days = 1;
      driver_bata_per_day = 500;
      commission_rate = 0.15;
      km_slab_1_limit = 400;
      km_slab_2_limit = 600;
      km_slab_3_limit = 900;
      per_km_slab_1 = 8;
      per_km_slab_2 = 9;
      per_km_slab_3 = 10;
      per_km_slab_4 = 11;
      extra_driver_comp_per_100km_over_400 = 1000;
    };
    vehicle_multiplier = {
      hatchback = 1.0;
      sedan = 1.0;
      suv = 1.0;
      luxury = 2.0;
    };
    commission = {
      local = 0.20;
      outstation = 0.15;
    };
  };

  public type UpdateConfigResult = {
    #ok : PricingConfig;
    #notAdmin;
    #invalidConfig : Text;
    #noConfigFound;
    #failedUpdate : Text;
  };

  public query ({ caller }) func getPricingConfig() : async PricingConfig {
    switch (pricingConfig) {
      case (?config) { config };
      case (null) {
        pricingConfig := ?defaultPricingConfig;
        defaultPricingConfig;
      };
    };
  };

  // Admin-only: update pricing configuration
  public shared ({ caller }) func updatePricingConfig(newConfig : PricingConfig) : async UpdateConfigResult {
    if (not isPersistentAdmin(caller)) { return (#notAdmin) };

    // Validate that all rates and multipliers are non-negative and logically consistent.
    if (newConfig.local.base_first_hour < 0
      or newConfig.local.min_hours < 1
      or newConfig.local.per_min_after_first_hour < 0
      or newConfig.local.free_wait_mins < 0
      or newConfig.local.wait_per_min < 0
      or newConfig.outstation.min_days < 1
      or newConfig.outstation.driver_bata_per_day < 0
      or newConfig.outstation.commission_rate < 0
      or newConfig.outstation.km_slab_1_limit < 0
      or newConfig.outstation.km_slab_1_limit >= newConfig.outstation.km_slab_2_limit
      or newConfig.outstation.km_slab_2_limit >= newConfig.outstation.km_slab_3_limit
      or newConfig.outstation.per_km_slab_1 < 0
      or newConfig.outstation.per_km_slab_2 < 0
      or newConfig.outstation.per_km_slab_3 < 0
      or newConfig.outstation.per_km_slab_4 < 0
      or newConfig.outstation.extra_driver_comp_per_100km_over_400 < 0
      or newConfig.vehicle_multiplier.hatchback < 0
      or newConfig.vehicle_multiplier.sedan < 0
      or newConfig.vehicle_multiplier.suv < 0
      or newConfig.vehicle_multiplier.luxury < 0
      or newConfig.commission.local < 0
      or newConfig.commission.outstation < 0
    ) {
      return #invalidConfig("One or more config values are out of allowed range and limits");
    };

    pricingConfig := ?newConfig;
    #ok(newConfig);
  };

  func resolveRole(caller : Principal, storedRole : ?Role) : ?Role {
    if (isPersistentAdmin(caller)) { return ?#admin };
    storedRole;
  };

  public query ({ caller }) func getMyRole() : async ?Role {
    let storedRole = switch (userProfiles.get(caller)) {
      case (?profile) { profile.role };
      case (null) { null };
    };
    resolveRole(caller, storedRole);
  };

  public query ({ caller }) func isAdmin() : async Bool {
    let storedRole = switch (userProfiles.get(caller)) {
      case (?profile) { profile.role };
      case (null) { null };
    };
    switch (resolveRole(caller, storedRole)) {
      case (?#admin) { true };
      case (?#customer) { false };
      case (?#driver) { false };
      case (null) { false };
    };
  };

  public type ProfileInput = {
    fullName : Text;
    email : Text;
  };

  public shared ({ caller }) func setProfile(input : ProfileInput) : async UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot create profile");
    };

    let currentTime = Time.now();

    let role : ?Role = switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        existingProfile.role;
      };
      case (null) {
        if (isPersistentAdmin(caller)) {
          ?#admin;
        } else {
          ?#customer;
        };
      };
    };

    let userProfile : UserProfile = {
      principalId = caller;
      fullName = input.fullName;
      email = input.email;
      role;
      createdTime = currentTime;
      servicePincode = "000000";
      serviceAreaName = "Unknown";
      vehicleExperience = [];
      transmissionComfort = [];
      isAvailable = false;
      totalEarnings = 0;
      languages = null;
    };

    userProfiles.add(caller, userProfile);
    userProfile;
  };

  public shared ({ caller }) func updateProfileFields(fullName : Text, email : Text) : async UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot update profile");
    };
    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        let updatedProfile : UserProfile = {
          existingProfile with
          fullName = fullName;
          email;
        };
        userProfiles.add(caller, updatedProfile);
        updatedProfile;
      };
      case (null) {
        Runtime.trap("Profile not found for caller");
      };
    };
  };

  public type ProfileUpdate = {
    fullName : Text;
    email : Text;
    servicePincode : Text;
    serviceAreaName : Text;
    vehicleExperience : [VehicleExperience];
    transmissionComfort : [TransmissionComfort];
    isAvailable : Bool;
    totalEarnings : Nat64;
    languages : ?[Text];
  };

  public shared ({ caller }) func updateProfile(update : ProfileUpdate) : async UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot update profile");
    };
    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        let updatedUserProfile : UserProfile = {
          existingProfile with
          fullName = update.fullName;
          email = update.email;
          servicePincode = update.servicePincode;
          serviceAreaName = update.serviceAreaName;
          vehicleExperience = update.vehicleExperience;
          transmissionComfort = update.transmissionComfort;
          isAvailable = update.isAvailable;
          totalEarnings = update.totalEarnings;
          languages = update.languages;
        };
        userProfiles.add(caller, updatedUserProfile);
        updatedUserProfile;
      };
      case (null) {
        Runtime.trap("Profile not found for caller");
      };
    };
  };

  public shared ({ caller }) func setMyRoleCustomer() : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot change role");
    };
    updateCurrentRoleSecure(caller, ?#customer);
  };

  public shared ({ caller }) func setMyRoleDriver() : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot change role");
    };
    updateCurrentRoleSecure(caller, ?#driver);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot access profiles");
    };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot access profiles");
    };
    if (caller != user and not isPersistentAdmin(caller)) {
      let callerIsAdmin = switch (userProfiles.get(caller)) {
        case (?profile) {
          switch (profile.role) {
            case (?#admin) { true };
            case (?#customer) { false };
            case (?#driver) { false };
            case (null) { false };
          };
        };
        case (null) { false };
      };
      if (not callerIsAdmin) {
        Runtime.trap("Unauthorized: Can only view your own profile");
      };
    };
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { ?profile };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot save profiles");
    };
    let preservedRole : ?Role = switch (userProfiles.get(caller)) {
      case (?existingProfile) { existingProfile.role };
      case (null) {
        if (isPersistentAdmin(caller)) { ?#admin } else { ?#customer };
      };
    };
    let safeProfile : UserProfile = {
      profile with
      principalId = caller;
      role = preservedRole;
    };
    userProfiles.add(caller, safeProfile);
  };

  public type TripRequestInput = {
    #notUsed;
  };

  public shared ({ caller }) func createTrip(tripData : TripRequest) : async Trip {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot create trips");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can create trips");
    };

    let newTrip : Trip = {
      tripId = tripData.tripId;
      customerId = caller;
      driverId = null;
      tripType = tripData.tripType;
      journeyType = tripData.journeyType;
      vehicleType = tripData.vehicleType;
      duration = tripData.duration;
      startDateTime = tripData.startDateTime;
      endDateTime = tripData.endDateTime;
      pickupLocation = tripData.pickupLocation;
      dropoffLocation = tripData.dropoffLocation;
      phone = tripData.phone;
      landmark = tripData.landmark;
      status = #requested;
      createdTime = Time.now();
      totalFare = tripData.totalFare;
      ratePerHour = tripData.ratePerHour;
      billableHours = tripData.billableHours;
    };

    // Save the trip in the persistent map
    trips.add(newTrip.tripId, newTrip);

    newTrip;
  };

  func updateCurrentRoleSecure(caller : Principal, newRole : ?Role) {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile : UserProfile = { profile with role = newRole };
        userProfiles.add(caller, updatedProfile);
      };
      case (null) {
        Runtime.trap("Profile not found");
      };
    };
  };

  // Returns the driver profile for the calling user.
  // Requires a registered (non-anonymous, non-guest) user.
  public query ({ caller }) func getDriverProfile() : async ?DriverProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can access driver profiles");
    };
    driverProfiles.get(caller);
  };

  // Creates or updates the driver profile for the calling user.
  // Requires a registered (non-anonymous, non-guest) user.
  public shared ({ caller }) func upsertDriverProfile(profile : DriverProfile) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can create or update driver profiles");
    };
    driverProfiles.add(caller, profile);
    true;
  };

  public query ({ caller }) func ping() : async Text { "ok" };

  public query ({ caller }) func health() : async Text { "ok" };
};
