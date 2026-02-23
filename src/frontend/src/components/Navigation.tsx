import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Car, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navigation() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const handleNavigateToDashboard = () => {
    if (userProfile && userProfile.role.role) {
      if (userProfile.role.role === 'admin') {
        navigate({ to: '/admin/dashboard' });
      } else if (userProfile.role.role === 'driver') {
        navigate({ to: '/driver/dashboard' });
      } else {
        navigate({ to: '/customer/dashboard' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate({ to: '/' })}>
          <Car className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Namma Driver Pilot</span>
        </div>

        {isAuthenticated && userProfile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{userProfile.fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userProfile.fullName}</p>
                  <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                  {userProfile.role.role && (
                    <p className="text-xs text-muted-foreground capitalize">
                      Role: {userProfile.role.role}
                      {userProfile.role.isLocked && ' 🔒'}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNavigateToDashboard}>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="text-sm text-muted-foreground">
            {loginStatus === 'logging-in' ? 'Connecting...' : ''}
          </div>
        )}
      </div>
    </header>
  );
}
