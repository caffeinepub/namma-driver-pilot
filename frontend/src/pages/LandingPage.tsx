import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useCheckIsAdmin } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { getRoleString } from '../lib/types';

/**
 * LandingPage at "/" acts purely as a router:
 * - Not authenticated → /login
 * - Authenticated, admin → /admin/dashboard
 * - Authenticated, role set → correct dashboard
 * - Authenticated, no role → /select-role
 * - Authenticated, no profile → /post-login
 */
export default function LandingPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isFetched: profileFetched } = useGetCallerUserProfile();
  const { isAdmin, isFetched: adminFetched } = useCheckIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    // Not authenticated → go to login
    if (!identity) {
      navigate({ to: '/login' });
      return;
    }

    // Admin check: if confirmed admin, go to admin dashboard
    if (adminFetched && isAdmin) {
      navigate({ to: '/admin/dashboard' });
      return;
    }

    // Wait for profile to be fetched
    if (!profileFetched) return;

    // No profile yet — go to post-login landing
    if (!userProfile) {
      if (adminFetched && !isAdmin) {
        navigate({ to: '/post-login' });
      }
      return;
    }

    const role = getRoleString(userProfile.role);

    // No role set yet — go to role selection
    if (role == null) {
      if (adminFetched && !isAdmin) {
        navigate({ to: '/select-role' });
      }
      return;
    }

    // Route to the appropriate dashboard
    if (role === 'admin') {
      navigate({ to: '/admin/dashboard' });
    } else if (role === 'driver') {
      navigate({ to: '/driver/dashboard' });
    } else if (role === 'customer') {
      navigate({ to: '/customer/dashboard' });
    }
  }, [identity, userProfile, profileFetched, isAdmin, adminFetched, navigate]);

  // Render a neutral loading screen while routing
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Redirecting…</p>
      </div>
    </div>
  );
}
