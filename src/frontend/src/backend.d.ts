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
export interface LocalPricing {
    per_min_after_first_hour: number;
    min_hours: number;
    base_first_hour: number;
    wait_per_min: number;
    free_wait_mins: number;
}
export interface VehicleMultiplier {
    suv: number;
    sedan: number;
    luxury: number;
    hatchback: number;
}
export interface Trip {
    status: TripStatus;
    driverId?: Principal;
    vehicleType: VehicleType;
    duration: Duration;
    tripType: TripType;
    dropoffLocation?: Location;
    tripId: string;
    totalFare: bigint;
    createdTime: Time;
    endDateTime?: Time;
    ratePerHour: bigint;
    billableHours: bigint;
    customerId: Principal;
    landmark?: string;
    journeyType: JourneyType;
    phone: string;
    startDateTime?: Time;
    pickupLocation: Location;
}
export type Time = bigint;
export type CompleteTripResult = {
    __kind__: "ok";
    ok: Trip;
} | {
    __kind__: "notAssigned";
    notAssigned: null;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "notAccepted";
    notAccepted: null;
};
export interface TripRequest {
    driverId?: Principal;
    vehicleType: VehicleType;
    duration: Duration;
    tripType: TripType;
    dropoffLocation?: Location;
    tripId: string;
    totalFare: bigint;
    endDateTime?: Time;
    ratePerHour: bigint;
    billableHours: bigint;
    customerId?: Principal;
    landmark?: string;
    journeyType: JourneyType;
    phone: string;
    startDateTime?: Time;
    pickupLocation: Location;
}
export type Duration = {
    __kind__: "hours";
    hours: bigint;
} | {
    __kind__: "days";
    days: bigint;
};
export interface DriverProfile {
    serviceAreaName: string;
    updatedTime: bigint;
    aadharBackBase64: string;
    bankAccount: string;
    servicePincode: string;
    vehicleExperience: Array<VehicleType>;
    bankUPI: string;
    dlPhotoBase64: string;
    languages: Array<string>;
    isAvailable: boolean;
    fullName: string;
    aadharFrontBase64: string;
    bankIFSC: string;
    bankName: string;
    vehicleTypes: Array<string>;
    aadharNumber: string;
    transmissionTypes: Array<string>;
    dlNumber: string;
    transmissionComfort: Array<TransmissionType>;
    mobile: string;
    selfieBase64: string;
    luxuryVehicleDetails: string;
}
export interface Commission {
    local: number;
    outstation: number;
}
export type UpdateConfigResult = {
    __kind__: "ok";
    ok: PricingConfig;
} | {
    __kind__: "failedUpdate";
    failedUpdate: string;
} | {
    __kind__: "notAdmin";
    notAdmin: null;
} | {
    __kind__: "invalidConfig";
    invalidConfig: string;
} | {
    __kind__: "noConfigFound";
    noConfigFound: null;
};
export interface PricingConfig {
    commission: Commission;
    local: LocalPricing;
    vehicle_multiplier: VehicleMultiplier;
    outstation: OutstationPricing;
}
export type AcceptTripResult = {
    __kind__: "ok";
    ok: Trip;
} | {
    __kind__: "offDuty";
    offDuty: null;
} | {
    __kind__: "tripNotFound";
    tripNotFound: null;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
} | {
    __kind__: "alreadyAccepted";
    alreadyAccepted: null;
};
export interface UserProfile {
    serviceAreaName: string;
    servicePincode: string;
    role: Role;
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
export interface OutstationPricing {
    commission_rate: number;
    km_slab_1_limit: number;
    km_slab_2_limit: number;
    min_days: number;
    km_slab_3_limit: number;
    per_km_slab_1: number;
    per_km_slab_2: number;
    per_km_slab_3: number;
    per_km_slab_4: number;
    driver_bata_per_day: number;
    extra_driver_comp_per_100km_over_400: number;
}
export enum JourneyType {
    roundTrip = "roundTrip",
    oneWay = "oneWay"
}
export enum Role {
    admin = "admin",
    customer = "customer",
    unassigned = "unassigned",
    driver = "driver"
}
export enum TransmissionType {
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
    acceptTrip(tripId: string): Promise<AcceptTripResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeTrip(tripId: string): Promise<CompleteTripResult>;
    createTrip(tripData: TripRequest): Promise<Trip>;
    getAllTripsAdmin(): Promise<Array<Trip>>;
    getAvailableTripsForDriver(): Promise<Array<Trip>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDriverProfile(): Promise<DriverProfile | null>;
    getMyCustomerTrips(): Promise<Array<Trip>>;
    getMyDriverTrips(): Promise<Array<Trip>>;
    getMyRole(): Promise<Role>;
    getPricingConfig(): Promise<PricingConfig>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    health(): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    listAdmins(): Promise<Array<Principal>>;
    persistentAdminCheck(): Promise<boolean>;
    ping(): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMyRole(newRole: Role): Promise<void>;
    updatePricingConfig(newConfig: PricingConfig): Promise<UpdateConfigResult>;
    upsertDriverProfile(profile: DriverProfile): Promise<boolean>;
}
