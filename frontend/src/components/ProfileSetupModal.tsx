import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActor } from '../hooks/useActor';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useGetMyRole } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Role, UserProfile } from '../backend';

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Safely extract a role string from any role value (enum string, Candid variant
 * object, null, undefined) and convert it to the Candid variant object the ICP
 * SDK expects (e.g. { customer: null }).
 *
 * This prevents the "Cannot use 'in' operator to search for 'local' in <string>"
 * crash that occurs when the SDK tries to encode a plain enum string as a variant.
 */
function roleToVariant(role: unknown): Record<string, null> {
  let normalized = 'unassigned';

  if (typeof role === 'string') {
    normalized = role.replace(/^#/, '');
  } else if (typeof role === 'object' && role !== null && !Array.isArray(role)) {
    const keys = Object.keys(role as object);
    if (keys.length > 0) {
      normalized = keys[0].replace(/^#/, '');
    }
  }

  switch (normalized) {
    case 'customer': return { customer: null };
    case 'driver': return { driver: null };
    case 'admin': return { admin: null };
    default: return { unassigned: null };
  }
}

export default function ProfileSetupModal({ open, onClose }: ProfileSetupModalProps) {
  const { actor } = useActor();
  const { data: existing, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: myRole } = useGetMyRole();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setFullName(existing.fullName ?? '');
      setEmail(existing.email ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }

    setSaving(true);
    setError(null);

    try {
      // Prefer the role already stored on the existing profile; fall back to
      // the role returned by getMyRole. Both may be enum strings or variant
      // objects depending on the SDK version — roleToVariant handles all cases.
      const rawRole: unknown =
        (existing?.role !== undefined && existing.role !== null)
          ? existing.role
          : myRole ?? Role.unassigned;

      // Convert to Candid variant object so the ICP SDK can encode it correctly.
      const roleVariant = roleToVariant(rawRole);

      const profile: UserProfile = {
        principalId: existing?.principalId ?? (actor as any).identity?.getPrincipal(),
        fullName: fullName.trim(),
        email: email.trim(),
        // Cast through unknown: TypeScript sees Role enum, but at runtime the
        // SDK needs the variant object to avoid the 'in' operator crash.
        role: roleVariant as unknown as Role,
        createdTime: existing?.createdTime ?? BigInt(Date.now()) * BigInt(1_000_000),
        servicePincode: existing?.servicePincode ?? '000000',
        serviceAreaName: existing?.serviceAreaName ?? 'Unknown',
        vehicleExperience: existing?.vehicleExperience ?? [],
        transmissionComfort: existing?.transmissionComfort ?? [],
        isAvailable: existing?.isAvailable ?? false,
        totalEarnings: existing?.totalEarnings ?? BigInt(0),
        languages: existing?.languages ?? undefined,
      };

      await actor.saveCallerUserProfile(profile);
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['myRole'] });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Your Profile</DialogTitle>
          <DialogDescription>
            Please provide your details to complete your profile setup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              disabled={saving}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={saving}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
