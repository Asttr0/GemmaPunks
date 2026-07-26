import { lazy, Suspense } from "react";
import {
  Activity,
  Database,
  FilePlus2,
  Landmark,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UsersRound,
  WalletCards,
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
  import("../features/control-tower/ControlTowerPages").then((module) => ({
    default: module.ControlTowerImpactPage,
  })),
);
const ControlTowerDashboardPage = lazy(() =>
  import("../features/control-tower/ControlTowerPages").then((module) => ({
    default: module.ControlTowerDashboardPage,
  })),
);
const AuditCenterPage = lazy(() =>
  import("../features/control-tower/ControlTowerPages").then((module) => ({
    default: module.AuditCenterPage,
  })),
);
const AuditFindingDetailPage = lazy(() =>
  import("../features/control-tower/ControlTowerPages").then((module) => ({
    default: module.AuditFindingDetailPage,
  })),
);
const CashFlowPage = lazy(() =>
  import("../features/control-tower/ControlTowerPages").then((module) => ({
    default: module.CashFlowPage,
  })),
);
const SupplierIntelligencePage = lazy(() =>
  import("../features/control-tower/ControlTowerPages").then((module) => ({
    default: module.SupplierIntelligencePage,
  })),
);
const FinancialRecordsPage = lazy(() =>
  import("../features/control-tower/ControlTowerPages").then((module) => ({
    default: module.FinancialRecordsPage,
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
const companyNavigation: AppNavigationItem[] = [
  {
    label: "Control tower",
    href: "/control-tower/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Financial evidence",
    href: "/control-tower/evidence/new",
    icon: FilePlus2,
    badge: "AI",
  },
  {
    label: "Audit center",
    href: "/control-tower/audit",
    icon: ShieldCheck,
    badge: "3",
  },
  {
    label: "Cash-flow forecast",
    href: "/control-tower/cash-flow",
    icon: WalletCards,
  },
  {
    label: "Supplier intelligence",
    href: "/control-tower/suppliers",
    icon: UsersRound,
  },
  {
    label: "Connected records",
    href: "/control-tower/records",
    icon: Database,
  },
  {
    label: "Demo impact",
    href: "/demo/impact",
    icon: Activity,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to="/control-tower/overview" />;
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
        <p className="mt-4 font-semibold text-foreground">
          Opening MIZAN Control
        </p>
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
  const { user, organizationId, role, loading, signOut } = useAuth();
  const previewMode =
    new URLSearchParams(location.search).get("preview") === "1";

  if (loading && !previewMode) {
    return <LoadingScreen />;
  }

  const fallbackOrganization = "Atlas Distribution Maroc";
  const organizationName =
    organizationId === "merchant-berrechid"
      ? "Atlas Distribution Maroc"
      : organizationId || fallbackOrganization;

  return (
    <AppShell
      navigation={companyNavigation}
      activePath={location.pathname}
      organizationName={user ? organizationName : fallbackOrganization}
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
  const { user, organizationId, role } = useAuth();
  return (
    <PageMotion>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your finance workspace."
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
                <dt className="text-foreground-muted">Workspace</dt>
                <dd className="mt-1 flex items-center gap-2 font-semibold">
                  <Landmark className="h-4 w-4 text-primary" />
                  Finance team
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
            path="/control-tower/overview"
            element={<ControlTowerDashboardPage />}
          />
          <Route
            path="/control-tower/evidence/new"
            element={<EvidenceUploadPage />}
          />
          <Route
            path="/control-tower/ingestions/:ingestionId"
            element={<IngestionReviewPage />}
          />
          <Route path="/control-tower/audit" element={<AuditCenterPage />} />
          <Route
            path="/control-tower/audit/:findingId"
            element={<AuditFindingDetailPage />}
          />
          <Route path="/control-tower/cash-flow" element={<CashFlowPage />} />
          <Route
            path="/control-tower/suppliers"
            element={<SupplierIntelligencePage />}
          />
          <Route
            path="/control-tower/records"
            element={<FinancialRecordsPage />}
          />
          <Route
            path="/merchant/*"
            element={<Navigate replace to="/control-tower/overview" />}
          />
          <Route
            path="/supplier/*"
            element={<Navigate replace to="/control-tower/overview" />}
          />
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
