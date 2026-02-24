import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useGetCallerUserProfile';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSetupModal from './components/ProfileSetupModal';
import Layout from './components/Layout';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

// Root layout component
function RootLayout() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;

  // Show profile setup modal only when authenticated, profile is fetched, and no profile exists
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      {showProfileSetup && <ProfileSetupModal />}
    </>
  );
}

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Landing page route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// Role selection route
const roleSelectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/role-selection',
  component: RoleSelectionPage,
});

// Customer dashboard component with strict protection
function CustomerDashboardRoute() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity && !isLoading) {
      navigate({ to: '/' });
      return;
    }

    if (userProfile && !isLoading) {
      const role = userProfile.role.role;
      
      // If no role set, redirect to role selection
      if (!role) {
        navigate({ to: '/role-selection' });
        return;
      }

      // Strict role check - redirect non-customers to their correct dashboard
      if (role === 'driver') {
        navigate({ to: '/driver/dashboard' });
      } else if (role === 'admin') {
        navigate({ to: '/admin/dashboard' });
      }
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

  return <CustomerDashboard />;
}

// Customer dashboard route
const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customer/dashboard',
  component: CustomerDashboardRoute,
});

// Driver dashboard component with strict protection
function DriverDashboardRoute() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity && !isLoading) {
      navigate({ to: '/' });
      return;
    }

    if (userProfile && !isLoading) {
      const role = userProfile.role.role;
      
      // If no role set, redirect to role selection
      if (!role) {
        navigate({ to: '/role-selection' });
        return;
      }

      // Strict role check - redirect non-drivers to their correct dashboard
      if (role === 'customer') {
        navigate({ to: '/customer/dashboard' });
      } else if (role === 'admin') {
        navigate({ to: '/admin/dashboard' });
      }
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

  return <DriverDashboard />;
}

// Driver dashboard route
const driverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/driver/dashboard',
  component: DriverDashboardRoute,
});

// Admin dashboard component with strict protection
function AdminDashboardRoute() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity && !isLoading) {
      navigate({ to: '/' });
      return;
    }

    if (userProfile && !isLoading) {
      const role = userProfile.role.role;
      
      // If no role set, redirect to role selection
      if (!role) {
        navigate({ to: '/role-selection' });
        return;
      }

      // Strict role check - redirect non-admins to their correct dashboard
      if (role === 'customer') {
        navigate({ to: '/customer/dashboard' });
      } else if (role === 'driver') {
        navigate({ to: '/driver/dashboard' });
      }
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

  return <AdminDashboard />;
}

// Admin dashboard route
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: AdminDashboardRoute,
});

// Create router
const routeTree = rootRoute.addChildren([
  indexRoute,
  roleSelectionRoute,
  customerRoute,
  driverRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
