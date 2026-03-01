import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useGetCallerUserProfile';
import { useBackendHealth } from './hooks/useBackendHealth';
import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PostLoginLandingPage from './pages/PostLoginLandingPage';
import SelectRolePage from './pages/SelectRolePage';
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUpgradePage from './pages/AdminUpgradePage';
import NotAuthorizedPage from './pages/NotAuthorizedPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import Layout from './components/Layout';
import OfflineBanner from './components/OfflineBanner';
import AuthGate from './components/AuthGate';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

// ─── Root layout (shared header/footer for all routes) ───────────────────────
function RootLayout() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { isHealthy, isChecking: healthChecking } = useBackendHealth();
  const isAuthenticated = !!identity;
  const [profileSetupDone, setProfileSetupDone] = useState(false);

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null && !profileSetupDone;

  return (
    <>
      {!healthChecking && !isHealthy && <OfflineBanner />}
      <Layout>
        <Outlet />
      </Layout>
      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onComplete={() => setProfileSetupDone(true)}
        />
      )}
    </>
  );
}

// ─── Root route ───────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: RootLayout });

// ─── Public routes (no auth required) ────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// ─── Protected routes ─────────────────────────────────────────────────────────

// /post-login — role detection and redirect
function PostLoginRoute() {
  return (
    <AuthGate>
      <ProtectedRoute>
        <PostLoginLandingPage />
      </ProtectedRoute>
    </AuthGate>
  );
}

const postLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/post-login',
  component: PostLoginRoute,
});

// /select-role — any authenticated user can access this
function SelectRoleRoute() {
  return (
    <AuthGate>
      <ProtectedRoute>
        <SelectRolePage />
      </ProtectedRoute>
    </AuthGate>
  );
}

const selectRoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/select-role',
  component: SelectRoleRoute,
});

// /customer/dashboard — requires customer role
function CustomerDashboardRoute() {
  return (
    <AuthGate>
      <ProtectedRoute>
        <RoleGuard requiredRole="customer">
          <CustomerDashboard />
        </RoleGuard>
      </ProtectedRoute>
    </AuthGate>
  );
}

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customer/dashboard',
  component: CustomerDashboardRoute,
});

// /driver/dashboard — requires driver role
function DriverDashboardRoute() {
  return (
    <AuthGate>
      <ProtectedRoute>
        <RoleGuard requiredRole="driver">
          <DriverDashboard />
        </RoleGuard>
      </ProtectedRoute>
    </AuthGate>
  );
}

const driverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/driver/dashboard',
  component: DriverDashboardRoute,
});

// /admin/dashboard — requires admin role; shows NotAuthorized for non-admins
function AdminDashboardRoute() {
  return (
    <AuthGate>
      <ProtectedRoute>
        <RoleGuard requiredRole="admin" showNotAuthorized={true}>
          <AdminDashboard />
        </RoleGuard>
      </ProtectedRoute>
    </AuthGate>
  );
}

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: AdminDashboardRoute,
});

// /admin/upgrade — requires admin role; shows NotAuthorized for non-admins
function AdminUpgradeRoute() {
  return (
    <AuthGate>
      <ProtectedRoute>
        <RoleGuard requiredRole="admin" showNotAuthorized={true}>
          <AdminUpgradePage />
        </RoleGuard>
      </ProtectedRoute>
    </AuthGate>
  );
}

const adminUpgradeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/upgrade',
  component: AdminUpgradeRoute,
});

// /not-authorized — standalone page
const notAuthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/not-authorized',
  component: NotAuthorizedPage,
});

// ─── Router ───────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  postLoginRoute,
  selectRoleRoute,
  customerRoute,
  driverRoute,
  adminRoute,
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
