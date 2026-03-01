import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetMyRole } from '../hooks/useQueries';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { Car, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Returns a display label for the role string.
 * role is already normalized to 'admin' | 'driver' | 'customer' | null by useGetMyRole.
 */
function getRoleLabel(role: string | null): string | null {
  if (!role) return null;
  // Capitalize first letter for display
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Navigation() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;
  const { role, isFetched: roleFetched } = useGetMyRole();
  const { isHealthy, isChecking } = useBackendHealth();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'customer') return '/customer/dashboard';
    if (role === 'driver') return '/driver/dashboard';
    return null;
  };

  const dashboardLink = getDashboardLink();
  // Only show role label when authenticated, role is fetched, and role is a non-empty string
  const roleLabel = isAuthenticated && roleFetched && role ? getRoleLabel(role) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Car className="h-5 w-5" />
          <span>Namma Driver</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* DEV-only backend status badge */}
          {import.meta.env.DEV && (
            <span
              className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
                isChecking
                  ? 'border-muted text-muted-foreground bg-muted/30'
                  : isHealthy
                  ? 'border-green-600 text-green-700 bg-green-50 dark:border-green-500 dark:text-green-400 dark:bg-green-950/30'
                  : 'border-destructive text-destructive bg-destructive/10'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isChecking
                    ? 'bg-muted-foreground'
                    : isHealthy
                    ? 'bg-green-600 dark:bg-green-400'
                    : 'bg-destructive'
                }`}
              />
              {isChecking ? 'Backend: Checking…' : isHealthy ? 'Backend: Connected' : 'Backend: Disconnected'}
            </span>
          )}

          {/* Role label badge — only shown when authenticated and role is a non-empty string */}
          {isAuthenticated && roleLabel && (
            <Badge
              variant={role === 'admin' ? 'default' : 'secondary'}
              className="hidden sm:inline-flex capitalize text-xs"
            >
              {roleLabel}
            </Badge>
          )}

          {isAuthenticated && dashboardLink && (
            role === 'admin' ? (
              <Link
                to={dashboardLink}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </Link>
            ) : (
              <Link
                to={dashboardLink}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )
          )}

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: '/login' })}>
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
