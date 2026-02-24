import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUpdateUserRole } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Users, Car, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AppRole } from '../backend';

const ADMIN_SETUP_CODE = 'NAMMA5600';

export default function RoleSelectionWarningModal() {
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeError, setAdminCodeError] = useState('');
  const updateRoleMutation = useUpdateUserRole();
  const navigate = useNavigate();

  const handleSelectRole = async (role: AppRole) => {
    try {
      await updateRoleMutation.mutateAsync(role);
      toast.success(`Role set to ${role} successfully!`);
      if (role === AppRole.customer) {
        navigate({ to: '/customer/dashboard' });
      } else if (role === AppRole.driver) {
        navigate({ to: '/driver/dashboard' });
      } else if (role === AppRole.admin) {
        navigate({ to: '/admin/dashboard' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to set role');
    }
  };

  const handleAdminSubmit = async () => {
    setAdminCodeError('');
    if (adminCode !== ADMIN_SETUP_CODE) {
      setAdminCodeError('Invalid admin setup code');
      return;
    }
    await handleSelectRole(AppRole.admin);
  };

  const isPending = updateRoleMutation.isPending;

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>Choose Your Role</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {showAdminInput
              ? 'Enter the admin setup code to continue as Admin.'
              : 'Select your role carefully — it cannot be changed later.'}
          </DialogDescription>
        </DialogHeader>

        {!showAdminInput ? (
          <DialogFooter className="flex-col sm:flex-col gap-3 pt-4">
            <Button
              onClick={() => handleSelectRole(AppRole.customer)}
              disabled={isPending}
              className="w-full"
              size="lg"
            >
              <Users className="mr-2 h-4 w-4" />
              {isPending && updateRoleMutation.variables === AppRole.customer
                ? 'Setting up...'
                : 'Continue as Customer'}
            </Button>
            <Button
              onClick={() => handleSelectRole(AppRole.driver)}
              disabled={isPending}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Car className="mr-2 h-4 w-4" />
              {isPending && updateRoleMutation.variables === AppRole.driver
                ? 'Setting up...'
                : 'Continue as Driver'}
            </Button>
            <Button
              onClick={() => setShowAdminInput(true)}
              disabled={isPending}
              variant="ghost"
              className="w-full text-muted-foreground"
              size="lg"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Setup Admin
            </Button>
          </DialogFooter>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="adminCode">Admin Setup Code</Label>
              <Input
                id="adminCode"
                type="password"
                placeholder="Enter setup code"
                value={adminCode}
                onChange={(e) => {
                  setAdminCode(e.target.value);
                  setAdminCodeError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminSubmit();
                }}
                autoFocus
              />
              {adminCodeError && (
                <p className="text-sm text-destructive">{adminCodeError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAdminInput(false);
                  setAdminCode('');
                  setAdminCodeError('');
                }}
                disabled={isPending}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleAdminSubmit}
                disabled={isPending || !adminCode}
                className="flex-1"
              >
                {isPending ? 'Setting up...' : 'Confirm Admin'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
