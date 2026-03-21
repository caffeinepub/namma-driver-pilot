import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import React from "react";
import { Toaster } from "./components/ui/sonner";

import { ErrorBoundary } from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUpgradePage from "./pages/AdminUpgradePage";
import CustomerDashboard from "./pages/CustomerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotAuthorizedPage from "./pages/NotAuthorizedPage";
import PostLoginLandingPage from "./pages/PostLoginLandingPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import SelectRolePage from "./pages/SelectRolePage";

import CustomerOnboarding from "./components/CustomerOnboarding";
import DriverOnboarding from "./components/DriverOnboarding";

import Navigation from "./components/Navigation";
import RoleGuard from "./components/RoleGuard";
import { useBackendHealth } from "./hooks/useBackendHealth";

// ─── Root Layout ──────────────────────────────────────────────────────────────

function AppShell() {
  const { isHealthy, isChecking, recheck } = useBackendHealth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {isChecking && <OfflineBanner isColdStart={true} />}
      {!isChecking && !isHealthy && (
        <OfflineBanner isColdStart={false} onRecheck={recheck} />
      )}
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// ─── Onboarding Route Components ───────────────────────────────────────────────

function DriverOnboardingRoute() {
  const navigate = useNavigate();
  return (
    <DriverOnboarding
      mode="onboarding"
      onComplete={() => navigate({ to: "/driver/dashboard" })}
      onCancel={() => navigate({ to: "/driver/dashboard" })}
    />
  );
}

function CustomerOnboardingRoute() {
  const navigate = useNavigate();
  return (
    <CustomerOnboarding
      mode="onboarding"
      onComplete={() => navigate({ to: "/customer/dashboard" })}
      onCancel={() => navigate({ to: "/customer/dashboard" })}
    />
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const postLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post-login",
  component: PostLoginLandingPage,
});

const selectRoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/select-role",
  component: SelectRolePage,
});

const roleSelectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/role-selection",
  component: RoleSelectionPage,
});

const driverOnboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/onboarding",
  component: DriverOnboardingRoute,
});

const customerOnboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer/onboarding",
  component: CustomerOnboardingRoute,
});

const customerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer/dashboard",
  component: () => (
    <RoleGuard allowedRole="customer">
      <CustomerDashboard />
    </RoleGuard>
  ),
});

const driverDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/dashboard",
  component: () => (
    <RoleGuard allowedRole="driver">
      <DriverDashboard />
    </RoleGuard>
  ),
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: () => (
    <RoleGuard allowedRole="admin">
      <AdminDashboard />
    </RoleGuard>
  ),
});

const adminUpgradeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/upgrade",
  component: AdminUpgradePage,
});

const notAuthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/not-authorized",
  component: NotAuthorizedPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  postLoginRoute,
  selectRoleRoute,
  roleSelectionRoute,
  driverOnboardingRoute,
  customerOnboardingRoute,
  customerDashboardRoute,
  driverDashboardRoute,
  adminDashboardRoute,
  adminUpgradeRoute,
  notAuthorizedRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
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
