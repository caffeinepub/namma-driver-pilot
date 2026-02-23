import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Users, Shield } from 'lucide-react';

export default function LandingPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity && userProfile && !isLoading) {
      const role = userProfile.role.role;
      
      // If no role set, redirect to role selection
      if (!role) {
        navigate({ to: '/role-selection' });
        return;
      }

      // Redirect to appropriate dashboard based on role
      if (role === 'admin') {
        navigate({ to: '/admin/dashboard' });
      } else if (role === 'driver') {
        navigate({ to: '/driver/dashboard' });
      } else if (role === 'customer') {
        navigate({ to: '/customer/dashboard' });
      }
    }
  }, [identity, userProfile, isLoading, navigate]);

  const handleLogin = () => {
    try {
      login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Car className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Namma Driver Pilot
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted ride-booking platform connecting customers with reliable drivers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full sm:w-auto min-w-[200px] h-12 text-lg"
            >
              {isLoggingIn ? 'Connecting...' : 'Get Started'}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
              <p className="text-muted-foreground">
                Request rides with just a few taps. Enter your pickup and dropoff locations and you're good to go.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reliable Drivers</h3>
              <p className="text-muted-foreground">
                Connect with verified drivers who are ready to take you to your destination safely and efficiently.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-muted-foreground">
                Built on the Internet Computer with decentralized authentication for maximum security and privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to ride?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of satisfied customers and drivers on our platform
          </p>
          <Button
            size="lg"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="min-w-[200px] h-12 text-lg"
          >
            {isLoggingIn ? 'Connecting...' : 'Sign Up Now'}
          </Button>
        </div>
      </section>
    </div>
  );
}
