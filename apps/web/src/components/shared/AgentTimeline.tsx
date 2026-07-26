import {
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import type { AgentRunRecord } from "../../lib/api";
import { formatDateTime, titleCase } from "../../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { StatusBadge } from "./StatusBadge";

export function AgentTimeline({ run }: { run: AgentRunRecord }) {
  const calls = run.tool_calls ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card className="overflow-hidden">
        <div className="border-b border-violet-200 bg-ai-subtle px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-ai text-white">
                <BrainCircuit aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ai">Gemma agent run</p>
                <p className="mt-0.5 text-sm text-foreground-muted">
                  {run.provider} · {run.duration_ms.toLocaleString("en-MA")} ms
                </p>
              </div>
            </div>
            <StatusBadge
              label={titleCase(run.status)}
              tone={
                run.status === "SUCCEEDED"
                  ? "confirmed"
                  : run.status === "FAILED"
                    ? "failed"
                    : "running"
              }
            />
          </div>
        </div>
        <CardHeader>
          <CardTitle>How Gemma worked</CardTitle>
        </CardHeader>
        <CardContent>
          <ol
            className="relative grid gap-5 lg:grid-cols-3"
            aria-label="Agent tool calls"
          >
            {calls.map((call, index) => {
              const successful = call.status === "SUCCEEDED";
              const failed = call.status === "FAILED";
              const Icon = successful
                ? CheckCircle2
                : failed
                  ? CircleAlert
                  : Clock3;

              return (
                <motion.li
                  key={call.tool_call_id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="relative grid grid-cols-[2.5rem_1fr] gap-4 pb-7 last:pb-0 lg:flex lg:flex-col lg:items-center lg:gap-3 lg:pb-0"
                >
                  {index < calls.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-5 top-9 h-[calc(100%-1rem)] w-px bg-border lg:left-1/2 lg:top-5 lg:h-px lg:w-[calc(100%+1.25rem)]"
                    />
                  ) : null}
                  <span
                    className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-surface ${
                      successful
                        ? "border-emerald-200 text-success"
                        : failed
                          ? "border-red-200 text-danger"
                          : "border-violet-200 text-ai"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 rounded-control border border-border bg-surface-subtle p-4 lg:w-full lg:flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-2 font-semibold text-foreground">
                          <Wrench
                            aria-hidden="true"
                            className="h-4 w-4 text-ai"
                          />
                          {titleCase(call.name)}
                        </p>
                        <p className="mt-1 text-xs text-foreground-muted">
                          Step {call.sequence} · {call.duration_ms} ms
                        </p>
                      </div>
                      <StatusBadge
                        label={titleCase(call.status)}
                        tone={
                          successful
                            ? "confirmed"
                            : failed
                              ? "failed"
                              : "running"
                        }
                      />
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm 2xl:grid-cols-2">
                      <div>
                        <dt className="font-medium text-foreground-muted">
                          Input
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {call.input_summary}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-foreground-muted">
                          Result
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {call.output_summary}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </motion.li>
              );
            })}
          </ol>
          <p className="mt-6 border-t border-border pt-4 text-xs text-foreground-muted">
            {formatDateTime(run.created_at)} · Draft only — human approval
            required.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
