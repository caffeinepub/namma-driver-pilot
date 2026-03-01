import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import type { UserProfile } from '../lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
  existingProfile?: UserProfile | null;
}

export default function ProfileSetupModal({ open, onComplete, existingProfile }: ProfileSetupModalProps) {
  const [fullName, setFullName] = useState(existingProfile?.fullName ?? '');
  const [email, setEmail] = useState(existingProfile?.email ?? '');
  const [error, setError] = useState('');

  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        ...(existingProfile as UserProfile),
        fullName: fullName.trim(),
        email: email.trim(),
        role: [],
        servicePincode: existingProfile?.servicePincode ?? '',
        serviceAreaName: existingProfile?.serviceAreaName ?? '',
        vehicleExperience: existingProfile?.vehicleExperience ?? [],
        transmissionComfort: existingProfile?.transmissionComfort ?? [],
        isAvailable: existingProfile?.isAvailable ?? false,
        totalEarnings: existingProfile?.totalEarnings ?? BigInt(0),
        languages: existingProfile?.languages ?? [],
      } as unknown as UserProfile);
      onComplete();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save profile. Please try again.');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Set Up Your Profile</DialogTitle>
          <DialogDescription>
            Please enter your name and email to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={saveProfile.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={saveProfile.isPending}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
