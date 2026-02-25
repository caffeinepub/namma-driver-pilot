import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EditDriverProfileForm from './EditDriverProfileForm';
import type { UserProfile } from '../backend';

interface EditDriverProfileModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile | null | undefined;
  /** True when the driver has at least one trip with status "accepted" */
  hasAcceptedTrip: boolean;
}

export default function EditDriverProfileModal({
  open,
  onClose,
  userProfile,
  hasAcceptedTrip,
}: EditDriverProfileModalProps) {
  if (!userProfile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Driver Profile</DialogTitle>
          <DialogDescription>
            Update your service area, vehicle experience, and duty status settings
          </DialogDescription>
        </DialogHeader>
        <EditDriverProfileForm
          userProfile={userProfile}
          onClose={onClose}
          hasAcceptedTrip={hasAcceptedTrip}
        />
      </DialogContent>
    </Dialog>
  );
}
