import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    latitude?: number;
    area: string;
    longitude?: number;
    pincode: string;
}
export interface Trip {
    status: TripStatus;
    driverId?: Principal;
    vehicleType: VehicleType;
    duration: Duration;
    tripType: TripType;
    dropoffLocation?: Location;
    tripId: string;
    createdTime: Time;
    endDateTime?: Time;
    customerId: Principal;
    landmark?: string;
    journeyType: JourneyType;
    phone: string;
    startDateTime?: Time;
    pickupLocation: Location;
}
export type Time = bigint;
export type Duration = {
    __kind__: "hours";
    hours: bigint;
} | {
    __kind__: "days";
    days: bigint;
};
export interface UserProfile {
    serviceAreaName: string;
    servicePincode: string;
    role?: AppRole;
    vehicleExperience: Array<VehicleExperience>;
    languages?: Array<string>;
    isAvailable: boolean;
    fullName: string;
    createdTime: Time;
    email: string;
    totalEarnings: bigint;
    transmissionComfort: Array<TransmissionComfort>;
    principalId: Principal;
}
export enum AppRole {
    admin = "admin",
    customer = "customer",
    driver = "driver"
}
export enum JourneyType {
    roundTrip = "roundTrip",
    oneWay = "oneWay"
}
export enum TransmissionComfort {
    ev = "ev",
    automatic = "automatic",
    manual = "manual"
}
export enum TripStatus {
    requested = "requested",
    cancelled = "cancelled",
    completed = "completed",
    accepted = "accepted"
}
export enum TripType {
    local = "local",
    outstation = "outstation"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleType {
    suv = "suv",
    sedan = "sedan",
    luxury = "luxury",
    hatchback = "hatchback"
}
export interface backendInterface {
    acceptTrip(tripId: string): Promise<void>;
    adminAssignRole(user: Principal, role: AppRole): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeTrip(tripId: string): Promise<void>;
    createTrip(tripType: TripType, journeyType: JourneyType, vehicleType: VehicleType, duration: Duration, startDateTime: Time | null, endDateTime: Time | null, pickupLocation: Location, dropoffLocation: Location | null, phone: string, landmark: string | null): Promise<string>;
    getAllTrips(): Promise<Array<Trip>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyTrips(): Promise<Array<Trip>>;
    getRequestedTrips(): Promise<Array<Trip>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAvailability(isAvailable: boolean): Promise<void>;
    updateUserRole(role: AppRole): Promise<void>;
    upgradeCurrentUserToAdmin(code: string): Promise<string | null>;
}
