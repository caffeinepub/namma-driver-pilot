import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Nat64 "mo:core/Nat64";
import Time "mo:core/Time";

module {
  // Type aliases for migration
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AppRole = {
    #customer;
    #driver;
    #admin;
  };

  type LockedRole = {
    role : AppRole;
    isLocked : Bool;
  };

  type VehicleExperience = {
    #hatchback;
    #sedan;
    #suv;
    #luxury;
  };

  type TransmissionComfort = {
    #manual;
    #automatic;
    #ev;
  };

  // Old UserProfile type (without isVerified)
  type OldUserProfile = {
    principalId : Principal;
    email : Text;
    fullName : Text;
    role : LockedRole;
    createdTime : Time.Time;
    servicePincode : Text;
    serviceAreaName : Text;
    vehicleExperience : [VehicleExperience];
    transmissionComfort : [TransmissionComfort];
    isAvailable : Bool;
    totalEarnings : Nat64;
    languages : ?[Text];
  };

  // New UserProfile type (with isVerified)
  type NewUserProfile = {
    principalId : Principal;
    email : Text;
    fullName : Text;
    role : LockedRole;
    createdTime : Time.Time;
    servicePincode : Text;
    serviceAreaName : Text;
    vehicleExperience : [VehicleExperience];
    transmissionComfort : [TransmissionComfort];
    isAvailable : Bool;
    totalEarnings : Nat64;
    languages : ?[Text];
    isVerified : ?Bool;
  };

  type TripStatus = {
    #requested;
    #accepted;
    #completed;
    #cancelled;
  };

  type TripType = {
    #local;
    #outstation;
  };

  type JourneyType = {
    #oneWay;
    #roundTrip;
  };

  type VehicleType = {
    #hatchback;
    #sedan;
    #suv;
    #luxury;
  };

  type Duration = {
    #hours : Nat;
    #days : Nat;
  };

  type Location = {
    pincode : Text;
    area : Text;
    latitude : ?Float;
    longitude : ?Float;
  };

  // Old Trip type (without transmissionType)
  type OldTrip = {
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

  // New Trip type (with transmissionType)
  type NewTrip = {
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
    transmissionType : TransmissionComfort;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    trips : Map.Map<Text, OldTrip>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
    trips : Map.Map<Text, NewTrip>;
  };

  // Migration function
  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        { oldProfile with isVerified = null };
      }
    );

    let newTrips = old.trips.map<Text, OldTrip, NewTrip>(
      func(_tripId, oldTrip) {
        { oldTrip with transmissionType = #manual };
      }
    );

    { userProfiles = newUserProfiles; trips = newTrips };
  };
};
