import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUpdateUserRoleAndLock } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppRole } from '../backend';

export default function RoleSelectionWarningModal() {
  const [countdown, setCountdown] = useState(60);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const updateRoleMutation = useUpdateUserRoleAndLock();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleContinue = async (role: AppRole) => {
    setSelectedRole(role);
    
    try {
      await updateRoleMutation.mutateAsync(role);
      toast.success(`Role set to ${role} successfully!`);
      
      // Redirect to appropriate dashboard
      if (role === AppRole.customer) {
        navigate({ to: '/customer/dashboard' });
      } else if (role === AppRole.driver) {
        navigate({ to: '/driver/dashboard' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to set role');
      setSelectedRole(null);
    }
  };

  const isButtonDisabled = countdown > 0 || updateRoleMutation.isPending;

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
            <DialogTitle>Important Notice</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Choose carefully. Role cannot be changed later.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Please wait before making your selection
            </p>
            <div className="text-5xl font-bold text-primary">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              seconds remaining
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-3">
          <Button
            onClick={() => handleContinue(AppRole.customer)}
            disabled={isButtonDisabled}
            className="w-full"
            size="lg"
          >
            {selectedRole === AppRole.customer && updateRoleMutation.isPending
              ? 'Setting up...'
              : 'Continue as Customer'}
          </Button>
          <Button
            onClick={() => handleContinue(AppRole.driver)}
            disabled={isButtonDisabled}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {selectedRole === AppRole.driver && updateRoleMutation.isPending
              ? 'Setting up...'
              : 'Continue as Driver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
