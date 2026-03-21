import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Loader2,
  Upload,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  DriverProfile,
  TransmissionType,
  UserProfile,
  VehicleType,
} from "../backend";
import { Role } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetDriverProfile,
  useSaveCallerUserProfile,
  useUpsertDriverProfile,
} from "../hooks/useQueries";

const TOTAL_STEPS = 16;

const VEHICLE_OPTIONS = [
  { value: "Hatchback", label: "Hatchback" },
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "Luxury", label: "Luxury" },
];

const TRANSMISSION_OPTIONS = [
  { value: "Manual", label: "Manual" },
  { value: "Automatic", label: "Automatic" },
  { value: "EV", label: "EV (Electric Vehicle)" },
];

const EXPERIENCE_OPTIONS = [
  { value: "uber", label: "Uber" },
  { value: "ola", label: "Ola" },
  { value: "rapido", label: "Rapido" },
  { value: "none", label: "No prior app experience" },
];

const LANGUAGE_OPTIONS = ["Kannada", "English", "Hindi", "Tamil", "Telugu"];

interface DriverOnboardingProps {
  mode: "onboarding" | "edit";
  onComplete: () => void;
  onCancel?: () => void;
}

export default function DriverOnboarding({
  mode,
  onComplete,
  onCancel,
}: DriverOnboardingProps) {
  const { identity } = useInternetIdentity();
  const { data: existingDriverProfile } = useGetDriverProfile();
  const { data: existingUserProfile } = useGetCallerUserProfile();

  const [step, setStep] = useState(1);

  // Form state
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [_city, _setCity] = useState("Bangalore");
  const [selfieCapture, setSelfieCapture] = useState(false);
  const [dlUploaded, setDlUploaded] = useState(false);
  const [dlNumber, setDlNumber] = useState("");
  // Aadhar
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharFrontUploaded, setAadharFrontUploaded] = useState(false);
  const [aadharBackUploaded, setAadharBackUploaded] = useState(false);
  // Vehicle & Transmission
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [luxuryVehicleDetails, setLuxuryVehicleDetails] = useState("");
  const [transmissionTypes, setTransmissionTypes] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Kannada", "English"]);
  // Service areas - free text
  const [serviceAreasText, setServiceAreasText] = useState("");
  const [servicePincode, setServicePincode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIFSC, setBankIFSC] = useState("");
  const [bankUPI, setBankUPI] = useState("");
  const [behaviorChecks, setBehaviorChecks] = useState({
    noRash: false,
    polite: false,
    clean: false,
  });
  const [legalChecks, setLegalChecks] = useState({
    commission: false,
    jurisdiction: false,
  });

  const upsertDriver = useUpsertDriverProfile();
  const saveProfile = useSaveCallerUserProfile();

  // Pre-fill from existing profiles
  useEffect(() => {
    if (existingUserProfile) {
      setFullName(existingUserProfile.fullName || "");
      if (existingUserProfile.serviceAreaName)
        setServiceAreasText(existingUserProfile.serviceAreaName);
      if (existingUserProfile.servicePincode)
        setServicePincode(existingUserProfile.servicePincode);
    }
    if (existingDriverProfile) {
      const dp = existingDriverProfile;
      if (dp.fullName) setFullName(dp.fullName);
      if (dp.mobile) setMobile(dp.mobile);
      if (dp.dlNumber) setDlNumber(dp.dlNumber);
      if (dp.dlPhotoBase64) setDlUploaded(true);
      if (dp.selfieBase64) setSelfieCapture(true);
      if (dp.aadharNumber) setAadharNumber(dp.aadharNumber);
      if (dp.aadharFrontBase64) setAadharFrontUploaded(true);
      if (dp.aadharBackBase64) setAadharBackUploaded(true);
      if (dp.vehicleTypes?.length > 0) setVehicleTypes(dp.vehicleTypes);
      if (dp.luxuryVehicleDetails)
        setLuxuryVehicleDetails(dp.luxuryVehicleDetails);
      if (dp.transmissionTypes?.length > 0)
        setTransmissionTypes(dp.transmissionTypes);
      if (dp.serviceAreaName) setServiceAreasText(dp.serviceAreaName);
      if (dp.servicePincode) setServicePincode(dp.servicePincode);
      if (dp.languages?.length > 0) setLanguages(dp.languages);
      if (dp.bankName) setBankName(dp.bankName);
      if (dp.bankAccount) setBankAccount(dp.bankAccount);
      if (dp.bankIFSC) setBankIFSC(dp.bankIFSC);
      if (dp.bankUPI) setBankUPI(dp.bankUPI);
    }
  }, [existingDriverProfile, existingUserProfile]);

  const handleSubmit = async () => {
    try {
      const principal = identity?.getPrincipal();
      if (!principal) throw new Error("Not authenticated");

      const driverProfile: DriverProfile = {
        serviceAreaName: serviceAreasText,
        servicePincode,
        vehicleExperience: vehicleTypes.map(
          (v) => v.toLowerCase() as VehicleType,
        ),
        transmissionComfort: transmissionTypes.map(
          (t) => t.toLowerCase() as TransmissionType,
        ),
        languages,
        isAvailable: false,
        updatedTime: BigInt(Date.now()),
        vehicleTypes,
        transmissionTypes,
        luxuryVehicleDetails,
        aadharNumber,
        aadharFrontBase64: aadharFrontUploaded
          ? "data:image/jpeg;base64,AADHAR_FRONT_MOCK"
          : "",
        aadharBackBase64: aadharBackUploaded
          ? "data:image/jpeg;base64,AADHAR_BACK_MOCK"
          : "",
        dlNumber,
        dlPhotoBase64: dlUploaded ? "data:image/jpeg;base64,DL_MOCK" : "",
        selfieBase64: selfieCapture ? "data:image/jpeg;base64,SELFIE_MOCK" : "",
        fullName,
        mobile,
        bankName,
        bankAccount,
        bankIFSC,
        bankUPI,
      };

      const userProfile: UserProfile = {
        fullName,
        email: "",
        serviceAreaName: serviceAreasText,
        servicePincode,
        role: Role.driver,
        vehicleExperience: [],
        languages,
        isAvailable: false,
        createdTime: BigInt(Date.now()),
        totalEarnings: BigInt(0),
        transmissionComfort: [],
        principalId: principal,
      };

      await upsertDriver.mutateAsync(driverProfile);
      await saveProfile.mutateAsync(userProfile);

      toast.success("Profile submitted! Pending admin review.");
      onComplete();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit. Please try again.");
    }
  };

  const isSaving = upsertDriver.isPending || saveProfile.isPending;

  function toggleVehicleType(val: string) {
    setVehicleTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );
  }

  function toggleTransmission(val: string) {
    setTransmissionTypes((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val],
    );
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 3:
        return mobile.length >= 10;
      case 4:
        return fullName.trim().length > 0;
      case 6:
        return dlNumber.trim().length > 0;
      case 7:
        return aadharNumber.trim().length > 0;
      case 8:
        return vehicleTypes.length > 0;
      case 9:
        return transmissionTypes.length > 0;
      case 12:
        return serviceAreasText.trim().length > 0;
      case 13:
        return bankAccount.trim().length > 0 && bankIFSC.trim().length > 0;
      case 14:
        return (
          behaviorChecks.noRash && behaviorChecks.polite && behaviorChecks.clean
        );
      case 15:
        return legalChecks.commission && legalChecks.jurisdiction;
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
                data-ocid="driver-onboarding.cancel_button"
              >
                {mode === "edit" ? "Cancel" : ""}
              </button>
            )}
          </div>
          <Progress
            value={progressPercent}
            className="h-2"
            data-ocid="driver-onboarding.loading_state"
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
              data-ocid="driver-onboarding.panel"
            >
              <div className="text-6xl">🚖</div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome Namma Driver!
              </h1>
              <p className="text-muted-foreground text-lg">
                Start earning with Namma Driver Pilot. Complete your profile in
                a few easy steps.
              </p>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground text-base font-semibold py-6"
                onClick={() => setStep(2)}
                data-ocid="driver-onboarding.primary_button"
              >
                Let&apos;s Get Started
              </Button>
            </div>
          )}

          {/* Step 2: Role Confirmed */}
          {step === 2 && (
            <div
              className="text-center space-y-6"
              data-ocid="driver-onboarding.panel"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Driver Role Confirmed
              </h2>
              <p className="text-muted-foreground">
                Your Internet Identity is verified and your Driver role is set.
                Let&apos;s build your profile.
              </p>
              <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 font-mono break-all">
                {identity?.getPrincipal().toString()}
              </div>
            </div>
          )}

          {/* Step 3: Mobile */}
          {step === 3 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  📱 Your Mobile Number
                </h2>
                <p className="text-muted-foreground">
                  We&apos;ll use this for trip coordination.
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
                  data-ocid="driver-onboarding.input"
                />
              </div>
            </div>
          )}

          {/* Step 4: Name + City */}
          {step === 4 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Your Details
                </h2>
                <p className="text-muted-foreground">
                  Tell us a bit about yourself.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="text-lg py-6"
                    data-ocid="driver-onboarding.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-4">
                    <span className="text-lg">Bangalore</span>
                    <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                      ✓ Confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Selfie */}
          {step === 5 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  📸 Profile Selfie
                </h2>
                <p className="text-muted-foreground">
                  Take a clear selfie for your driver profile. Customers will
                  see this.
                </p>
              </div>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setSelfieCapture(true)}
                data-ocid="driver-onboarding.upload_button"
              >
                {selfieCapture ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-primary font-medium">Selfie captured!</p>
                    <p className="text-xs text-muted-foreground">
                      (Mock — no real image stored)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Camera className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      Tap to take selfie
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Front camera • Good lighting recommended
                    </p>
                  </>
                )}
              </button>
              <p className="text-xs text-center text-muted-foreground">
                You can skip this for now and add later from your profile.
              </p>
            </div>
          )}

          {/* Step 6: DL Upload */}
          {step === 6 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Driving License
                </h2>
                <p className="text-muted-foreground">
                  Upload your license for verification.
                </p>
              </div>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setDlUploaded(true)}
                data-ocid="driver-onboarding.upload_button"
              >
                {dlUploaded ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                    <p className="text-primary font-medium">
                      License uploaded!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (Mock — no real file stored)
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">
                      Tap to upload DL photo
                    </p>
                  </>
                )}
              </button>
              <div className="space-y-2">
                <Label htmlFor="dlNumber">DL Number *</Label>
                <Input
                  id="dlNumber"
                  value={dlNumber}
                  onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KA0120210012345"
                  className="text-lg py-6 font-mono"
                  data-ocid="driver-onboarding.input"
                />
              </div>
            </div>
          )}

          {/* Step 7: Aadhar Card */}
          {step === 7 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  🪪 Aadhar Card
                </h2>
                <p className="text-muted-foreground">
                  Upload your Aadhar card for identity verification.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                <Input
                  id="aadharNumber"
                  value={aadharNumber}
                  onChange={(e) =>
                    setAadharNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 12),
                    )
                  }
                  placeholder="e.g. 123456789012"
                  className="text-lg py-6 font-mono"
                  maxLength={12}
                  data-ocid="driver-onboarding.input"
                />
              </div>
              <div className="space-y-3">
                <Label>Aadhar Front Photo</Label>
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => setAadharFrontUploaded(true)}
                  data-ocid="driver-onboarding.upload_button"
                >
                  {aadharFrontUploaded ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                      <p className="text-primary font-medium text-sm">
                        Front uploaded!
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        Tap to upload front side
                      </p>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-3">
                <Label>Aadhar Back Photo</Label>
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => setAadharBackUploaded(true)}
                  data-ocid="driver-onboarding.upload_button"
                >
                  {aadharBackUploaded ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                      <p className="text-primary font-medium text-sm">
                        Back uploaded!
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        Tap to upload back side
                      </p>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                (Mock upload — no real file stored)
              </p>
            </div>
          )}

          {/* Step 8: Vehicle Type — full-width vertical checkbox list */}
          {step === 8 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  🚗 Vehicle Type
                </h2>
                <p className="text-muted-foreground">
                  Select all vehicle types you are comfortable driving.
                </p>
              </div>
              <div className="space-y-3">
                {VEHICLE_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      vehicleTypes.includes(v.value)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                    onClick={() => toggleVehicleType(v.value)}
                    data-ocid={`driver-onboarding.vehicle.${v.value.toLowerCase()}.checkbox`}
                  >
                    <Checkbox
                      checked={vehicleTypes.includes(v.value)}
                      onCheckedChange={() => toggleVehicleType(v.value)}
                    />
                    <span className="font-medium text-base">{v.label}</span>
                  </button>
                ))}
              </div>
              {vehicleTypes.includes("Luxury") && (
                <div className="space-y-2">
                  <Label htmlFor="luxuryDetails">
                    Specify Luxury Vehicle Model &amp; Experience
                  </Label>
                  <Input
                    id="luxuryDetails"
                    value={luxuryVehicleDetails}
                    onChange={(e) => setLuxuryVehicleDetails(e.target.value)}
                    placeholder="Specify Luxury Vehicle Model & Experience"
                    className="mt-2"
                    data-ocid="driver-onboarding.input"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 9: Transmission Type */}
          {step === 9 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  ⚙️ Transmission Type
                </h2>
                <p className="text-muted-foreground">
                  Select all transmission types you can handle.
                </p>
              </div>
              <div className="space-y-3">
                {TRANSMISSION_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      transmissionTypes.includes(t.value)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                    onClick={() => toggleTransmission(t.value)}
                    data-ocid={`driver-onboarding.transmission.${t.value.toLowerCase()}.checkbox`}
                  >
                    <Checkbox
                      checked={transmissionTypes.includes(t.value)}
                      onCheckedChange={() => toggleTransmission(t.value)}
                    />
                    <span className="font-medium text-base">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 10: Experience */}
          {step === 10 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Prior Experience
                </h2>
                <p className="text-muted-foreground">
                  Have you driven for any ride-hailing platforms?
                </p>
              </div>
              <div className="space-y-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperience(opt.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      experience === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                    data-ocid={`driver-onboarding.${opt.value}.button`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 11: Languages */}
          {step === 11 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Languages Spoken
                </h2>
                <p className="text-muted-foreground">
                  Select all languages you&apos;re comfortable communicating in.
                </p>
              </div>
              <div className="space-y-3">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <div
                    key={lang}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      languages.includes(lang)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                    data-ocid={`driver-onboarding.language.${lang.toLowerCase()}.checkbox`}
                  >
                    <Checkbox
                      checked={languages.includes(lang)}
                      onCheckedChange={() => toggleLanguage(lang)}
                    />
                    <span className="font-medium text-base">{lang}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 12: Service Areas — free text */}
          {step === 12 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  📍 Service Areas
                </h2>
                <p className="text-muted-foreground">
                  Enter the areas and pincodes where you&apos;ll be available
                  for trips.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceAreasText">Areas &amp; Pincodes *</Label>
                <Input
                  id="serviceAreasText"
                  value={serviceAreasText}
                  onChange={(e) => setServiceAreasText(e.target.value)}
                  placeholder="e.g., Whitefield, 560066"
                  className="text-lg py-6"
                  data-ocid="driver-onboarding.input"
                />
                <p className="text-xs text-muted-foreground">
                  Type area names and pincodes separated by commas.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicePincode">Primary Pincode *</Label>
                <Input
                  id="servicePincode"
                  value={servicePincode}
                  onChange={(e) => setServicePincode(e.target.value)}
                  placeholder="e.g. 560066"
                  maxLength={6}
                  className="text-lg py-6"
                  data-ocid="driver-onboarding.input"
                />
              </div>
            </div>
          )}

          {/* Step 13: Bank Details */}
          {step === 13 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  🏦 Bank Details for Earnings
                </h2>
                <p className="text-muted-foreground">
                  Your earnings will be transferred to this account.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Account Holder Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="As per bank records"
                    data-ocid="driver-onboarding.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number *</Label>
                  <Input
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 1234567890"
                    data-ocid="driver-onboarding.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankIFSC">IFSC Code *</Label>
                  <Input
                    id="bankIFSC"
                    value={bankIFSC}
                    onChange={(e) => setBankIFSC(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="font-mono"
                    data-ocid="driver-onboarding.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankUPI">UPI ID (optional)</Label>
                  <Input
                    id="bankUPI"
                    value={bankUPI}
                    onChange={(e) => setBankUPI(e.target.value)}
                    placeholder="e.g. name@upi"
                    data-ocid="driver-onboarding.input"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your bank details are stored securely and used only for earnings
                transfer.
              </p>
            </div>
          )}

          {/* Step 14: Behavior Rules */}
          {step === 14 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Driver Code of Conduct
                </h2>
                <p className="text-muted-foreground">
                  Please acknowledge the following commitments to join Namma
                  Driver Pilot.
                </p>
              </div>
              <div className="space-y-4">
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    behaviorChecks.noRash
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="driver-onboarding.no_rash.checkbox"
                >
                  <Checkbox
                    checked={behaviorChecks.noRash}
                    onCheckedChange={(v) =>
                      setBehaviorChecks((p) => ({ ...p, noRash: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">No rash driving</p>
                    <p className="text-sm text-muted-foreground">
                      I commit to safe, responsible driving at all times.
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    behaviorChecks.polite
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="driver-onboarding.polite.checkbox"
                >
                  <Checkbox
                    checked={behaviorChecks.polite}
                    onCheckedChange={(v) =>
                      setBehaviorChecks((p) => ({ ...p, polite: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">Polite to customers</p>
                    <p className="text-sm text-muted-foreground">
                      I will maintain professional and respectful behaviour.
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    behaviorChecks.clean
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="driver-onboarding.clean.checkbox"
                >
                  <Checkbox
                    checked={behaviorChecks.clean}
                    onCheckedChange={(v) =>
                      setBehaviorChecks((p) => ({ ...p, clean: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">Clean vehicle</p>
                    <p className="text-sm text-muted-foreground">
                      I will ensure the customer&apos;s vehicle is kept clean.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 15: Legal Agreement */}
          {step === 15 && (
            <div className="space-y-6" data-ocid="driver-onboarding.panel">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Legal Agreement
                </h2>
                <p className="text-muted-foreground">
                  Please read and acknowledge the terms before joining.
                </p>
              </div>
              <div className="space-y-4">
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    legalChecks.commission
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="driver-onboarding.commission.checkbox"
                >
                  <Checkbox
                    checked={legalChecks.commission}
                    onCheckedChange={(v) =>
                      setLegalChecks((p) => ({ ...p, commission: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">15% platform commission</p>
                    <p className="text-sm text-muted-foreground">
                      I understand that Namma Driver Pilot charges 15%
                      commission on each completed trip fare.
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    legalChecks.jurisdiction
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                  data-ocid="driver-onboarding.jurisdiction.checkbox"
                >
                  <Checkbox
                    checked={legalChecks.jurisdiction}
                    onCheckedChange={(v) =>
                      setLegalChecks((p) => ({ ...p, jurisdiction: !!v }))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold">Bangalore jurisdiction</p>
                    <p className="text-sm text-muted-foreground">
                      I agree that all disputes will be resolved under Bangalore
                      jurisdiction and applicable Indian law.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 16: Review & Submit */}
          {step === 16 && (
            <div
              className="text-center space-y-6"
              data-ocid="driver-onboarding.panel"
            >
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-foreground">
                Almost There!
              </h2>
              <p className="text-muted-foreground">
                Your profile will be submitted for admin review. Once approved,
                you&apos;ll be able to go online and accept trips.
              </p>
              <div className="bg-muted rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{fullName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile</span>
                  <span className="font-medium">{mobile || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DL Number</span>
                  <span className="font-medium">{dlNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicles</span>
                  <span className="font-medium">
                    {vehicleTypes.join(", ") || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transmission</span>
                  <span className="font-medium">
                    {transmissionTypes.join(", ") || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Area</span>
                  <span className="font-medium text-right max-w-[60%] truncate">
                    {serviceAreasText || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Languages</span>
                  <span className="font-medium">
                    {languages.join(", ") || "—"}
                  </span>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground text-base font-semibold py-6"
                onClick={handleSubmit}
                disabled={isSaving}
                data-ocid="driver-onboarding.submit_button"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : mode === "edit" ? (
                  "Save Profile"
                ) : (
                  "Submit for Review"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      {step > 1 && step < TOTAL_STEPS && (
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
              data-ocid="driver-onboarding.secondary_button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!isStepValid(step)}
              className="flex-1 bg-primary text-primary-foreground"
              data-ocid="driver-onboarding.primary_button"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Last step back button */}
      {step === TOTAL_STEPS && (
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
          <div className="max-w-lg mx-auto">
            <Button
              variant="outline"
              onClick={() => setStep(TOTAL_STEPS - 1)}
              className="w-full"
              data-ocid="driver-onboarding.secondary_button"
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
