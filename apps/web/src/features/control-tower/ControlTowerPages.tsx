import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FileSearch,
  Landmark,
  PackageCheck,
  Play,
  ReceiptText,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "../../components/shared/EmptyState";
import { MetricCard } from "../../components/shared/MetricCard";
import { Money } from "../../components/shared/Money";
import { PageHeader } from "../../components/shared/PageHeader";
import {
  PageMotion,
  StaggerGrid,
  StaggerItem,
} from "../../components/shared/PageMotion";
import { PreviewNotice } from "../../components/shared/PreviewNotice";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Badge, type BadgeVariant } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  decideAuditFinding,
  getAuditFinding,
  getAuditFindings,
  getControlTowerDashboard,
  getFinancialRecords,
  getSupplierPortfolio,
  runControlAudit,
} from "../../lib/api";
import { formatDate, formatMAD, titleCase } from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";
import { useAuth } from "../auth/auth-context";
import {
  demoAuditRun,
  demoControlTowerDashboard,
  demoFinancialRecords,
  demoSupplierPortfolio,
  primaryFinding,
} from "./demo-control-tower";
import type {
  AuditFinding,
  AuditRunResponse,
  FindingSeverity,
  FindingStatus,
} from "./types";

const severityVariant: Record<FindingSeverity, BadgeVariant> = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
};

const statusTone: Record<
  FindingStatus,
  "pending" | "draft" | "confirmed" | "neutral"
> = {
  OPEN: "pending",
  READY_FOR_APPROVAL: "draft",
  APPROVED: "confirmed",
  RESOLVED: "neutral",
};

function QueryError({ title, retry }: { title: string; retry: () => void }) {
  return (
    <EmptyState
      title={title}
      description="The control-tower API did not return this information. Check the local API and try again."
      icon={<AlertTriangle className="h-6 w-6" />}
      action={<Button onClick={retry}>Try again</Button>}
    />
  );
}

function FindingBadges({ finding }: { finding: AuditFinding }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={severityVariant[finding.severity]}>
        <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" />
        {finding.severity}
      </Badge>
      <StatusBadge
        label={titleCase(finding.status)}
        tone={statusTone[finding.status]}
      />
      <Badge variant="ai">
        <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
        {Math.round(finding.confidence * 100)}% confidence
      </Badge>
    </div>
  );
}

function FindingsTable({
  findings,
  onOpen,
}: {
  findings: AuditFinding[];
  onOpen: (findingId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-foreground-muted">
            <th scope="col" className="px-5 py-3 font-semibold">
              Finding
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Supplier
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Severity
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              Financial impact
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Owner
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr
              key={finding.finding_id}
              className="border-b border-border last:border-0 hover:bg-surface-subtle/70"
            >
              <td className="px-5 py-4">
                <p className="font-semibold text-foreground">{finding.title}</p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-foreground-muted">
                  {titleCase(finding.finding_type)} · due{" "}
                  {formatDate(finding.due_date)}
                </p>
              </td>
              <td className="px-5 py-4 text-foreground-muted">
                {finding.supplier_name}
              </td>
              <td className="px-5 py-4">
                <Badge variant={severityVariant[finding.severity]}>
                  {finding.severity}
                </Badge>
              </td>
              <td className="px-5 py-4 text-right font-semibold text-foreground tabular-nums">
                <Money centimes={finding.financial_impact_centimes} />
              </td>
              <td className="px-5 py-4 text-foreground-muted">
                {finding.owner.split(" · ")[0]}
              </td>
              <td className="px-5 py-4 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpen(finding.finding_id)}
                >
                  Investigate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ControlTowerDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idToken } = useAuth();
  const confirmedReference = (
    location.state as { confirmedReference?: string } | null
  )?.confirmedReference;
  const dashboard = usePreviewQuery(
    ["control-tower", "dashboard"],
    idToken,
    getControlTowerDashboard,
    demoControlTowerDashboard,
  );

  if (dashboard.isError) {
    return (
      <QueryError
        title="The financial control tower is unavailable"
        retry={() => void dashboard.refetch()}
      />
    );
  }

  const data = dashboard.data ?? demoControlTowerDashboard;
  const cashChart = data.cash_forecast.map((point) => ({
    label: point.label,
    balance: point.projected_balance_centimes / 100,
    inflows: point.inflows_centimes / 100,
    outflows: point.outflows_centimes / 100,
  }));

  return (
    <PageMotion>
      <PageHeader
        eyebrow="July close"
        title="Good morning, Nadia"
        description="One critical payment needs your approval."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/control-tower/evidence/new")}
            >
              <FileSearch className="h-4 w-4" />
              Add financial evidence
            </Button>
            <Button onClick={() => navigate("/control-tower/audit")}>
              <ShieldAlert className="h-4 w-4" />
              Review critical finding
            </Button>
          </div>
        }
      />

      <PreviewNotice live={Boolean(idToken)} />

      {confirmedReference ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-control border border-emerald-200 bg-success-subtle px-4 py-3 text-sm font-semibold text-success"
        >
          <CheckCircle2 className="h-4 w-4" />
          {confirmedReference} added · controls refreshed
        </div>
      ) : null}

      <div className="grid gap-4 rounded-card border border-brand-200 bg-gradient-to-r from-brand-950 to-brand-800 p-5 text-white shadow-card lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-white/10 text-brand-100">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">Decision brief</p>
              <Badge className="border-white/20 bg-white/10 text-white">
                Gemma + deterministic controls
              </Badge>
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-brand-100">
              Hold INV-8821. The invoice exceeds the supported amount by 6,100
              MAD.
            </p>
          </div>
        </div>
        <Button
          className="border-white/20 bg-white text-brand-950 hover:bg-brand-100"
          onClick={() => navigate("/control-tower/audit/finding-inv-8821")}
        >
          Open evidence chain
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <StaggerGrid className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <MetricCard
            label="Spend monitored"
            value={<Money centimes={data.kpis.monitored_spend_centimes} />}
            description="This month"
            icon={<Scale className="h-5 w-5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Preventable leakage"
            value={<Money centimes={data.kpis.preventable_leakage_centimes} />}
            description={`${data.kpis.open_findings} open findings`}
            icon={<ShieldAlert className="h-5 w-5" />}
            tone="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Cash at risk"
            value={<Money centimes={data.kpis.cash_at_risk_centimes} />}
            description="Next 30 days"
            icon={<WalletCards className="h-5 w-5" />}
            tone="ai"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Inventory value"
            value={<Money centimes={data.kpis.inventory_value_centimes} />}
            description="3 warehouses"
            icon={<PackageCheck className="h-5 w-5" />}
            tone="positive"
          />
        </StaggerItem>
      </StaggerGrid>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>30-day liquidity outlook</CardTitle>
                <CardDescription>
                  Confirmed payables, expected collections and approved purchase
                  commitments.
                </CardDescription>
              </div>
              <Badge variant="warning">
                <TrendingDown className="h-3.5 w-3.5" />
                Lowest point · 118,000 MAD
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="h-72"
              role="img"
              aria-label="Projected cash balance declines from 315,000 MAD today to 118,000 MAD on 16 August, then recovers to 183,000 MAD."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashChart}>
                  <defs>
                    <linearGradient
                      id="cashBalance"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#00b4d8"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#00b4d8"
                        stopOpacity={0.03}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8e1ea" />
                  <XAxis dataKey="label" stroke="#607087" fontSize={12} />
                  <YAxis
                    stroke="#607087"
                    fontSize={12}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value) =>
                      formatMAD(Math.round(Number(value) * 100))
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Projected balance"
                    stroke="#0077b6"
                    strokeWidth={3}
                    fill="url(#cashBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Main pressure
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Supplier settlements
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Recovery
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Marjane receivable · 156,000 MAD
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Confidence
                </p>
                <p className="mt-1 text-sm font-semibold">High · 92%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next approved actions</CardTitle>
            <CardDescription>
              Ranked by financial impact, urgency and operational dependency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.priority_actions.map((action, index) => (
              <button
                type="button"
                key={action.action_id}
                onClick={() => navigate(action.target_path)}
                className="group flex w-full cursor-pointer gap-3 rounded-control border border-border p-4 text-left outline-none transition-colors hover:border-brand-200 hover:bg-primary-subtle focus-visible:ring-2 focus-visible:ring-focus"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-950 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {action.title}
                    </span>
                    <Badge
                      variant={
                        action.urgency === "NOW"
                          ? "danger"
                          : action.urgency === "THIS_WEEK"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {titleCase(action.urgency)}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-foreground-muted">
                    {action.description}
                  </span>
                  <span className="mt-2 block text-xs font-semibold text-primary">
                    Impact · <Money centimes={action.impact_centimes} />
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Financial-control findings</CardTitle>
              <CardDescription>
                Exceptions created from linked accounting and operational
                evidence.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/control-tower/audit")}
            >
              Open audit center
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          <FindingsTable
            findings={data.findings}
            onOpen={(findingId) =>
              navigate(`/control-tower/audit/${findingId}`)
            }
          />
        </CardContent>
      </Card>
    </PageMotion>
  );
}

export function AuditCenterPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const [runResult, setRunResult] = useState<AuditRunResponse | null>(null);
  const findings = usePreviewQuery(
    ["control-tower", "audit-findings"],
    idToken,
    getAuditFindings,
    demoControlTowerDashboard.findings,
  );
  const auditMutation = useMutation({
    mutationFn: async () => (idToken ? runControlAudit(idToken) : demoAuditRun),
    onSuccess: setRunResult,
  });

  if (findings.isError) {
    return (
      <QueryError
        title="Audit findings are unavailable"
        retry={() => void findings.refetch()}
      />
    );
  }

  const items = findings.data ?? demoControlTowerDashboard.findings;

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Financial controls"
        title="Audit center"
        description="Review exceptions before money leaves the company."
        actions={
          <Button
            variant="ai"
            loading={auditMutation.isPending}
            onClick={() => auditMutation.mutate()}
          >
            <Play className="h-4 w-4" />
            Run control audit
          </Button>
        }
      />
      <PreviewNotice live={Boolean(idToken)} />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Records monitored"
          value="186"
          description="5 evidence types"
          icon={<FileSearch className="h-5 w-5" />}
        />
        <MetricCard
          label="Open exceptions"
          value={items.length}
          description="1 urgent"
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="warning"
        />
        <MetricCard
          label="Potential impact"
          value={
            <Money
              centimes={items.reduce(
                (sum, finding) => sum + finding.financial_impact_centimes,
                0,
              )}
            />
          }
          description="Under review"
          icon={<CircleDollarSign className="h-5 w-5" />}
          tone="positive"
        />
      </div>

      {runResult ? (
        <Card className="overflow-hidden border-violet-200">
          <CardHeader className="bg-ai-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-control bg-ai text-white">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>Control audit completed</CardTitle>
                    <CardDescription>
                      {runResult.provider} · {runResult.model}
                    </CardDescription>
                  </div>
                </div>
              </div>
              <StatusBadge label="Succeeded" tone="confirmed" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-control bg-surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Documents
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                  {runResult.documents_analyzed}
                </p>
              </div>
              <div className="rounded-control bg-surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Findings
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                  {runResult.findings_created}
                </p>
              </div>
              <div className="col-span-2 rounded-control border border-emerald-200 bg-success-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">
                  Total identified impact
                </p>
                <p className="mt-2 text-2xl font-bold text-success">
                  <Money centimes={runResult.total_impact_centimes} />
                </p>
              </div>
            </div>
            <ol className="space-y-3">
              {runResult.tool_calls.map((call) => (
                <li key={call.sequence} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-950 text-xs font-semibold text-white">
                    {call.sequence}
                  </span>
                  <div className="min-w-0 flex-1 border-b border-border pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{call.label}</p>
                      <Badge variant={call.deterministic ? "neutral" : "ai"}>
                        {call.deterministic ? "Verified Python" : "Gemma"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {call.output}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-control border border-brand-200 bg-primary-subtle px-5 py-4 text-sm text-brand-950">
          <span className="font-semibold">Ready to run:</span> Gemma classifies
          the evidence; deterministic tools perform every monetary calculation,
          reconciliation and risk rule.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exception queue</CardTitle>
          <CardDescription>
            Every exception is linked to its source evidence and waits for a
            human decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          <FindingsTable
            findings={items}
            onOpen={(findingId) =>
              navigate(`/control-tower/audit/${findingId}`)
            }
          />
        </CardContent>
      </Card>
    </PageMotion>
  );
}

export function AuditFindingDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { findingId = primaryFinding.finding_id } = useParams();
  const { idToken } = useAuth();
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const finding = usePreviewQuery(
    ["control-tower", "audit-finding", findingId],
    idToken,
    (token) => getAuditFinding(findingId, token),
    primaryFinding,
  );
  const decision = useMutation({
    mutationFn: async () =>
      idToken
        ? decideAuditFinding(
            findingId,
            "PREPARE_DISPUTE",
            idToken,
            "Reviewed against PO-1042, BL-4478 and contract CTR-HUILE-2026.",
          )
        : {
            finding_id: findingId,
            status: "APPROVED" as const,
            action: "PREPARE_DISPUTE",
            approved_amount_centimes: 8_640_000,
            dispute_reference: "DSP-20260726-8821",
            message:
              "Human approval recorded. The corrected payable and evidence pack are ready.",
            approved_by: "Nadia El Mansouri",
            approved_at: new Date().toISOString(),
          },
    onSuccess: (result) => {
      setDecisionMessage(
        `${result.message} Reference: ${result.dispute_reference ?? "internal approval"}.`,
      );
      void queryClient.invalidateQueries({
        queryKey: ["control-tower"],
      });
    },
  });

  if (finding.isError) {
    return (
      <QueryError
        title="This audit finding is unavailable"
        retry={() => void finding.refetch()}
      />
    );
  }

  const data = finding.data ?? primaryFinding;

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Audit finding"
        title={data.title}
        description="Review the evidence before approving an action."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/control-tower/audit")}
          >
            Back to audit queue
          </Button>
        }
      />

      <FindingBadges finding={data} />

      {decisionMessage ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-control border border-emerald-200 bg-success-subtle p-4 text-success"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Decision safely recorded</p>
            <p className="mt-1 text-sm leading-relaxed">{decisionMessage}</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evidence chain</CardTitle>
            <CardDescription>
              Four documents were linked by reference, supplier, product and
              reporting period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.evidence.map((evidence, index) => (
              <div
                key={`${evidence.document_type}-${evidence.reference}`}
                className="grid gap-4 rounded-control border border-border p-4 md:grid-cols-[auto_1fr_auto] md:items-center"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-control ${
                    evidence.status === "MISMATCH"
                      ? "bg-danger-subtle text-danger"
                      : evidence.status === "MATCHED"
                        ? "bg-success-subtle text-success"
                        : "bg-primary-subtle text-primary"
                  }`}
                >
                  {evidence.document_type === "DELIVERY_NOTE" ? (
                    <PackageCheck className="h-5 w-5" />
                  ) : (
                    <ReceiptText className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{evidence.reference}</p>
                    <Badge
                      variant={
                        evidence.status === "MISMATCH"
                          ? "danger"
                          : evidence.status === "MATCHED"
                            ? "success"
                            : "neutral"
                      }
                    >
                      {titleCase(evidence.document_type)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {evidence.label}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  {evidence.amount_centimes ? (
                    <p className="font-semibold tabular-nums">
                      <Money centimes={evidence.amount_centimes} />
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-foreground-muted">
                    Evidence {index + 1} of {data.evidence.length}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>Decision required</CardTitle>
            <CardDescription>
              MIZAN recommends protecting the disputed amount while preserving
              the valid supplier payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-control bg-surface-subtle p-4">
              <p className="text-sm text-foreground-muted">Supplier invoice</p>
              <p className="mt-1 text-2xl font-bold">
                <Money centimes={data.observed_amount_centimes ?? 0} />
              </p>
            </div>
            <div className="rounded-control border border-emerald-200 bg-success-subtle p-4">
              <p className="text-sm text-success">Approved payable</p>
              <p className="mt-1 text-2xl font-bold text-success">
                <Money centimes={data.expected_amount_centimes ?? 0} />
              </p>
            </div>
            <div className="rounded-control border border-red-200 bg-danger-subtle p-4">
              <p className="text-sm text-danger">Amount to dispute</p>
              <p className="mt-1 text-2xl font-bold text-danger">
                <Money centimes={data.financial_impact_centimes} />
              </p>
            </div>
            <p className="text-sm leading-relaxed text-foreground-muted">
              {data.recommended_action}
            </p>
          </CardContent>
          <CardFooter className="flex-col items-stretch">
            <Button
              loading={decision.isPending}
              disabled={Boolean(decisionMessage)}
              onClick={() => decision.mutate()}
            >
              <FileCheck2 className="h-4 w-4" />
              Prepare dispute and approve 86,400 MAD
            </Button>
            <p className="text-center text-xs leading-relaxed text-foreground-muted">
              This records approval and prepares evidence. MIZAN never executes
              a bank payment automatically.
            </p>
          </CardFooter>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Deterministic calculation</CardTitle>
          <CardDescription>
            Gemma understands the documents. Python recalculates every financial
            amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            {data.calculation.map((step, index) => (
              <div
                key={step.label}
                className={`rounded-control border p-4 ${
                  index === data.calculation.length - 1
                    ? "border-red-200 bg-danger-subtle"
                    : "border-border bg-surface-subtle"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  {step.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {step.expression}
                </p>
                <p className="mt-3 text-xl font-bold tabular-nums">
                  <Money centimes={step.result_centimes} />
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageMotion>
  );
}

export function CashFlowPage() {
  const { idToken } = useAuth();
  const dashboard = usePreviewQuery(
    ["control-tower", "cash-flow"],
    idToken,
    getControlTowerDashboard,
    demoControlTowerDashboard,
  );

  if (dashboard.isError) {
    return (
      <QueryError
        title="Cash-flow forecast is unavailable"
        retry={() => void dashboard.refetch()}
      />
    );
  }

  const data = dashboard.data ?? demoControlTowerDashboard;
  const chartData = data.cash_forecast.map((point) => ({
    label: point.label,
    inflows: point.inflows_centimes / 100,
    outflows: point.outflows_centimes / 100,
    balance: point.projected_balance_centimes / 100,
  }));

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Treasury"
        title="Cash-flow forecast"
        description="See the next 30 days of cash pressure."
      />
      <PreviewNotice live={Boolean(idToken)} />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Current cash position"
          value={<Money centimes={31_500_000} />}
          description="Available now"
          icon={<Landmark className="h-5 w-5" />}
          tone="positive"
        />
        <MetricCard
          label="Lowest projected balance"
          value={<Money centimes={11_800_000} />}
          description="16 August 2026"
          icon={<TrendingDown className="h-5 w-5" />}
          tone="warning"
        />
        <MetricCard
          label="Expected recovery"
          value={<Money centimes={15_600_000} />}
          description="Due 20 August"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="ai"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Inflows versus supplier outflows</CardTitle>
              <CardDescription>
                Weekly view in MAD. Exact values remain available in the table
                below.
              </CardDescription>
            </div>
            <Badge variant="warning">
              <CalendarClock className="h-3.5 w-3.5" />
              Pressure window · 9–16 August
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="h-80"
            role="img"
            aria-label="Weekly inflows and outflows show supplier payments exceeding collections during 9 to 16 August."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e1ea" />
                <XAxis dataKey="label" stroke="#607087" fontSize={12} />
                <YAxis
                  stroke="#607087"
                  fontSize={12}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) =>
                    formatMAD(Math.round(Number(value) * 100))
                  }
                />
                <Bar
                  dataKey="inflows"
                  name="Expected collections"
                  fill="#00b4d8"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="outflows"
                  name="Supplier payments"
                  fill="#03045e"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Forecast detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-foreground-muted">
                  <tr>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3 text-right">Collections</th>
                    <th className="px-5 py-3 text-right">Payments</th>
                    <th className="px-5 py-3 text-right">Closing cash</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cash_forecast.map((point) => (
                    <tr
                      key={point.date}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-5 py-4 font-semibold">{point.label}</td>
                      <td className="px-5 py-4 text-right text-success">
                        +<Money centimes={point.inflows_centimes} />
                      </td>
                      <td className="px-5 py-4 text-right text-danger">
                        −<Money centimes={point.outflows_centimes} />
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        <Money centimes={point.projected_balance_centimes} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-200 bg-primary-subtle">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Recommended payment sequence</CardTitle>
                <CardDescription>MIZAN working-capital agent</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                "Pay the approved 86,400 MAD portion of INV-8821 after correction.",
                "Hold the probable duplicate PAY-7740-B pending treasury review.",
                "Schedule Casa Clean within its 30-day contractual window.",
                "Preserve a minimum operational buffer of 150,000 MAD.",
              ].map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-950 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-brand-950">
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </PageMotion>
  );
}

export function SupplierIntelligencePage() {
  const { idToken } = useAuth();
  const portfolio = usePreviewQuery(
    ["control-tower", "suppliers"],
    idToken,
    getSupplierPortfolio,
    demoSupplierPortfolio,
  );

  if (portfolio.isError) {
    return (
      <QueryError
        title="Supplier intelligence is unavailable"
        retry={() => void portfolio.refetch()}
      />
    );
  }

  const data = portfolio.data ?? demoSupplierPortfolio;
  const supplierChart = data.scorecards.map((supplier) => ({
    name: supplier.name.split(" ").slice(0, 2).join(" "),
    spend: supplier.spend_share_percent,
    risk: supplier.risk,
  }));

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Procurement"
        title="Supplier portfolio"
        description="Compare supplier cost, reliability, and dependence."
      />
      <PreviewNotice live={Boolean(idToken)} />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Supplier spend"
          value={<Money centimes={data.total_spend_centimes} />}
          description="42 active suppliers"
          icon={<UsersRound className="h-5 w-5" />}
        />
        <MetricCard
          label="Top supplier concentration"
          value={`${data.concentration_risk_percent}%`}
          description="Edible-oil category"
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="warning"
        />
        <MetricCard
          label="Savings opportunity"
          value={<Money centimes={data.savings_opportunity_centimes} />}
          description="Available actions"
          icon={<CircleDollarSign className="h-5 w-5" />}
          tone="positive"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Spend concentration</CardTitle>
            <CardDescription>
              Share of monitored supplier spend by partner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="h-72"
              role="img"
              aria-label="Maghreb Oils and Foods represents 68 percent of supplier spend, the largest concentration."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={supplierChart}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8e1ea" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => `${value}% of spend`} />
                  <Bar dataKey="spend" name="Spend share" radius={[0, 5, 5, 0]}>
                    {supplierChart.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.risk === "HIGH"
                            ? "#dc2626"
                            : entry.risk === "MEDIUM"
                              ? "#d97706"
                              : "#0077b6"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier scorecards</CardTitle>
            <CardDescription>
              Performance and financial-risk signals from confirmed records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.scorecards.map((supplier) => (
              <div
                key={supplier.supplier_id}
                className="rounded-control border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-primary">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{supplier.name}</p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {supplier.category} · {supplier.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        supplier.risk === "HIGH"
                          ? "danger"
                          : supplier.risk === "MEDIUM"
                            ? "warning"
                            : "success"
                      }
                    >
                      {supplier.risk} risk
                    </Badge>
                    <Badge
                      variant={
                        supplier.trend === "DECLINING"
                          ? "danger"
                          : supplier.trend === "IMPROVING"
                            ? "success"
                            : "neutral"
                      }
                    >
                      {titleCase(supplier.trend)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-y border-border py-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-foreground-muted">Spend share</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {supplier.spend_share_percent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">
                      On-time delivery
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {supplier.delivery_reliability_percent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">
                      Contract compliance
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {supplier.contract_compliance_percent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">
                      Disputed invoices
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {supplier.disputed_invoice_rate_percent}%
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                  <span className="font-semibold text-foreground">
                    Next action:
                  </span>{" "}
                  {supplier.recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </PageMotion>
  );
}

export function FinancialRecordsPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const records = usePreviewQuery(
    ["control-tower", "records"],
    idToken,
    getFinancialRecords,
    demoFinancialRecords,
  );

  if (records.isError) {
    return (
      <QueryError
        title="Financial records are unavailable"
        retry={() => void records.refetch()}
      />
    );
  }

  const items = records.data?.items ?? demoFinancialRecords.items;
  const recordTypeLabels: Record<string, string> = {
    PURCHASE_ORDER: "Order",
    DELIVERY_NOTE: "Delivery",
    SUPPLIER_INVOICE: "Invoice",
    BANK_PAYMENT: "Payment",
    CUSTOMER_RECEIVABLE: "Receivable",
  };

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Evidence ledger"
        title="Connected records"
        description="Trace each decision to its source records."
        actions={
          <Button onClick={() => navigate("/control-tower/evidence/new")}>
            <FileSearch className="h-4 w-4" />
            Add financial evidence
          </Button>
        }
      />
      <PreviewNotice live={Boolean(idToken)} />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Purchase orders", 38, FileCheck2],
          ["Supplier invoices", 71, ReceiptText],
          ["Delivery notes", 49, PackageCheck],
          ["Bank movements", 28, Landmark],
        ].map(([label, value, Icon]) => (
          <Card key={String(label)}>
            <CardContent className="flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-subtle text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-foreground-muted">{label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Company records</CardTitle>
            </div>
            <Badge variant="primary">186 records</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-foreground-muted">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Linked to</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((record) => (
                  <tr
                    key={record.record_id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold">
                      {record.reference}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="neutral">
                        {recordTypeLabels[record.record_type] ??
                          titleCase(record.record_type)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-foreground-muted">
                      {record.counterparty}
                    </td>
                    <td className="px-5 py-4 text-foreground-muted">
                      {formatDate(record.issued_on)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      <Money centimes={record.amount_centimes} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {record.linked_records.length ? (
                          record.linked_records.map((reference) => (
                            <Badge key={reference} variant="primary">
                              {reference}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-foreground-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          record.status === "EXCEPTION"
                            ? "danger"
                            : record.status === "MATCHED" ||
                                record.status === "PAID"
                              ? "success"
                              : "info"
                        }
                      >
                        {titleCase(record.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageMotion>
  );
}

export function ControlTowerImpactPage() {
  const navigate = useNavigate();
  return (
    <PageMotion>
      <PageHeader
        eyebrow="Demo outcome"
        title="From disconnected records to protected cash"
        description="See the value created from one audit decision."
      />

      <div className="overflow-hidden rounded-card border border-brand-200 bg-brand-950 text-white shadow-dialog">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
          <div>
            <Badge className="border-white/20 bg-white/10 text-white">
              Atlas Distribution Maroc · July 2026
            </Badge>
            <h2 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              MIZAN stopped a 6,100 MAD overpayment before settlement.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-100">
              The agent connected four documents, recalculated the approved
              payable, predicted the cash consequence and prepared a
              human-approved supplier dispute package.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                className="bg-white text-brand-950 hover:bg-brand-100"
                onClick={() =>
                  navigate("/control-tower/audit/finding-inv-8821")
                }
              >
                Review the evidence
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/control-tower/overview")}
              >
                Return to control tower
              </Button>
            </div>
          </div>
          <div className="rounded-card border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-semibold text-brand-100">
              Verified business impact
            </p>
            <dl className="mt-4 space-y-4">
              {[
                ["Immediate leakage prevented", "6,100 MAD"],
                ["Probable duplicate isolated", "12,750 MAD"],
                ["Cash pressure predicted", "240,000 MAD"],
                ["Supplier concentration found", "68%"],
                ["Documents connected", "186"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-0"
                >
                  <dt className="text-sm text-brand-100">{label}</dt>
                  <dd className="font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["1", "Evidence", "Invoice, order, delivery and payment"],
          ["2", "Gemma", "Classified and normalized documents"],
          ["3", "Controls", "Reconciled exact quantities and prices"],
          ["4", "Prediction", "Forecast cash and supplier risk"],
          ["5", "Approval", "Human authorized the business action"],
        ].map(([number, title, description]) => (
          <Card key={number}>
            <CardContent>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-950 text-xs font-bold text-white">
                {number}
              </span>
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-200 bg-success-subtle">
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-success text-white">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold text-success">
                The larger vision
              </p>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed text-success">
                MIZAN becomes the financial-control and supplier-intelligence
                layer above ERP, accounting and warehouse systems—protecting
                margin without replacing the tools companies already trust.
              </p>
            </div>
          </div>
          <Badge variant="success">No payment executed automatically</Badge>
        </CardContent>
      </Card>
    </PageMotion>
  );
}
