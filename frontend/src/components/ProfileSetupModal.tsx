import { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfileInput } from '../backend';
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
import { toast } from 'sonner';
import { withTimeout } from '../utils/withTimeout';

const PROFILE_TIMEOUT_MS = 30_000;

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
  existingProfile?: { fullName?: string; email?: string } | null;
}

export default function ProfileSetupModal({ open, onComplete, existingProfile }: ProfileSetupModalProps) {
  const [fullName, setFullName] = useState(existingProfile?.fullName ?? '');
  const [email, setEmail] = useState(existingProfile?.email ?? '');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const { actor } = useActor();
  const queryClient = useQueryClient();

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

    setIsPending(true);
    try {
      if (!actor) throw new Error('Actor not available');

      // Use setProfile which ONLY takes fullName + email — never sends role
      const profileInput: ProfileInput = {
        fullName: fullName.trim(),
        email: email.trim(),
      };

      await withTimeout(actor.setProfile(profileInput), PROFILE_TIMEOUT_MS);
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      onComplete();
    } catch (err: unknown) {
      console.error('[ProfileSetupModal] setProfile failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setError(message);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsPending(false);
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
              disabled={isPending}
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
              disabled={isPending}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
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
