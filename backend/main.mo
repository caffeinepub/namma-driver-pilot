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
import Migration "migration";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
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
    role : Role;
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

  // Stable variable so it persists across upgrades
  stable var adminPrincipalSet : StableAdminSet = Set.fromArray([
    "6ngnc-ph7ou-g23nw-z2zbr-czprs-ohpe6-2wolp-eeo7o-c32lo-deiso-yqe",
    "g3c77-j7yp6-ydsrd-2zp2q-vajyd-4ymec-tydvo-kcxwl-s7reg-37yws-eae",
  ]);

  var pricingConfig : ?PricingConfig = null;
  let userProfiles = Map.empty<Principal, UserProfile>();
  let driverProfiles = Map.empty<Principal, DriverProfile>();
  let trips = Map.empty<Text, Trip>();
  let userRoles = Map.empty<Principal, { #customer; #driver }>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // isAdmin checks the stable admin principals set
  private func isAdmin(caller : Principal) : Bool {
    adminPrincipalSet.contains(caller.toText());
  };

  private func isAnonymous(caller : Principal) : Bool {
    caller.isAnonymous();
  };

  private func requireAuthenticated(caller : Principal) {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers are not allowed");
    };
  };

  private func requireAdminCaller(caller : Principal) {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

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

  public query func getPricingConfig() : async PricingConfig {
    switch (pricingConfig) {
      case (?config) { config };
      case (null) { defaultPricingConfig };
    };
  };

  public shared ({ caller }) func updatePricingConfig(newConfig : PricingConfig) : async UpdateConfigResult {
    if (not isAdmin(caller)) { return (#notAdmin) };

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

  // getMyRole: returns #admin if caller is in admin set, otherwise returns stored role
  public query ({ caller }) func getMyRole() : async Role {
    requireAuthenticated(caller);
    if (isAdmin(caller)) {
      return #admin;
    };
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.role };
      case (null) { #customer };
    };
  };

  // isAdminCheck: public query to check if caller is admin
  public query ({ caller }) func isAdminCheck() : async Bool {
    requireAuthenticated(caller);
    isAdmin(caller);
  };

  public type ProfileInput = {
    fullName : Text;
    email : Text;
  };

  public shared ({ caller }) func setProfile(input : ProfileInput) : async UserProfile {
    requireAuthenticated(caller);

    let currentTime = Time.now();

    let role : Role = switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        existingProfile.role;
      };
      case (null) {
        if (isAdmin(caller)) {
          #admin;
        } else {
          #customer;
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
    requireAuthenticated(caller);
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
    requireAuthenticated(caller);
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
    requireAuthenticated(caller);
    updateCurrentRoleSecure(caller, #customer);
  };

  public shared ({ caller }) func setMyRoleDriver() : async () {
    requireAuthenticated(caller);
    updateCurrentRoleSecure(caller, #driver);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuthenticated(caller);
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireAuthenticated(caller);
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { ?profile };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuthenticated(caller);
    let preservedRole : Role = switch (userProfiles.get(caller)) {
      case (?existingProfile) { existingProfile.role };
      case (null) {
        if (isAdmin(caller)) { #admin } else { #customer };
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
    requireAuthenticated(caller);

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

    trips.add(newTrip.tripId, newTrip);
    newTrip;
  };

  public type AcceptTripResult = {
    #ok : Trip;
    #tripNotFound;
    #alreadyAccepted;
    #offDuty;
    #unauthorized;
  };

  public shared ({ caller }) func acceptTrip(tripId : Text) : async AcceptTripResult {
    requireAuthenticated(caller);

    switch (driverProfiles.get(caller)) {
      case (null) {
        return #offDuty;
      };
      case (?profile) {
        if (not profile.isAvailable) {
          return #offDuty;
        };
        switch (trips.get(tripId)) {
          case (null) {
            return #tripNotFound;
          };
          case (?trip) {
            switch (trip.status) {
              case (#requested) {
                let updatedTrip : Trip = {
                  trip with
                  driverId = ?caller;
                  status = #accepted;
                };
                trips.add(tripId, updatedTrip);
                return #ok(updatedTrip);
              };
              case (_) {
                return #alreadyAccepted;
              };
            };
          };
        };
      };
    };
  };

  func updateCurrentRoleSecure(caller : Principal, newRole : Role) {
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

  public query ({ caller }) func getDriverProfile() : async ?DriverProfile {
    requireAuthenticated(caller);
    driverProfiles.get(caller);
  };

  public shared ({ caller }) func upsertDriverProfile(profile : DriverProfile) : async Bool {
    requireAuthenticated(caller);
    driverProfiles.add(caller, profile);
    true;
  };

  // Admin-only: list all admins
  public query ({ caller }) func listAdmins() : async [Principal] {
    requireAuthenticated(caller);
    requireAdminCaller(caller);
    adminPrincipalSet.toArray().map<Text, Principal>(func(p) { Principal.fromText(p) : Principal });
  };

  public query ({ caller }) func persistentAdminCheck() : async Bool {
    requireAuthenticated(caller);
    isAdmin(caller);
  };

  // makeMeAdmin is disabled: the admin set is pre-seeded and stable.
  // Only returns false to avoid breaking existing callers.
  public shared ({ caller }) func makeMeAdmin() : async Bool {
    requireAuthenticated(caller);
    false;
  };

  public shared ({ caller }) func createUserProfile(profile : ProfileInput) : async UserProfile {
    requireAuthenticated(caller);

    // Role is determined by admin set membership; never auto-grant admin via this function
    let role : Role = if (isAdmin(caller)) { #admin } else { #customer };

    let newUser : UserProfile = {
      principalId = caller;
      fullName = profile.fullName;
      email = profile.email;
      role;
      createdTime = Time.now();
      servicePincode = "000000";
      serviceAreaName = "Unknown";
      vehicleExperience = [];
      transmissionComfort = [];
      isAvailable = false;
      totalEarnings = 0;
      languages = null;
    };

    userProfiles.add(caller, newUser);
    newUser;
  };

  public query func ping() : async Text { "ok" };

  public query func health() : async Text { "ok" };
};
