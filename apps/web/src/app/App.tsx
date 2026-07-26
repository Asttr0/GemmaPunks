import { lazy, Suspense } from "react";
import {
  Activity,
  Boxes,
  Building2,
  FilePlus2,
  Handshake,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
} from "lucide-react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppShell } from "../components/shared/AppShell";
import type { AppNavigationItem } from "../components/shared/AppShell";
import { EmptyState } from "../components/shared/EmptyState";
import { PageHeader } from "../components/shared/PageHeader";
import { PageMotion } from "../components/shared/PageMotion";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { LoginPage } from "../features/auth/LoginPage";
import { useAuth } from "../features/auth/auth-context";
import { AppProviders } from "./AppProviders";

const AgentRunPage = lazy(() =>
  import("../features/ai/AgentRunPage").then((module) => ({
    default: module.AgentRunPage,
  })),
);
const ImpactPage = lazy(() =>
  import("../features/demo/ImpactPage").then((module) => ({
    default: module.ImpactPage,
  })),
);
const GroupOrderDetailPage = lazy(() =>
  import("../features/group-orders/GroupOrderPages").then((module) => ({
    default: module.GroupOrderDetailPage,
  })),
);
const GroupOrdersListPage = lazy(() =>
  import("../features/group-orders/GroupOrderPages").then((module) => ({
    default: module.GroupOrdersListPage,
  })),
);
const EvidenceUploadPage = lazy(() =>
  import("../features/ingestion/IngestionPages").then((module) => ({
    default: module.EvidenceUploadPage,
  })),
);
const IngestionReviewPage = lazy(() =>
  import("../features/ingestion/IngestionPages").then((module) => ({
    default: module.IngestionReviewPage,
  })),
);
const InventoryPage = lazy(() =>
  import("../features/merchant/MerchantPages").then((module) => ({
    default: module.InventoryPage,
  })),
);
const MerchantDashboardPage = lazy(() =>
  import("../features/merchant/MerchantPages").then((module) => ({
    default: module.MerchantDashboardPage,
  })),
);
const TransactionsPage = lazy(() =>
  import("../features/merchant/MerchantPages").then((module) => ({
    default: module.TransactionsPage,
  })),
);
const ProcurementCockpitPage = lazy(() =>
  import("../features/procurement/ProcurementPages").then((module) => ({
    default: module.ProcurementCockpitPage,
  })),
);
const ProcurementListPage = lazy(() =>
  import("../features/procurement/ProcurementPages").then((module) => ({
    default: module.ProcurementListPage,
  })),
);
const SupplierCatalogPage = lazy(() =>
  import("../features/supplier/SupplierPages").then((module) => ({
    default: module.SupplierCatalogPage,
  })),
);
const SupplierDashboardPage = lazy(() =>
  import("../features/supplier/SupplierPages").then((module) => ({
    default: module.SupplierDashboardPage,
  })),
);
const SupplierOpportunitiesPage = lazy(() =>
  import("../features/supplier/SupplierPages").then((module) => ({
    default: module.SupplierOpportunitiesPage,
  })),
);
const SupplierOpportunityDetailPage = lazy(() =>
  import("../features/supplier/SupplierPages").then((module) => ({
    default: module.SupplierOpportunityDetailPage,
  })),
);

const merchantNavigation: AppNavigationItem[] = [
  {
    label: "Overview",
    href: "/merchant/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Add evidence",
    href: "/merchant/evidence/new",
    icon: FilePlus2,
    badge: "AI",
  },
  {
    label: "Inventory",
    href: "/merchant/inventory",
    icon: Boxes,
    badge: "1",
  },
  {
    label: "Procurement",
    href: "/merchant/procurement",
    icon: PackageSearch,
  },
  {
    label: "Group orders",
    href: "/merchant/group-orders",
    icon: Handshake,
  },
  {
    label: "Transactions",
    href: "/merchant/transactions",
    icon: ReceiptText,
  },
  {
    label: "Agent activity",
    href: "/agent-runs/run-demo-001",
    icon: Activity,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const supplierNavigation: AppNavigationItem[] = [
  {
    label: "Overview",
    href: "/supplier/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Opportunities",
    href: "/supplier/opportunities",
    icon: ShoppingCart,
    badge: "2",
  },
  {
    label: "Catalog",
    href: "/supplier/catalog",
    icon: Boxes,
  },
  {
    label: "Agent activity",
    href: "/agent-runs/run-demo-001",
    icon: Activity,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function RoleRedirect() {
  const { user, orgType, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return (
    <Navigate
      replace
      to={
        orgType === "SUPPLIER" ? "/supplier/dashboard" : "/merchant/dashboard"
      }
    />
  );
}

function LoginRoute({ mode = "sign-in" }: { mode?: "sign-in" | "sign-up" }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate replace to="/app" />;
  }

  return (
    <LoginPage initialMode={mode} onAuthenticated={() => navigate("/app")} />
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div role="status" className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-r-primary motion-reduce:animate-none"
        />
        <p className="mt-4 font-semibold text-foreground">Opening MIZAN Souq</p>
        <p className="mt-1 text-sm text-foreground-muted">
          Restoring your secure Firebase session…
        </p>
      </div>
    </main>
  );
}

function ApplicationLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, organizationId, role, orgType, loading, signOut } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const supplierRoute = location.pathname.startsWith("/supplier");
  const portal = supplierRoute
    ? "supplier"
    : location.pathname.startsWith("/merchant")
      ? "merchant"
      : orgType === "SUPPLIER"
        ? "supplier"
        : "merchant";
  const navigation =
    portal === "supplier" ? supplierNavigation : merchantNavigation;
  const fallbackOrganization =
    portal === "supplier" ? "Atlas Distribution" : "Grocery Store Berrechid";

  return (
    <AppShell
      navigation={navigation}
      activePath={location.pathname}
      portal={portal}
      organizationName={
        user ? organizationId || fallbackOrganization : fallbackOrganization
      }
      role={user ? role : "DEMO PREVIEW"}
      userName={user?.displayName || user?.email}
      onNavigate={navigate}
      onSignOut={
        user
          ? async () => {
              await signOut();
              navigate("/login");
            }
          : undefined
      }
    >
      <Outlet />
    </AppShell>
  );
}

function SettingsPage() {
  const { user, organizationId, orgType, role } = useAuth();
  return (
    <PageMotion>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Account and business context used by the MIZAN demo."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-foreground-muted">Name</dt>
                <dd className="mt-1 font-semibold">
                  {user?.displayName ?? "Demo preview user"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-muted">Email</dt>
                <dd className="mt-1 font-semibold">
                  {user?.email ?? "Not authenticated"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-muted">Role</dt>
                <dd className="mt-1 font-semibold">{role}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Business organization</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-foreground-muted">Organization ID</dt>
                <dd className="mt-1 font-semibold">
                  {organizationId || "Synthetic preview organization"}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-muted">Portal type</dt>
                <dd className="mt-1 flex items-center gap-2 font-semibold">
                  {orgType === "SUPPLIER" ? (
                    <Building2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Store className="h-4 w-4 text-primary" />
                  )}
                  {orgType}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-muted">Demo language</dt>
                <dd className="mt-1 font-semibold">
                  English · Darija evidence supported
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </PageMotion>
  );
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      title="This interface does not exist"
      description="The link may be outdated or the page is outside the hackathon MVP."
      action={
        <Button onClick={() => navigate("/app")}>
          Return to your dashboard
        </Button>
      }
    />
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<LoginRoute mode="sign-up" />} />
        <Route path="/app" element={<RoleRedirect />} />
        <Route element={<ApplicationLayout />}>
          <Route
            path="/merchant/dashboard"
            element={<MerchantDashboardPage />}
          />
          <Route
            path="/merchant/evidence/new"
            element={<EvidenceUploadPage />}
          />
          <Route
            path="/merchant/ingestions/:ingestionId"
            element={<IngestionReviewPage />}
          />
          <Route path="/merchant/transactions" element={<TransactionsPage />} />
          <Route path="/merchant/inventory" element={<InventoryPage />} />
          <Route
            path="/merchant/procurement"
            element={<ProcurementListPage />}
          />
          <Route
            path="/merchant/procurement/:needId"
            element={<ProcurementCockpitPage />}
          />
          <Route
            path="/merchant/group-orders"
            element={<GroupOrdersListPage />}
          />
          <Route
            path="/merchant/group-orders/:groupOrderId"
            element={<GroupOrderDetailPage />}
          />
          <Route
            path="/supplier/dashboard"
            element={<SupplierDashboardPage />}
          />
          <Route
            path="/supplier/opportunities"
            element={<SupplierOpportunitiesPage />}
          />
          <Route
            path="/supplier/opportunities/:opportunityId"
            element={<SupplierOpportunityDetailPage />}
          />
          <Route path="/supplier/catalog" element={<SupplierCatalogPage />} />
          <Route path="/agent-runs/:agentRunId" element={<AgentRunPage />} />
          <Route path="/demo/impact" element={<ImpactPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/" element={<Navigate replace to="/app" />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
