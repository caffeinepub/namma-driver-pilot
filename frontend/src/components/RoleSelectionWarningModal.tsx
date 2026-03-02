import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSetMyRoleCustomer, useSetMyRoleDriver, useGetMyRole } from '../hooks/useQueries';
import { Role } from '../backend';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Car, User } from 'lucide-react';
import { toast } from 'sonner';

interface RoleSelectionWarningModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RoleSelectionWarningModal({ open, onClose }: RoleSelectionWarningModalProps) {
  const navigate = useNavigate();
  const { data: role } = useGetMyRole();
  const setCustomer = useSetMyRoleCustomer();
  const setDriver = useSetMyRoleDriver();

  const isAdmin = role === Role.admin;
  const isSetting = setCustomer.isPending || setDriver.isPending;

  useEffect(() => {
    if (isAdmin) {
      navigate({ to: '/admin/dashboard' });
    }
  }, [isAdmin, navigate]);

  if (isAdmin) return null;

  const handleSelectCustomer = async () => {
    try {
      await setCustomer.mutateAsync();
      navigate({ to: '/customer/dashboard' });
      onClose();
    } catch (err) {
      console.error('[RoleSelectionWarningModal] setMyRoleCustomer failed:', err);
      toast.error('Failed to set role. Please try again.');
    }
  };

  const handleSelectDriver = async () => {
    try {
      await setDriver.mutateAsync();
      navigate({ to: '/driver/dashboard' });
      onClose();
    } catch (err) {
      console.error('[RoleSelectionWarningModal] setMyRoleDriver failed:', err);
      toast.error('Failed to set role. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Role</DialogTitle>
          <DialogDescription>
            Select how you want to use the platform. This cannot be changed later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 my-4">
          <button
            onClick={handleSelectCustomer}
            disabled={isSetting}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            <User className="h-8 w-8 text-primary" />
            <span className="font-semibold">Customer</span>
            <span className="text-xs text-muted-foreground text-center">Book rides and manage trips</span>
          </button>
          <button
            onClick={handleSelectDriver}
            disabled={isSetting}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            <Car className="h-8 w-8 text-primary" />
            <span className="font-semibold">Driver</span>
            <span className="text-xs text-muted-foreground text-center">Accept trips and earn</span>
          </button>
        </div>
        {isSetting && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your account…
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSetting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
