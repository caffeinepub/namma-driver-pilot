import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { type UserProfile, AppRole } from '../backend';

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !fullName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!identity) {
      toast.error('Not authenticated');
      return;
    }

    const profile: UserProfile = {
      principalId: identity.getPrincipal(),
      email,
      fullName,
      role: {
        role: AppRole.customer, // Default to customer, will be changed in role selection
        isLocked: false,
      },
      createdTime: BigInt(Date.now() * 1000000),
      servicePincode: '',
      serviceAreaName: '',
      vehicleExperience: [],
      transmissionComfort: [],
      isAvailable: false,
      totalEarnings: BigInt(0),
      languages: undefined,
    };

    try {
      await saveProfile.mutateAsync(profile);
      toast.success('Profile created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Namma Driver Pilot</DialogTitle>
          <DialogDescription>
            Please complete your profile to get started
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending}
          >
            {saveProfile.isPending ? 'Creating Profile...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
