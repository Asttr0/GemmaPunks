import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  Clock3,
  FileSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AgentTimeline } from "../../components/shared/AgentTimeline";
import { EmptyState } from "../../components/shared/EmptyState";
import { MetricCard } from "../../components/shared/MetricCard";
import { PageHeader } from "../../components/shared/PageHeader";
import { PageMotion } from "../../components/shared/PageMotion";
import { PreviewNotice } from "../../components/shared/PreviewNotice";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { demoAgentRun } from "../../lib/demo-data";
import { getAgentRun } from "../../lib/api";
import { formatDateTime, titleCase } from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";
import { useAuth } from "../auth/auth-context";

function AgentRunLoading() {
  return (
    <PageMotion>
      <PageHeader
        eyebrow="AI audit"
        title="Agent run"
        description="Loading the model run and its deterministic tool calls."
      />
      <div
        className="grid animate-pulse gap-4 motion-reduce:animate-none md:grid-cols-2 xl:grid-cols-4"
        aria-label="Loading agent run"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-card border border-border bg-surface-subtle"
          />
        ))}
      </div>
      <div className="h-[28rem] animate-pulse rounded-card border border-border bg-surface-subtle motion-reduce:animate-none" />
    </PageMotion>
  );
}

export function AgentRunPage() {
  const navigate = useNavigate();
  const params = useParams<"agentRunId" | "id">();
  const { idToken } = useAuth();
  const agentRunId =
    params.agentRunId ?? params.id ?? demoAgentRun.agent_run_id;
  const agentRun = usePreviewQuery(
    ["agent-run", agentRunId],
    idToken,
    (token) => getAgentRun(agentRunId, token),
    demoAgentRun,
  );

  if (agentRun.isPending) {
    return <AgentRunLoading />;
  }

  if (agentRun.isError) {
    return (
      <PageMotion>
        <PageHeader
          eyebrow="AI audit"
          title="Agent run"
          description="Inspect what Gemma understood and which approved tools were used."
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Go back
            </Button>
          }
        />
        <EmptyState
          title="The agent run is unavailable"
          description="The backend could not return this audit record. Check the run ID or API connection, then try again."
          icon={<AlertTriangle className="h-6 w-6" />}
          action={
            <Button onClick={() => void agentRun.refetch()}>Try again</Button>
          }
        />
      </PageMotion>
    );
  }

  const run = agentRun.data ?? demoAgentRun;
  const calls = run.tool_calls ?? [];
  const statusTone =
    run.status === "SUCCEEDED"
      ? "confirmed"
      : run.status === "FAILED"
        ? "failed"
        : "running";

  return (
    <PageMotion>
      <PageHeader
        eyebrow="AI audit"
        title="Agent run"
        description="See the evidence interpretation and deterministic tools behind this recommendation. Tool summaries are visible; raw payloads stay hidden."
        breadcrumbs={[
          { label: "Workspace", href: "/" },
          { label: "Agent runs" },
          { label: run.agent_run_id },
        ]}
        actions={
          <>
            <StatusBadge label={titleCase(run.status)} tone={statusTone} />
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Go back
            </Button>
          </>
        }
      />

      <PreviewNotice live={Boolean(idToken)} />

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Agent run summary"
      >
        <MetricCard
          label="Provider"
          value={titleCase(run.provider)}
          description={run.model ?? "Model name was not reported"}
          icon={<BrainCircuit className="h-5 w-5" />}
          tone="ai"
        />
        <MetricCard
          label="Tool calls"
          value={calls.length.toLocaleString("en-MA")}
          description="Chronological, reviewable steps"
          icon={<Wrench className="h-5 w-5" />}
          tone="ai"
        />
        <MetricCard
          label="Run duration"
          value={`${run.duration_ms.toLocaleString("en-MA")} ms`}
          description="From evidence inspection to result"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Provider path"
          value={run.fallback_used ? "Fallback used" : "Primary path"}
          description={
            run.fallback_used
              ? "A safe fixture response completed this run"
              : "No provider fallback was required"
          }
          icon={<FileSearch className="h-5 w-5" />}
          tone={run.fallback_used ? "warning" : "positive"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.75fr]">
        <AgentTimeline run={run} />

        <div className="space-y-6">
          <Card className="border-violet-200 bg-ai-subtle">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-ai text-white">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Human approval stays in control</CardTitle>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                    Gemma can create drafts and explanations. It cannot confirm
                    a financial record or approve an order.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-control border border-violet-200 bg-surface p-4">
                <p className="text-sm font-semibold text-ai">
                  Safe execution boundary
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  Deterministic backend code performs calculations and every
                  consequential action requires a separate human decision.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-foreground-muted">
                    Run identifier
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-foreground">
                    {run.agent_run_id}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground-muted">
                    Evidence document
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-foreground">
                    {run.document_id ?? "No document linked"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground-muted">
                    Ingestion job
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-foreground">
                    {run.ingestion_job_id ?? "No ingestion job linked"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground-muted">Started</dt>
                  <dd className="mt-1 text-foreground">
                    {formatDateTime(run.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground-muted">
                    Completed
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {formatDateTime(run.completed_at)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageMotion>
  );
}
