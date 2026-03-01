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
export enum Variant_customer_driver {
    customer = "customer",
    driver = "driver"
}
export enum Variant_ok {
    ok = "ok"
}
export enum VehicleExperience {
    suv = "suv",
    sedan = "sedan",
    luxury = "luxury",
    hatchback = "hatchback"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTrip(tripData: TripRequest): Promise<Trip>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyRole(): Promise<AppRole | null>;
    getPricingConfig(): Promise<PricingConfig>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    /**
     * / Returns "ok" as a health check that the backend runs correctly.
     */
    health(): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMyRole(role: Variant_customer_driver): Promise<Variant_ok>;
    updatePricingConfig(newConfig: PricingConfig): Promise<UpdateConfigResult>;
}
