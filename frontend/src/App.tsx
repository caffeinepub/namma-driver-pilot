import React, { useState } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';

import OfflineBanner from './components/OfflineBanner';
import ProfileSetupModal from './components/ProfileSetupModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PostLoginLandingPage from './pages/PostLoginLandingPage';
import SelectRolePage from './pages/SelectRolePage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotAuthorizedPage from './pages/NotAuthorizedPage';
import AdminUpgradePage from './pages/AdminUpgradePage';

import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useGetCallerUserProfile';
import { useGetMyRole } from './hooks/useQueries';
import { useBackendHealth } from './hooks/useBackendHealth';
import { Role } from './backend';
import Navigation from './components/Navigation';
import RoleGuard from './components/RoleGuard';

// ─── Root Layout ──────────────────────────────────────────────────────────────

function AppShell() {
  const { identity } = useInternetIdentity();
  const { isHealthy, isChecking } = useBackendHealth();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: myRole } = useGetMyRole();
  const [profileSetupDone, setProfileSetupDone] = useState(false);

  const isAuthenticated = !!identity;

  // Only show profile setup modal when:
  // 1. User is authenticated
  // 2. Profile has been fetched and is null (no profile yet)
  // 3. User has an assigned role (not unassigned)
  // 4. Not already done
  const hasAssignedRole =
    myRole === Role.customer || myRole === Role.driver || myRole === Role.admin;

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null &&
    hasAssignedRole &&
    !profileSetupDone;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isChecking && !isHealthy && <OfflineBanner />}
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onClose={() => setProfileSetupDone(true)}
        />
      )}
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

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

const roleSelectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/role-selection',
  component: RoleSelectionPage,
});

const customerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customer/dashboard',
  component: () => (
    <RoleGuard allowedRole="customer">
      <CustomerDashboard />
    </RoleGuard>
  ),
});

const driverDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/driver/dashboard',
  component: () => (
    <RoleGuard allowedRole="driver">
      <DriverDashboard />
    </RoleGuard>
  ),
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: () => (
    <RoleGuard allowedRole="admin">
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
  roleSelectionRoute,
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

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
