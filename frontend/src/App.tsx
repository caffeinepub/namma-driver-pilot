import { useState } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useBackendHealth } from './hooks/useBackendHealth';
import OfflineBanner from './components/OfflineBanner';
import Navigation from './components/Navigation';
import ProfileSetupModal from './components/ProfileSetupModal';
import { useGetCallerUserProfile } from './hooks/useGetCallerUserProfile';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PostLoginLandingPage from './pages/PostLoginLandingPage';
import SelectRolePage from './pages/SelectRolePage';
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUpgradePage from './pages/AdminUpgradePage';
import NotAuthorizedPage from './pages/NotAuthorizedPage';
import RoleGuard from './components/RoleGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

function AppShell() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { isHealthy, isChecking } = useBackendHealth();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const [profileSetupDone, setProfileSetupDone] = useState(false);

  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && userProfile === null && !profileSetupDone;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isChecking && !isHealthy && <OfflineBanner />}
      <Navigation />
      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onComplete={() => setProfileSetupDone(true)}
        />
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const postLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/post-login',
  component: PostLoginLandingPage,
});

const selectRoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/select-role',
  component: SelectRolePage,
});

const customerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customer/dashboard',
  component: () => (
    <RoleGuard requiredRole="customer">
      <CustomerDashboard />
    </RoleGuard>
  ),
});

const driverDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/driver/dashboard',
  component: () => (
    <RoleGuard requiredRole="driver">
      <DriverDashboard />
    </RoleGuard>
  ),
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: () => (
    <RoleGuard requiredRole="admin" showNotAuthorized>
      <AdminDashboard />
    </RoleGuard>
  ),
});

const adminUpgradeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/upgrade',
  component: AdminUpgradePage,
});

const notAuthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/not-authorized',
  component: NotAuthorizedPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  postLoginRoute,
  selectRoleRoute,
  customerDashboardRoute,
  driverDashboardRoute,
  adminDashboardRoute,
  adminUpgradeRoute,
  notAuthorizedRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
