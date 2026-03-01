import type { UserProfile } from '../lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import EditDriverProfileForm from './EditDriverProfileForm';

interface EditDriverProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  hasAcceptedTrip?: boolean;
}

export default function EditDriverProfileModal({
  open,
  onClose,
  profile,
  hasAcceptedTrip,
}: EditDriverProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Driver Profile</DialogTitle>
          <DialogDescription>
            Update your service area, vehicle experience, and duty status settings.
          </DialogDescription>
        </DialogHeader>
        <EditDriverProfileForm
          profile={profile}
          onClose={onClose}
          hasAcceptedTrip={hasAcceptedTrip}
        />
      </DialogContent>
    </Dialog>
  );
}
