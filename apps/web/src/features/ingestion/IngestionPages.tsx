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
import {
  confirmIngestion,
  getIngestion,
  getProductOptions,
  uploadEvidence,
} from "../../lib/api";
import type { DraftLine } from "./types";
import {
  demoAgentRun,
  demoIngestion,
  demoProductOptions,
} from "../../lib/demo-data";
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
    label: "Supplier invoice",
    description: "JPG, PNG or PDF",
    icon: ReceiptText,
    accept: "image/jpeg,image/png,application/pdf",
  },
  {
    value: "audio",
    label: "Finance voice note",
    description: "MP3, WAV or M4A",
    icon: Mic,
    accept: "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a",
  },
  {
    value: "ledger",
    label: "PO or delivery note",
    description: "JPG, PNG or PDF",
    icon: FileText,
    accept: "image/jpeg,image/png,application/pdf",
  },
  {
    value: "screenshot",
    label: "ERP or bank screenshot",
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
      navigate(`/control-tower/ingestions/${result.id}`, {
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
        eyebrow="AI extraction"
        title="Add financial evidence"
        description="Upload an invoice, order, delivery note, or screenshot."
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
                Human confirmation is required before records or payments
                change.
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
          [
            "1",
            "Evidence",
            "Invoice, PO, delivery note, bank export, or voice",
          ],
          [
            "2",
            "AI draft",
            "Structured financial fields with uncertainty marked",
          ],
          ["3", "Your confirmation", "Only then can company records update"],
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
  const productOptions = usePreviewQuery(
    ["product-options"],
    idToken,
    getProductOptions,
    demoProductOptions,
  );
  const [lines, setLines] = useState<DraftLine[]>([]);
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
  const unresolvedLines = useMemo(
    () =>
      lines
        .map((line, index) => {
          const product = productOptions.data?.items.find(
            (option) => option.product_id === line.product_id,
          );
          const hasApprovedUnit = product?.units.some(
            (option) => option.unit.toUpperCase() === line.unit.toUpperCase(),
          );
          return !product || !hasApprovedUnit ? index : -1;
        })
        .filter((index) => index >= 0),
    [lines, productOptions.data?.items],
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
          clarification_answers: [],
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
        queryClient.invalidateQueries({ queryKey: ["control-tower"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-findings"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-records"] }),
      ]);
    },
  });

  const previewUrl = (location.state as { previewUrl?: string } | null)
    ?.previewUrl;
  const confirmedReference = data.document.original_name.includes("po-1042")
    ? "PO-1042"
    : data.document.original_name.includes("bl-4478")
      ? "BL-4478"
      : data.document.original_name.includes("inv-8821")
        ? "INV-8821"
        : data.document.original_name;

  if (previewConfirmed || data.status === "CONFIRMED") {
    return (
      <PageMotion>
        <PageHeader
          eyebrow="Official record"
          title="Financial evidence confirmed"
          description="The record is confirmed and ready for analysis."
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
              {lines.length} line items confirmed.
            </p>
          </div>
          <CardContent className="flex flex-wrap justify-center gap-3 py-6">
            <Button
              onClick={() =>
                navigate("/control-tower/overview", {
                  state: { confirmedReference },
                })
              }
            >
              View updated dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/control-tower/records")}
            >
              View financial records
            </Button>
          </CardContent>
        </Card>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        eyebrow="AI draft"
        title="Review extracted evidence"
        description="Check the fields before confirming."
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
                  alt="Uploaded financial document preview"
                  className="aspect-[4/5] w-full rounded-card border border-border object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-card border border-dashed border-brand-200 bg-primary-subtle/50 p-8 text-center">
                  <ReceiptText className="h-12 w-12 text-primary" />
                  <p className="mt-5 font-semibold text-foreground">
                    {data.document.original_name}
                  </p>
                  <p className="mt-2 text-sm text-foreground-muted">
                    The uploaded financial document preview will appear here.
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
                const approvedProducts = productOptions.data?.items ?? [];
                const selectedProduct = approvedProducts.find(
                  (option) => option.product_id === line.product_id,
                );
                const selectedUnit = selectedProduct?.units.find(
                  (option) =>
                    option.unit.toUpperCase() === line.unit.toUpperCase(),
                );
                const missingProduct = !selectedProduct;
                const missingUnit = Boolean(selectedProduct) && !selectedUnit;
                const uncertain =
                  line.uncertain_fields?.length ||
                  missingProduct ||
                  missingUnit;
                const inventoryQuantity =
                  line.quantity * (selectedUnit?.conversion_to_base ?? 1);
                const baseUnitLabel =
                  selectedProduct?.base_unit.toLowerCase() ?? "unit";
                const pluralBaseUnit = (quantity: number) =>
                  quantity === 1 ? baseUnitLabel : `${baseUnitLabel}s`;
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
                          Extracted line {index + 1}
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
                            ? `${formatPercent(line.confidence)} · Review needed`
                            : `${formatPercent(line.confidence)} confidence`
                        }
                        tone={uncertain ? "pending" : "confirmed"}
                      />
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-foreground">
                        Approved product
                        <select
                          value={selectedProduct?.product_id ?? ""}
                          aria-invalid={missingProduct}
                          onChange={(event) => {
                            const next = [...lines];
                            const product = approvedProducts.find(
                              (option) =>
                                option.product_id === event.target.value,
                            );
                            if (!product) {
                              next[index] = {
                                ...line,
                                product_id: null,
                                uncertain_fields: Array.from(
                                  new Set([
                                    ...(line.uncertain_fields ?? []),
                                    "product_id",
                                  ]),
                                ),
                              };
                            } else {
                              const unit =
                                product.units.find(
                                  (option) =>
                                    option.unit.toUpperCase() ===
                                    line.unit.toUpperCase(),
                                ) ?? product.units[0];
                              next[index] = {
                                ...line,
                                product_id: product.product_id,
                                product_name: product.name,
                                unit: unit?.unit ?? product.base_unit,
                                base_unit: product.base_unit,
                                unit_multiplier: unit?.conversion_to_base ?? 1,
                                uncertain_fields: (
                                  line.uncertain_fields ?? []
                                ).filter(
                                  (field) =>
                                    field !== "product_id" && field !== "unit",
                                ),
                              };
                            }
                            setLines(next);
                          }}
                          className={`mt-2 min-h-11 w-full cursor-pointer rounded-control border bg-surface px-3 text-foreground outline-none focus:ring-2 focus:ring-focus ${
                            missingProduct ? "border-danger" : "border-border"
                          }`}
                        >
                          <option value="">Select a catalogue product</option>
                          {approvedProducts.map((product) => (
                            <option
                              key={product.product_id}
                              value={product.product_id}
                            >
                              {product.name}
                            </option>
                          ))}
                        </select>
                        {missingProduct ? (
                          <span className="mt-1 block text-xs font-medium text-danger">
                            Select the approved product that matches this line.
                          </span>
                        ) : (
                          <span className="mt-1 block text-xs text-foreground-muted">
                            Product ID: {selectedProduct.product_id}
                          </span>
                        )}
                      </label>

                      <label className="text-sm font-medium text-foreground">
                        Purchasing unit
                        <select
                          value={selectedUnit?.unit ?? ""}
                          disabled={!selectedProduct}
                          aria-invalid={missingUnit}
                          onChange={(event) => {
                            const option = selectedProduct?.units.find(
                              (unit) => unit.unit === event.target.value,
                            );
                            if (!option || !selectedProduct) return;
                            const next = [...lines];
                            next[index] = {
                              ...line,
                              unit: option.unit,
                              base_unit: selectedProduct.base_unit,
                              unit_multiplier: option.conversion_to_base,
                              uncertain_fields: (
                                line.uncertain_fields ?? []
                              ).filter((field) => field !== "unit"),
                            };
                            setLines(next);
                          }}
                          className={`mt-2 min-h-11 w-full cursor-pointer rounded-control border bg-surface px-3 text-foreground outline-none focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-foreground-muted ${
                            missingUnit ? "border-danger" : "border-border"
                          }`}
                        >
                          <option value="">
                            {selectedProduct
                              ? "Select an approved unit"
                              : "Select a product first"}
                          </option>
                          {selectedProduct?.units.map((option) => (
                            <option key={option.unit} value={option.unit}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {missingUnit ? (
                          <span className="mt-1 block text-xs font-medium text-danger">
                            Choose one of this product’s approved units.
                          </span>
                        ) : selectedUnit &&
                          selectedUnit.conversion_to_base > 1 ? (
                          <span className="mt-1 block text-xs text-foreground-muted">
                            1 {selectedUnit.unit.toLowerCase()} ={" "}
                            {selectedUnit.conversion_to_base}{" "}
                            {pluralBaseUnit(selectedUnit.conversion_to_base)}
                          </span>
                        ) : (
                          <span className="mt-1 block text-xs text-foreground-muted">
                            Inventory base unit:{" "}
                            {selectedProduct?.base_unit.toLowerCase() ?? "—"}
                          </span>
                        )}
                      </label>

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
                            line.uncertain_fields?.includes("quantity")
                              ? "border-warning"
                              : "border-border"
                          }`}
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
                    {selectedUnit && selectedUnit.conversion_to_base > 1 ? (
                      <p className="mt-1 text-right text-sm text-foreground-muted">
                        Adds {inventoryQuantity.toLocaleString("en-MA")}{" "}
                        {pluralBaseUnit(inventoryQuantity)} to inventory
                      </p>
                    ) : null}
                  </motion.fieldset>
                );
              })}
            </CardContent>
          </Card>

          {unresolvedLines.length > 0 ? (
            <div
              role="alert"
              className="flex gap-3 rounded-control border border-amber-300 bg-warning-subtle p-4 text-sm text-warning"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  Resolve {unresolvedLines.length} extracted{" "}
                  {unresolvedLines.length === 1 ? "line" : "lines"} before
                  confirmation.
                </p>
                <p className="mt-1">
                  Select an approved product and purchasing unit on every line.
                </p>
              </div>
            </div>
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
                  Records and base-unit inventory change only after
                  confirmation.
                </p>
              </div>
              <Button
                size="lg"
                className="shrink-0 whitespace-nowrap"
                loading={confirm.isPending}
                disabled={
                  productOptions.isLoading || unresolvedLines.length > 0
                }
                onClick={() => confirm.mutate()}
              >
                <CheckCircle2 className="h-5 w-5" />
                Confirm financial record
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
