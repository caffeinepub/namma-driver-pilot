import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import type { DriverProfile, UserProfile } from "../backend";
import { normalizeDriverProfile } from "../utils/normalizeProfile";
import EditDriverProfileForm from "./EditDriverProfileForm";

interface EditDriverProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | DriverProfile | null;
}

export default function EditDriverProfileModal({
  open,
  onClose,
  profile,
}: EditDriverProfileModalProps) {
  const normalized = profile ? normalizeDriverProfile(profile as any) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Driver Profile</DialogTitle>
          <DialogDescription>
            Update your service area, vehicle experience, and availability.
          </DialogDescription>
        </DialogHeader>
        <EditDriverProfileForm profile={normalized} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
