import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileAudio,
  FileImage,
  FileText,
  Mic,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AgentTimeline } from "../../components/shared/AgentTimeline";
import { Money } from "../../components/shared/Money";
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
import { confirmIngestion, getIngestion, uploadEvidence } from "../../lib/api";
import type { DraftLine } from "./types";
import { demoAgentRun, demoIngestion } from "../../lib/demo-data";
import { formatMAD, formatPercent } from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";
import { useAuth } from "../auth/auth-context";

type EvidenceKind = "receipt" | "audio" | "ledger" | "screenshot";

const evidenceOptions: Array<{
  value: EvidenceKind;
  label: string;
  description: string;
  icon: typeof ReceiptText;
  accept: string;
}> = [
  {
    value: "receipt",
    label: "Receipt or invoice",
    description: "JPG, PNG or PDF",
    icon: ReceiptText,
    accept: "image/jpeg,image/png,application/pdf",
  },
  {
    value: "audio",
    label: "Darija voice note",
    description: "MP3, WAV or M4A",
    icon: Mic,
    accept: "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a",
  },
  {
    value: "ledger",
    label: "Ledger page",
    description: "JPG, PNG or PDF",
    icon: FileText,
    accept: "image/jpeg,image/png,application/pdf",
  },
  {
    value: "screenshot",
    label: "Order screenshot",
    description: "JPG or PNG",
    icon: FileImage,
    accept: "image/jpeg,image/png",
  },
];

export function EvidenceUploadPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const [kind, setKind] = useState<EvidenceKind>("receipt");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file before starting extraction.");
      if (!idToken) return demoIngestion;
      return uploadEvidence(file, kind, idToken);
    },
    onSuccess: (result) => {
      navigate(`/merchant/ingestions/${result.id}`, {
        state: {
          fileName: file?.name,
          previewUrl:
            file && file.type.startsWith("image/")
              ? URL.createObjectURL(file)
              : undefined,
        },
      });
    },
    onError: (reason) => {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    },
  });

  const selected = evidenceOptions.find((option) => option.value === kind)!;

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Evidence to decision"
        title="Add today’s business evidence"
        description="Upload what you already have. Gemma will create a draft, mark uncertainty, and wait for your confirmation."
      />
      <PreviewNotice live={Boolean(idToken)} />

      <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader>
            <CardTitle>1. Choose evidence type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidenceOptions.map((option) => {
              const Icon = option.icon;
              const active = option.value === kind;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setKind(option.value);
                    setFile(null);
                    setError(null);
                  }}
                  className={`flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-control border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus ${
                    active
                      ? "border-primary bg-primary-subtle text-brand-950"
                      : "border-border bg-surface hover:border-brand-200 hover:bg-surface-subtle"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-control ${
                      active
                        ? "bg-surface text-primary"
                        : "bg-surface-subtle text-foreground-muted"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-foreground-muted">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>2. Upload and extract</CardTitle>
          </CardHeader>
          <CardContent>
            <label
              className={`group flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed p-8 text-center outline-none transition-colors focus-within:ring-2 focus-within:ring-focus ${
                file
                  ? "border-primary bg-primary-subtle/60"
                  : "border-brand-200 bg-surface-subtle hover:border-primary hover:bg-primary-subtle/50"
              }`}
            >
              <input
                className="sr-only"
                type="file"
                accept={selected.accept}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
                    setError("The file must be smaller than 10 MB.");
                    setFile(null);
                    return;
                  }
                  setFile(selectedFile);
                  setError(null);
                }}
              />
              <motion.span
                animate={file ? { scale: [1, 1.08, 1] } : undefined}
                className="flex h-16 w-16 items-center justify-center rounded-card bg-surface text-primary shadow-sm"
              >
                {file?.type.startsWith("audio/") ? (
                  <FileAudio className="h-8 w-8" />
                ) : file ? (
                  <FileImage className="h-8 w-8" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </motion.span>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                {file ? file.name : `Choose a ${selected.label.toLowerCase()}`}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">
                {file
                  ? `${(file.size / 1024).toFixed(0)} KB · ready for a reviewable extraction`
                  : "Click to browse. Uploading creates an AI draft only; official financial records do not change yet."}
              </p>
              <span className="mt-5 rounded-badge border border-brand-200 bg-surface px-3 py-1 text-xs font-semibold text-primary">
                Maximum 10 MB
              </span>
            </label>

            {error ? (
              <div
                role="alert"
                className="mt-4 flex gap-2 rounded-control border border-red-200 bg-danger-subtle p-4 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-sm text-foreground-muted">
                <ShieldCheck className="h-4 w-4 text-success" />
                Human confirmation is required before stock changes.
              </p>
              <Button
                disabled={!file}
                loading={upload.isPending}
                onClick={() => upload.mutate()}
              >
                <Sparkles className="h-4 w-4" />
                {upload.isPending
                  ? "Gemma is extracting"
                  : "Create reviewable draft"}
                {!upload.isPending ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["1", "Evidence", "Receipt, voice, ledger or screenshot"],
          ["2", "AI draft", "Structured fields with uncertainty marked"],
          ["3", "Your confirmation", "Only then do records and stock update"],
        ].map(([number, title, description]) => (
          <div
            key={number}
            className="rounded-card border border-border bg-surface p-5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-950 text-sm font-bold text-white">
              {number}
            </span>
            <p className="mt-4 font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-foreground-muted">{description}</p>
          </div>
        ))}
      </div>
    </PageMotion>
  );
}

export function IngestionReviewPage() {
  const { ingestionId = "ing-demo-001" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { idToken } = useAuth();
  const ingestion = usePreviewQuery(
    ["ingestion", ingestionId],
    idToken,
    (token) => getIngestion(ingestionId, token),
    demoIngestion,
  );
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [clarification, setClarification] = useState("");
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  const data = ingestion.data ?? demoIngestion;

  useEffect(() => {
    if (data.draft?.lines) setLines(data.draft.lines);
  }, [data.draft?.lines]);

  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + line.quantity * line.unit_price_centimes,
        0,
      ),
    [lines],
  );

  const confirm = useMutation({
    mutationFn: async () => {
      if (!data.draft) throw new Error("No draft is ready to confirm.");
      if (!idToken) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        return { status: "CONFIRMED" as const };
      }
      return confirmIngestion(
        ingestionId,
        {
          draft_version: data.draft.version,
          clarification_answers: data.draft.clarification_question
            ? [
                {
                  field_path: "lines[1].quantity",
                  answer: clarification || String(lines[1]?.quantity ?? ""),
                },
              ]
            : [],
          draft: {
            ...data.draft,
            lines: lines.map((line) => ({
              ...line,
              line_total_centimes: line.quantity * line.unit_price_centimes,
            })),
            total_centimes: total,
          },
        },
        idToken,
        crypto.randomUUID(),
      );
    },
    onSuccess: async () => {
      setPreviewConfirmed(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["merchant", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["merchant", "inventory"] }),
        queryClient.invalidateQueries({
          queryKey: ["merchant", "transactions"],
        }),
      ]);
    },
  });

  const previewUrl = (location.state as { previewUrl?: string } | null)
    ?.previewUrl;

  if (previewConfirmed || data.status === "CONFIRMED") {
    return (
      <PageMotion>
        <PageHeader
          eyebrow="Official record"
          title="Draft confirmed successfully"
          description="The purchase is now official. Inventory and business metrics can safely use it."
        />
        <Card className="overflow-hidden border-emerald-200">
          <div className="bg-success-subtle px-8 py-10 text-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-white"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.span>
            <h2 className="mt-6 text-3xl font-bold text-foreground">
              {formatMAD(total)} recorded
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-foreground-muted">
              {lines.length} product lines were confirmed. This human action—not
              the AI extraction—authorized the inventory update.
            </p>
          </div>
          <CardContent className="flex flex-wrap justify-center gap-3 py-6">
            <Button onClick={() => navigate("/merchant/dashboard")}>
              View updated dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/merchant/inventory")}
            >
              Check inventory
            </Button>
          </CardContent>
        </Card>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        eyebrow="AI draft · human review required"
        title="Review extracted evidence"
        description="Compare the original evidence with Gemma’s proposed fields. Correct uncertainty before confirming."
        actions={<StatusBadge label="Ready for review" tone="draft" />}
      />
      <PreviewNotice live={Boolean(idToken)} />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Original evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Uploaded receipt preview"
                  className="aspect-[4/5] w-full rounded-card border border-border object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-card border border-dashed border-brand-200 bg-primary-subtle/50 p-8 text-center">
                  <ReceiptText className="h-12 w-12 text-primary" />
                  <p className="mt-5 font-semibold text-foreground">
                    {data.document.original_name}
                  </p>
                  <p className="mt-2 text-sm text-foreground-muted">
                    Synthetic receipt preview will appear here in the final
                    demo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <AgentTimeline run={demoAgentRun} />
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-violet-200 bg-ai-subtle px-6 py-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ai">
                <Sparkles className="h-4 w-4" />
                Gemma extraction draft
              </p>
            </div>
            <CardContent className="space-y-5">
              {lines.map((line, index) => {
                const uncertain = line.uncertain_fields?.length;
                return (
                  <motion.fieldset
                    key={line.line_id ?? index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className={`rounded-card border p-5 ${
                      uncertain
                        ? "border-amber-300 bg-warning-subtle"
                        : "border-border bg-surface"
                    }`}
                  >
                    <legend className="sr-only">
                      Extracted line {index + 1}
                    </legend>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {line.product_name}
                        </p>
                        <p
                          className="mt-1 text-sm text-foreground-muted"
                          lang="fr"
                          dir="auto"
                        >
                          Source:{" "}
                          {line.original_product_name ?? line.product_name}
                        </p>
                      </div>
                      <StatusBadge
                        label={
                          uncertain
                            ? `${formatPercent(line.confidence)} · Check quantity`
                            : `${formatPercent(line.confidence)} confidence`
                        }
                        tone={uncertain ? "pending" : "confirmed"}
                      />
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <label className="text-sm font-medium text-foreground">
                        Quantity
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.quantity}
                          onChange={(event) => {
                            const next = [...lines];
                            next[index] = {
                              ...line,
                              quantity: Number(event.target.value),
                            };
                            setLines(next);
                          }}
                          className={`mt-2 min-h-11 w-full rounded-control border bg-surface px-3 text-foreground outline-none focus:ring-2 focus:ring-focus ${
                            uncertain ? "border-warning" : "border-border"
                          }`}
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Unit
                        <input
                          value={line.unit}
                          readOnly
                          className="mt-2 min-h-11 w-full rounded-control border border-border bg-surface-subtle px-3 text-foreground-muted"
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Unit price
                        <input
                          type="number"
                          min="1"
                          value={line.unit_price_centimes}
                          onChange={(event) => {
                            const next = [...lines];
                            next[index] = {
                              ...line,
                              unit_price_centimes: Number(event.target.value),
                            };
                            setLines(next);
                          }}
                          className="mt-2 min-h-11 w-full rounded-control border border-border bg-surface px-3 text-foreground outline-none focus:ring-2 focus:ring-focus"
                        />
                        <span className="mt-1 block text-xs text-foreground-muted">
                          Stored as centimes
                        </span>
                      </label>
                    </div>
                    <p className="mt-4 text-right font-semibold text-foreground">
                      Line total:{" "}
                      <Money
                        centimes={line.quantity * line.unit_price_centimes}
                      />
                    </p>
                  </motion.fieldset>
                );
              })}
            </CardContent>
          </Card>

          {data.draft?.clarification_question ? (
            <Card className="border-amber-300">
              <CardContent>
                <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                  <AlertCircle className="h-4 w-4" />
                  One clarification needed
                </p>
                <h2 className="mt-3 text-xl font-semibold text-foreground">
                  {data.draft.clarification_question}
                </h2>
                <label className="mt-5 block text-sm font-medium text-foreground">
                  Your answer
                  <input
                    value={clarification}
                    onChange={(event) => setClarification(event.target.value)}
                    placeholder="Yes, 10 bags"
                    className="mt-2 min-h-11 w-full rounded-control border border-border bg-surface px-3 outline-none focus:ring-2 focus:ring-focus"
                  />
                </label>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-brand-200">
            <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground-muted">
                  Confirmed draft total
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  <Money centimes={total} />
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-success">
                  <ShieldCheck className="h-4 w-4" />
                  Inventory changes only after this confirmation.
                </p>
              </div>
              <Button
                size="lg"
                loading={confirm.isPending}
                disabled={
                  Boolean(data.draft?.clarification_question) &&
                  clarification.trim().length === 0
                }
                onClick={() => confirm.mutate()}
              >
                <CheckCircle2 className="h-5 w-5" />
                Confirm purchase draft
              </Button>
            </CardContent>
          </Card>

          {confirm.isError ? (
            <div
              role="alert"
              className="flex gap-2 rounded-control border border-red-200 bg-danger-subtle p-4 text-sm text-danger"
            >
              <AlertCircle className="h-4 w-4" />
              {confirm.error instanceof Error
                ? confirm.error.message
                : "Confirmation failed. Nothing was changed."}
            </div>
          ) : null}
        </div>
      </section>
    </PageMotion>
  );
}
