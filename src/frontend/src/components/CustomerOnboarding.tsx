import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Car,
  CheckCircle2,
  Loader2,
  MapPin,
  Shield,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { Role } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

const TOTAL_STEPS = 11;

const VEHICLE_PREFS = [
  { value: "hatchback", label: "Hatchback", desc: "Compact, fuel-efficient" },
  { value: "sedan", label: "Sedan", desc: "Comfortable, spacious" },
  { value: "suv", label: "SUV", desc: "Premium, extra space" },
];

interface CustomerOnboardingProps {
  mode: "onboarding" | "edit";
  onComplete: () => void;
  onCancel?: () => void;
}

export default function CustomerOnboarding({
  mode,
  onComplete,
  onCancel,
}: CustomerOnboardingProps) {
  const { identity } = useInternetIdentity();
  const { data: existingUserProfile } = useGetCallerUserProfile();

  const [step, setStep] = useState(1);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehiclePref, setVehiclePref] = useState("");
  const [_notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [_locationAllowed, setLocationAllowed] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [complianceChecks, setComplianceChecks] = useState({
    insurance: false,
    puc: false,
    fitness: false,
    condition: false,
  });
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const saveProfile = useSaveCallerUserProfile();

  // Pre-fill from existing profile
  useEffect(() => {
    if (existingUserProfile) {
      setFullName(existingUserProfile.fullName || "");
      setEmail(existingUserProfile.email || "");
    }
  }, [existingUserProfile]);

  const handleDone = async () => {
    try {
      const principal = identity?.getPrincipal();
      if (!principal) throw new Error("Not authenticated");

      const userProfile: UserProfile = {
        fullName,
        email: email || "",
        serviceAreaName: "",
        servicePincode: "",
        role: Role.customer,
        vehicleExperience: [],
        languages: [],
        isAvailable: false,
        createdTime: BigInt(Date.now()),
        totalEarnings: BigInt(0),
        transmissionComfort: [],
        principalId: principal,
      };

      await saveProfile.mutateAsync(userProfile);
      toast.success("Profile saved! Welcome to Namma Driver Pilot.");
      onComplete();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save profile. Please try again.");
    }
  };

  const isSaving = saveProfile.isPending;

  const allComplianceChecked =
    complianceChecks.insurance &&
    complianceChecks.puc &&
    complianceChecks.fitness &&
    complianceChecks.condition;

  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 3:
        return fullName.trim().length > 0;
      case 4:
        return mobile.length >= 10;
      case 5:
        return vehiclePref !== "";
      case 8:
        return safetyAcknowledged;
      case 9:
        return allComplianceChecked;
      default:
        return true;
    }
  };

  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">
              Step {step} of {TOTAL_STEPS}
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="customer-onboarding.cancel_button"
              >
                {mode === "edit" ? "Cancel" : ""}
              </button>
            )}
          </div>
          <Progress
            value={progressPercent}
            className="h-2"
            data-ocid="customer-onboarding.loading_state"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div
              className="text-center space-y-6"
              data-ocid="customer-onboarding.panel"
            >
              <div className="text-6xl">🚖</div>
              <h1 className="text-3xl font-bold text-foreground">
                Book rides safely!
              </h1>
              <p className="text-muted-foreground text-lg">
                Namma Driver Pilot sends a professional driver to your location
                to drive your own vehicle. Safe, reliable, and simple.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-sm font-semibold text-amber-800">
                  🚨 This is NOT a taxi service
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  We send a driver to drive YOUR vehicle. You must have your own
                  car.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground text-base font-semibold py-6"
                onClick={() => setStep(2)}
                data-ocid="customer-onboarding.primary_button"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Step 2: Role Confirmed */}
          {step === 2 && (
            <div
              className="text-center space-y-6"
              data-ocid="customer-onboarding.panel"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Customer Role Confirmed
              </h2>
              <p className="text-muted-foreground">
                Your Internet Identity is verified and your Customer role is
                set.
              </p>
              <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 font-mono break-all">
                {identity?.getPrincipal().toString()}
              </div>
            </div>
          )}

          {/* Step 3: Name + Email */}
          {step === 3 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Your Details
                </h2>
                <p className="text-muted-foreground">
                  Let&apos;s start with your basic information.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="text-lg py-6"
                    data-ocid="customer-onboarding.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya@example.com"
                    data-ocid="customer-onboarding.input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Mobile */}
          {step === 4 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  📱 Mobile Number
                </h2>
                <p className="text-muted-foreground">
                  For booking confirmations and driver coordination.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className="text-lg py-6"
                  data-ocid="customer-onboarding.input"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your mobile number is never shared directly with drivers.
              </p>
            </div>
          )}

          {/* Step 5: Vehicle Preference */}
          {step === 5 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Your Vehicle Type
                </h2>
                <p className="text-muted-foreground">
                  What type of vehicle do you own?
                </p>
              </div>
              <div className="space-y-3">
                {VEHICLE_PREFS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVehiclePref(v.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      vehiclePref === v.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                    data-ocid={`customer-onboarding.${v.value}.button`}
                  >
                    <Car
                      className={`w-6 h-6 ${
                        vehiclePref === v.value
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="font-semibold">{v.label}</p>
                      <p className="text-sm text-muted-foreground">{v.desc}</p>
                    </div>
                    {vehiclePref === v.value && (
                      <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Notifications */}
          {step === 6 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <Bell className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Stay Updated
                </h2>
                <p className="text-muted-foreground">
                  Allow notifications to get real-time trip updates and driver
                  arrival alerts.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground py-6"
                  onClick={() => {
                    setNotificationsAllowed(true);
                    setStep(7);
                  }}
                  data-ocid="customer-onboarding.allow.button"
                >
                  Allow Notifications ✓
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full py-6"
                  onClick={() => setStep(7)}
                  data-ocid="customer-onboarding.skip.button"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Location */}
          {step === 7 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Location Access
                </h2>
                <p className="text-muted-foreground">
                  Allow location access for automatic pickup detection and
                  nearby driver matching.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground py-6"
                  onClick={() => {
                    setLocationAllowed(true);
                    setStep(8);
                  }}
                  data-ocid="customer-onboarding.allow_location.button"
                >
                  Allow Location Access ✓
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full py-6"
                  onClick={() => setStep(8)}
                  data-ocid="customer-onboarding.skip_location.button"
                >
                  Not Now
                </Button>
              </div>
            </div>
          )}

          {/* Step 8: Safety Disclaimer */}
          {step === 8 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
                  <Shield className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Safety First
                </h2>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                <p className="font-semibold text-amber-900">
                  ⚠️ Important Safety Notice
                </p>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li>
                    • The assigned driver <strong>MUST</strong> present a valid
                    Driving License before starting the trip.
                  </li>
                  <li>
                    • If the driver fails to present a valid original Driving
                    License, you have the right to cancel the booking.
                  </li>
                  <li>
                    • Always verify the driver&apos;s identity matches the app
                    profile.
                  </li>
                </ul>
              </div>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground py-6"
                onClick={() => {
                  setSafetyAcknowledged(true);
                  setStep(9);
                }}
                data-ocid="customer-onboarding.acknowledge.button"
              >
                I Understand and Acknowledge ✓
              </Button>
            </div>
          )}

          {/* Step 9: Vehicle Compliance Checklist */}
          {step === 9 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  🚗 Vehicle Compliance
                </h2>
                <p className="text-muted-foreground">
                  Since our driver will operate YOUR vehicle, please confirm
                  your vehicle is road-legal and compliant.
                </p>
              </div>
              <div className="space-y-4">
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    complianceChecks.insurance
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="customer-onboarding.insurance.checkbox"
                >
                  <Checkbox
                    checked={complianceChecks.insurance}
                    onCheckedChange={(v) =>
                      setComplianceChecks((p) => ({ ...p, insurance: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">Valid Insurance</p>
                    <p className="text-sm text-muted-foreground">
                      My vehicle has a valid third-party or comprehensive
                      insurance policy.
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    complianceChecks.puc
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="customer-onboarding.puc.checkbox"
                >
                  <Checkbox
                    checked={complianceChecks.puc}
                    onCheckedChange={(v) =>
                      setComplianceChecks((p) => ({ ...p, puc: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">PUC Certificate</p>
                    <p className="text-sm text-muted-foreground">
                      My vehicle has a valid Pollution Under Control (PUC)
                      certificate.
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    complianceChecks.fitness
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="customer-onboarding.fitness.checkbox"
                >
                  <Checkbox
                    checked={complianceChecks.fitness}
                    onCheckedChange={(v) =>
                      setComplianceChecks((p) => ({ ...p, fitness: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">Fitness / RC Certificate</p>
                    <p className="text-sm text-muted-foreground">
                      My vehicle has a valid Registration Certificate (RC) and
                      fitness certificate.
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    complianceChecks.condition
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="customer-onboarding.condition.checkbox"
                >
                  <Checkbox
                    checked={complianceChecks.condition}
                    onCheckedChange={(v) =>
                      setComplianceChecks((p) => ({ ...p, condition: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">Vehicle in Good Condition</p>
                    <p className="text-sm text-muted-foreground">
                      My vehicle is mechanically sound, with working brakes,
                      lights, and tyres.
                    </p>
                  </div>
                </div>
              </div>
              {!allComplianceChecked && (
                <p className="text-xs text-muted-foreground text-center">
                  All four items must be acknowledged to proceed.
                </p>
              )}
            </div>
          )}

          {/* Step 10: Emergency Contact */}
          {step === 10 && (
            <div className="space-y-6" data-ocid="customer-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Emergency Contact
                </h2>
                <p className="text-muted-foreground">
                  Add someone we can notify in case of an emergency. You can
                  skip this for now.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Rahul (brother)"
                    data-ocid="customer-onboarding.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    data-ocid="customer-onboarding.input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 11: Done */}
          {step === 11 && (
            <div
              className="text-center space-y-6"
              data-ocid="customer-onboarding.panel"
            >
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-foreground">
                You&apos;re All Set!
              </h2>
              <p className="text-muted-foreground text-lg">
                Welcome to Namma Driver Pilot! You can now book a professional
                driver for your vehicle.
              </p>
              <div className="bg-primary/10 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{fullName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium capitalize">
                    {vehiclePref || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile</span>
                  <span className="font-medium">{mobile || "—"}</span>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground text-base font-semibold py-6"
                onClick={handleDone}
                disabled={isSaving}
                data-ocid="customer-onboarding.submit_button"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : mode === "edit" ? (
                  "Save Profile"
                ) : (
                  "Book My First Ride 🚖"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      {step > 1 &&
        step < TOTAL_STEPS &&
        step !== 6 &&
        step !== 7 &&
        step !== 8 && (
          <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
            <div className="max-w-lg mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1"
                data-ocid="customer-onboarding.secondary_button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!isStepValid(step)}
                className="flex-1 bg-primary text-primary-foreground"
                data-ocid="customer-onboarding.primary_button"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

      {/* Steps 6, 7, 8 only show back button */}
      {(step === 6 || step === 7 || step === 8) && (
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
          <div className="max-w-lg mx-auto">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="w-full"
              data-ocid="customer-onboarding.secondary_button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Step 11: back only */}
      {step === TOTAL_STEPS && (
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
          <div className="max-w-lg mx-auto">
            <Button
              variant="outline"
              onClick={() => setStep(TOTAL_STEPS - 1)}
              className="w-full"
              data-ocid="customer-onboarding.secondary_button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
