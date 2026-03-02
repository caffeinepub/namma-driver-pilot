import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Nat64 "mo:core/Nat64";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  type AdminPrincipalSet = Set.Set<Text>;

  public type Role = {
    #customer;
    #driver;
    #admin;
    #unassigned;
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

  public type Location = {
    pincode : Text;
    area : Text;
    latitude : ?Float;
    longitude : ?Float;
  };

  public type Duration = {
    #hours : Nat;
    #days : Nat;
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

  public type DriverProfile = {
    serviceAreaName : Text;
    servicePincode : Text;
    vehicleExperience : [VehicleType];
    transmissionComfort : [TransmissionType];
    languages : [Text];
    isAvailable : Bool;
    updatedTime : Nat64;
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

  var adminPrincipals : AdminPrincipalSet = Set.fromArray([
    "6ngnc-ph7ou-g23nw-z2zbr-czprs-ohpe6-2wolp-eeo7o-c32lo-deiso-yqe",
    "g3c77-j7yp6-ydsrd-2zp2q-vajyd-4ymec-tydvo-kcxwl-s7reg-37yws-eae",
  ]);
  var pricingConfig : ?PricingConfig = null;
  let userProfiles = Map.empty<Principal, UserProfile>();
  let driverProfiles = Map.empty<Principal, DriverProfile>();
  let trips = Map.empty<Text, Trip>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UpdateConfigResult = {
    #ok : PricingConfig;
    #notAdmin;
    #invalidConfig : Text;
    #noConfigFound;
    #failedUpdate : Text;
  };

  private func isAdmin(caller : Principal) : Bool {
    adminPrincipals.contains(caller.toText());
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
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuthenticated(caller);

    let persistentRole : Role = switch (userProfiles.get(caller)) {
      case (?existing) {
        existing.role;
      };
      case (null) {
        switch (profile.role) {
          case (#driver) { #driver };
          case (#customer) { #customer };
          case (_) { #unassigned };
        };
      };
    };

    userProfiles.add(caller, {
      profile with
      principalId = caller;
      role = persistentRole;
    });
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

  public query ({ caller }) func getDriverProfile() : async ?DriverProfile {
    requireAuthenticated(caller);
    driverProfiles.get(caller);
  };

  public shared ({ caller }) func upsertDriverProfile(profile : DriverProfile) : async Bool {
    requireAuthenticated(caller);
    driverProfiles.add(caller, profile);
    true;
  };

  public query ({ caller }) func listAdmins() : async [Principal] {
    requireAuthenticated(caller);
    requireAdminCaller(caller);
    adminPrincipals.toArray().map<Text, Principal>(
      func(p) { Principal.fromText(p) : Principal }
    );
  };

  public query ({ caller }) func persistentAdminCheck() : async Bool {
    requireAuthenticated(caller);
    isAdmin(caller);
  };

  public query func ping() : async Text { "ok" };

  public query func health() : async Text { "ok" };

  public query ({ caller }) func getAvailableTripsForDriver() : async [Trip] {
    requireAuthenticated(caller);

    switch (driverProfiles.get(caller)) {
      case (null) {
        [];
      };
      case (?driverProfile) {
        if (not driverProfile.isAvailable) {
          return [];
        };

        let driverServicePincode = driverProfile.servicePincode;

        trips.entries().toArray().filter(
          func((_, trip)) {
            trip.status == #requested and
            trip.driverId == null and
            trip.pickupLocation.pincode == driverServicePincode
          }
        ).map(func((_, trip)) { trip });
      };
    };
  };

  public query ({ caller }) func getMyRole() : async Role {
    requireAuthenticated(caller);
    if (isAdmin(caller)) {
      return #admin;
    };
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.role };
      case (null) { #unassigned };
    };
  };

  public shared ({ caller }) func setMyRole(newRole : Role) : async () {
    requireAuthenticated(caller);

    if (isAdmin(caller)) {
      Runtime.trap("Admins cannot change their role");
    };

    switch (newRole) {
      case (#customer) {};
      case (#driver) {};
      case (_) {
        Runtime.trap("Only #driver or #customer roles can be self-assigned");
      };
    };

    let currentTime = Time.now();

    switch (userProfiles.get(caller)) {
      case (?existing) {
        userProfiles.add(caller, { existing with role = newRole });
      };
      case (null) {
        let newProfile : UserProfile = {
          principalId = caller;
          fullName = "";
          email = "";
          role = newRole;
          createdTime = currentTime;
          servicePincode = "000000";
          serviceAreaName = "Unknown";
          vehicleExperience = [];
          transmissionComfort = [];
          isAvailable = false;
          totalEarnings = 0;
          languages = null;
        };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  public query ({ caller }) func getAllTripsAdmin() : async [Trip] {
    requireAuthenticated(caller);
    requireAdminCaller(caller);

    trips.entries().toArray().reverse().map(func((_, trip)) { trip });
  };

  public query ({ caller }) func getMyCustomerTrips() : async [Trip] {
    requireAuthenticated(caller);

    let filteredEntries = trips.entries().toArray().filter(
      func((_, trip)) { trip.customerId == caller }
    );

    filteredEntries.reverse().map(func((_, trip)) { trip });
  };

  public query ({ caller }) func getMyDriverTrips() : async [Trip] {
    requireAuthenticated(caller);

    let filteredEntries = trips.entries().toArray().filter(
      func((_, trip)) {
        switch (trip.driverId) {
          case (?ref) { ref == caller };
          case (null) { false };
        };
      }
    );

    filteredEntries.reverse().map(func((_, trip)) { trip });
  };

  public type CompleteTripResult = {
    #ok : Trip;
    #notFound;
    #notAssigned;
    #notAccepted;
  };

  public shared ({ caller }) func completeTrip(tripId : Text) : async CompleteTripResult {
    requireAuthenticated(caller);

    switch (trips.get(tripId)) {
      case (null) {
        #notFound;
      };
      case (?trip) {
        switch (trip.driverId) {
          case (?ref) {
            if (ref != caller) {
              #notAssigned;
            } else {
              switch (trip.status) {
                case (#accepted) {
                  let updatedTrip : Trip = {
                    trip with status = #completed
                  };
                  trips.add(tripId, updatedTrip);
                  #ok(updatedTrip);
                };
                case (_) { #notAccepted };
              };
            };
          };
          case (null) { #notAssigned };
        };
      };
    };
  };
};
