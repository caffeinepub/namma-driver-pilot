import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";

module {
  type UserRole = { #admin; #user; #guest };

  type AppRole = {
    #customer;
    #driver;
    #admin;
  };

  type LockedRole = {
    role : AppRole;
    isLocked : Bool;
  };

  type UserProfile = {
    principalId : Principal.Principal;
    email : Text;
    fullName : Text;
    role : LockedRole;
    createdTime : Time.Time;
  };

  type OldTripStatus = {
    #requested;
    #accepted;
    #completed;
    #cancelled;
  };

  type OldTrip = {
    tripId : Text;
    customerId : Principal.Principal;
    driverId : ?Principal.Principal;
    pickupLocation : Text;
    dropoffLocation : Text;
    status : OldTripStatus;
    createdTime : Time.Time;
  };

  // New types for old data migration
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

  type NewTripStatus = {
    #requested;
    #accepted;
    #completed;
    #cancelled;
  };

  type NewTrip = {
    tripId : Text;
    customerId : Principal.Principal;
    driverId : ?Principal.Principal;
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
    status : NewTripStatus;
    createdTime : Time.Time;
  };

  // Old actor type (before migration)
  type OldActor = {
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    trips : Map.Map<Text, OldTrip>;
  };

  // New actor type (after migration)
  type NewActor = {
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    trips : Map.Map<Text, NewTrip>;
  };

  public func run(old : OldActor) : NewActor {
    let newTrips = old.trips.map<Text, OldTrip, NewTrip>(
      func(_id, oldTrip) {
        {
          tripId = oldTrip.tripId;
          customerId = oldTrip.customerId;
          driverId = oldTrip.driverId;
          tripType = #local; // Default
          journeyType = #oneWay; // Default
          vehicleType = #hatchback; // Default
          duration = #hours(0); // Default
          startDateTime = null;
          endDateTime = null;
          pickupLocation = {
            pincode = "unknown";
            area = oldTrip.pickupLocation;
            latitude = null;
            longitude = null;
          };
          dropoffLocation = ?{
            pincode = "unknown";
            area = oldTrip.dropoffLocation;
            latitude = null;
            longitude = null;
          };
          phone = "unknown";
          landmark = null;
          status = oldTrip.status;
          createdTime = oldTrip.createdTime;
        };
      }
    );
    { old with trips = newTrips };
  };
};
