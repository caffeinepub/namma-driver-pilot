import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import RoleSelectionWarningModal from '../components/RoleSelectionWarningModal';
import { Button } from '@/components/ui/button';
import { Car, Users } from 'lucide-react';

export default function RoleSelectionPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!identity && !isLoading) {
      navigate({ to: '/' });
      return;
    }

    // Redirect if user already has a role
    if (userProfile && userProfile.role.role) {
      const role = userProfile.role.role;
      if (role === 'admin') {
        navigate({ to: '/admin/dashboard' });
      } else if (role === 'driver') {
        navigate({ to: '/driver/dashboard' });
      } else if (role === 'customer') {
        navigate({ to: '/customer/dashboard' });
      }
      return;
    }

    // Show modal automatically when page loads
    if (userProfile && !userProfile.role.role) {
      setShowModal(true);
    }
  }, [identity, userProfile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Choose Your Role</h1>
            <p className="text-xl text-muted-foreground">
              Select how you want to use Namma Driver Pilot
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="bg-card p-8 rounded-lg border-2 border-border hover:border-primary transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Customer</h2>
                <p className="text-muted-foreground">
                  Book rides and travel to your destination with ease
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left w-full">
                  <li>• Request rides anytime</li>
                  <li>• Track your trips</li>
                  <li>• View trip history</li>
                </ul>
              </div>
            </div>

            <div className="bg-card p-8 rounded-lg border-2 border-border hover:border-primary transition-colors">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                  <Car className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Driver</h2>
                <p className="text-muted-foreground">
                  Accept ride requests and earn by driving
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left w-full">
                  <li>• View available trips</li>
                  <li>• Accept ride requests</li>
                  <li>• Manage your trips</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <RoleSelectionWarningModal />}
    </>
  );
}
