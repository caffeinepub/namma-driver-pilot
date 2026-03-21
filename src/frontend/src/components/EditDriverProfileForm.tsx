import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { DriverProfile, TransmissionType, VehicleType } from "../backend";
import { useUpsertDriverProfile } from "../hooks/useQueries";
import type { NormalizedDriverProfile } from "../utils/normalizeProfile";

const VEHICLE_OPTIONS: VehicleType[] = [
  "hatchback",
  "sedan",
  "suv",
  "luxury",
] as VehicleType[];
const TRANSMISSION_OPTIONS: TransmissionType[] = [
  "manual",
  "automatic",
  "ev",
] as TransmissionType[];

const VEHICLE_LABELS: Record<string, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  suv: "SUV",
  luxury: "Luxury",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "Manual",
  automatic: "Automatic",
  ev: "EV",
};

interface EditDriverProfileFormProps {
  profile: NormalizedDriverProfile | null;
  onClose: () => void;
}

export default function EditDriverProfileForm({
  profile,
  onClose,
}: EditDriverProfileFormProps) {
  const [serviceAreaName, setServiceAreaName] = useState("");
  const [servicePincode, setServicePincode] = useState("");
  const [vehicleExperience, setVehicleExperience] = useState<string[]>([]);
  const [transmissionComfort, setTransmissionComfort] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("");

  const upsertMutation = useUpsertDriverProfile();

  // Populate form from profile when it changes
  useEffect(() => {
    if (profile) {
      setServiceAreaName(profile.serviceAreaName ?? "");
      setServicePincode(profile.servicePincode ?? "");
      setVehicleExperience(profile.vehicleExperience ?? []);
      setTransmissionComfort(profile.transmissionComfort ?? []);
      setIsAvailable(profile.isAvailable ?? false);
      setLanguages(profile.languages ?? []);
    }
  }, [profile]);

  function toggleVehicle(v: string) {
    setVehicleExperience((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function toggleTransmission(t: string) {
    setTransmissionComfort((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function addLanguage() {
    const lang = newLanguage.trim();
    if (lang && !languages.includes(lang)) {
      setLanguages((prev) => [...prev, lang]);
    }
    setNewLanguage("");
  }

  function removeLanguage(lang: string) {
    setLanguages((prev) => prev.filter((l) => l !== lang));
  }

  async function handleSave() {
    const driverProfile: DriverProfile = {
      serviceAreaName,
      servicePincode,
      vehicleExperience: vehicleExperience as VehicleType[],
      transmissionComfort: transmissionComfort as TransmissionType[],
      languages,
      isAvailable,
      updatedTime: BigInt(Date.now()),
      vehicleTypes: vehicleExperience,
      transmissionTypes: transmissionComfort,
      luxuryVehicleDetails: "",
      aadharNumber: "",
      aadharFrontBase64: "",
      aadharBackBase64: "",
      dlNumber: "",
      dlPhotoBase64: "",
      selfieBase64: "",
      fullName: "",
      mobile: "",
      bankName: "",
      bankAccount: "",
      bankIFSC: "",
      bankUPI: "",
    };

    try {
      await upsertMutation.mutateAsync(driverProfile);
      toast.success("Profile saved");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  }

  const isSaving = upsertMutation.isPending;

  return (
    <div className="space-y-6 py-2">
      {/* Service Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="serviceAreaName">Service Area Name</Label>
          <Input
            id="serviceAreaName"
            value={serviceAreaName}
            onChange={(e) => setServiceAreaName(e.target.value)}
            placeholder="e.g. Bangalore North"
            disabled={isSaving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="servicePincode">Service Pincode</Label>
          <Input
            id="servicePincode"
            value={servicePincode}
            onChange={(e) => setServicePincode(e.target.value)}
            placeholder="e.g. 560001"
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="font-medium text-sm">Availability</p>
          <p className="text-xs text-muted-foreground">
            {isAvailable
              ? "You are On-Duty and visible to customers"
              : "You are Off-Duty"}
          </p>
        </div>
        <Switch
          checked={isAvailable}
          onCheckedChange={setIsAvailable}
          disabled={isSaving}
        />
      </div>

      {/* Vehicle Experience */}
      <div className="space-y-2">
        <Label>Vehicle Experience</Label>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggleVehicle(v)}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                vehicleExperience.includes(v)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {VEHICLE_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Transmission Comfort */}
      <div className="space-y-2">
        <Label>Transmission Comfort</Label>
        <div className="flex flex-wrap gap-2">
          {TRANSMISSION_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTransmission(t)}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                transmissionComfort.includes(t)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {TRANSMISSION_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <Label>Languages Spoken</Label>
        <div className="flex gap-2">
          <Input
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="e.g. Kannada"
            disabled={isSaving}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLanguage();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addLanguage}
            disabled={isSaving || !newLanguage.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {languages.map((lang) => (
              <Badge key={lang} variant="secondary" className="gap-1 pr-1">
                {lang}
                <button
                  type="button"
                  onClick={() => removeLanguage(lang)}
                  disabled={isSaving}
                  className="ml-0.5 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
