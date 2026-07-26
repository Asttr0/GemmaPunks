import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  MapPin,
  PackageCheck,
  PackagePlus,
  Send,
  TriangleAlert,
  Truck,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import {
  StatusBadge,
  type StatusTone,
} from "../../components/shared/StatusBadge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  createSupplierCatalogItem,
  createSupplierOffer,
  getSupplierCatalog,
  getSupplierDashboard,
  getSupplierOpportunities,
  type CreateCatalogItemRequest,
  type CreateSupplierOfferRequest,
  type Offer,
  type SupplierCatalogItem,
  type SupplierOpportunity,
} from "../../lib/api";
import {
  demoSupplierCatalog,
  demoSupplierDashboard,
  demoSupplierOpportunities,
} from "../../lib/demo-data";
import {
  formatDate,
  formatMAD,
  formatQuantity,
  titleCase,
} from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";
import { useAuth } from "../auth/auth-context";

const fieldClassName =
  "min-h-11 w-full rounded-control border border-border-strong bg-surface px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-standard placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70";

function statusTone(status: string): StatusTone {
  if (status === "ACTIVE") return "confirmed";
  if (status === "QUOTED") return "info";
  if (status === "CLOSED" || status === "ARCHIVED") return "neutral";
  return "pending";
}

function productName(productId: string) {
  const names: Record<string, string> = {
    "cooking-oil-1l": "Cooking oil 1L",
    "sugar-1kg": "Sugar 1kg",
    "flour-1kg": "Flour 1kg",
    "milk-1l": "Milk 1L",
  };
  return names[productId] ?? titleCase(productId);
}

function ErrorPanel({ title, retry }: { title: string; retry: () => void }) {
  return (
    <EmptyState
      title={title}
      description="The supplier information could not be loaded. Check the API connection and try again."
      icon={<TriangleAlert className="h-6 w-6" />}
      action={<Button onClick={retry}>Try again</Button>}
    />
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">{label}</span>
      <div className="h-24 animate-pulse rounded-card bg-surface-subtle motion-reduce:animate-none" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-40 animate-pulse rounded-card border border-border bg-surface-subtle motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

function OpportunitySummary({
  opportunity,
  action,
}: {
  opportunity: SupplierOpportunity;
  action?: React.ReactNode;
}) {
  return (
    <Card className="transition-[border-color,box-shadow] duration-standard hover:border-brand-200 hover:shadow-raised">
      <CardContent className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-primary">
            <PackageCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <StatusBadge
            label={titleCase(opportunity.status)}
            tone={statusTone(opportunity.status)}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {productName(opportunity.product_id)}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Qualified demand from {opportunity.merchant_count} anonymized
            businesses
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 border-y border-border py-4">
          <div>
            <dt className="text-xs font-medium text-foreground-muted">
              Total demand
            </dt>
            <dd className="mt-1 font-semibold tabular-nums text-foreground">
              {formatQuantity(opportunity.total_quantity, opportunity.unit)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-foreground-muted">
              Needed by
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {formatDate(opportunity.needed_by)}
            </dd>
          </div>
        </dl>
        <p className="flex items-center gap-2 text-sm text-foreground-muted">
          <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
          {opportunity.coarse_area}
        </p>
        {action ? <div className="mt-auto">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export function SupplierDashboardPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const dashboard = usePreviewQuery(
    ["supplier", "dashboard"],
    idToken,
    getSupplierDashboard,
    demoSupplierDashboard,
  );

  if (dashboard.isPending && idToken) {
    return <LoadingPanel label="Loading supplier dashboard" />;
  }

  if (dashboard.isError) {
    return (
      <ErrorPanel
        title="Supplier dashboard is unavailable"
        retry={() => void dashboard.refetch()}
      />
    );
  }

  const data = dashboard.data ?? demoSupplierDashboard;
  const opportunities = data.opportunities ?? [];
  const chartData = opportunities.map((opportunity) => ({
    name: productName(opportunity.product_id)
      .replace("Cooking ", "")
      .replace(" 1L", "")
      .replace(" 1kg", ""),
    quantity: opportunity.total_quantity,
  }));

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Supplier workspace"
        title="Demand you can act on"
        description="See qualified, aggregated purchasing demand without exposing any merchant's private sales or cash data."
        actions={
          <Button onClick={() => navigate("/supplier/opportunities")}>
            Review opportunities
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        }
      />
      <PreviewNotice live={Boolean(idToken)} />

      <StaggerGrid className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <MetricCard
            label="Active catalog items"
            value={data.kpis.active_catalog_items}
            description="Products available to nearby merchants"
            icon={<Boxes className="h-5 w-5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Demand opportunities"
            value={data.kpis.active_demand_opportunities}
            description="Qualified opportunities ready to quote"
            icon={<BadgeDollarSign className="h-5 w-5" />}
            tone="ai"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Potential volume"
            value={formatQuantity(data.kpis.total_potential_volume, "units")}
            description="Combined demand across active opportunities"
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Estimated revenue"
            value={<Money centimes={data.kpis.estimated_revenue_centimes} />}
            description="Potential value if current demand is won"
            icon={<CircleDollarSign className="h-5 w-5" />}
            tone="positive"
          />
        </StaggerItem>
      </StaggerGrid>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Qualified demand by product</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  Active volume available in your service areas
                </p>
              </div>
              <StatusBadge label="Live demand signal" tone="info" />
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <>
                <div
                  className="h-72"
                  role="img"
                  aria-label="Bar chart comparing active supplier demand by product"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 12, right: 8 }}>
                      <CartesianGrid
                        stroke="var(--color-border)"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        width={36}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString("en-MA")} units`,
                          "Demand",
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          borderColor: "var(--color-border)",
                        }}
                      />
                      <Bar
                        dataKey="quantity"
                        fill="var(--color-brand-500)"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={72}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 text-sm text-foreground-muted">
                  The largest active request is{" "}
                  {formatQuantity(
                    Math.max(
                      ...opportunities.map((item) => item.total_quantity),
                    ),
                    "units",
                  )}
                  .
                </p>
              </>
            ) : (
              <EmptyState
                title="No active demand yet"
                description="New aggregated merchant demand will appear here when it matches your catalog."
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-brand-200">
          <div className="bg-primary-subtle p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-surface text-primary shadow-sm">
              <Truck aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-5 text-sm font-semibold text-primary">
              Consolidated delivery
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-950">
              One route, three qualified shops
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Grouped demand can reduce delivery work while creating a larger,
              predictable order.
            </p>
          </div>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-foreground-muted">
                  Top opportunity
                </dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-foreground">
                  55 bottles
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-foreground-muted">
                  Area
                </dt>
                <dd className="mt-1 text-xl font-bold text-foreground">
                  Berrechid
                </dd>
              </div>
            </dl>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                navigate(
                  `/supplier/opportunities/${opportunities[0]?.opportunity_id ?? "opportunity-oil-001"}`,
                )
              }
            >
              Prepare a wholesale quote
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Latest opportunities
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Demand is aggregated and safe to review.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/supplier/opportunities")}
          >
            View all
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {opportunities.slice(0, 2).map((opportunity) => (
            <OpportunitySummary
              key={opportunity.opportunity_id}
              opportunity={opportunity}
              action={
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    navigate(
                      `/supplier/opportunities/${opportunity.opportunity_id}`,
                    )
                  }
                >
                  Review and quote
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
      </section>
    </PageMotion>
  );
}

export function SupplierOpportunitiesPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const opportunities = usePreviewQuery(
    ["supplier", "opportunities"],
    idToken,
    getSupplierOpportunities,
    { items: demoSupplierOpportunities },
  );

  if (opportunities.isPending && idToken) {
    return <LoadingPanel label="Loading supplier opportunities" />;
  }

  if (opportunities.isError) {
    return (
      <ErrorPanel
        title="Demand opportunities are unavailable"
        retry={() => void opportunities.refetch()}
      />
    );
  }

  const items = opportunities.data?.items ?? [];

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Supplier workspace"
        title="Demand opportunities"
        description="Review qualified group demand by product and coarse service area. Merchant identities and private financial data stay hidden."
      />
      <PreviewNotice live={Boolean(idToken)} />

      {items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Open opportunities"
              value={items.filter((item) => item.status === "ACTIVE").length}
              description="Ready for a supplier response"
              icon={<BadgeDollarSign className="h-5 w-5" />}
            />
            <MetricCard
              label="Combined volume"
              value={formatQuantity(
                items.reduce((sum, item) => sum + item.total_quantity, 0),
                "units",
              )}
              description="Demand across visible opportunities"
              icon={<Boxes className="h-5 w-5" />}
            />
            <MetricCard
              label="Participating shops"
              value={items.reduce((sum, item) => sum + item.merchant_count, 0)}
              description="Only aggregated counts are shared"
              icon={<UsersRound className="h-5 w-5" />}
            />
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4 text-right">Demand</th>
                    <th className="px-6 py-4">Area</th>
                    <th className="px-6 py-4 text-right">Merchants</th>
                    <th className="px-6 py-4">Needed by</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((opportunity) => (
                    <tr
                      key={opportunity.opportunity_id}
                      className="transition-colors hover:bg-surface-subtle"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-primary">
                            <PackageCheck
                              aria-hidden="true"
                              className="h-5 w-5"
                            />
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">
                              {productName(opportunity.product_id)}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {opportunity.product_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-semibold tabular-nums text-foreground">
                        {formatQuantity(
                          opportunity.total_quantity,
                          opportunity.unit,
                        )}
                      </td>
                      <td className="px-6 py-5 text-foreground-muted">
                        {opportunity.coarse_area}
                      </td>
                      <td className="px-6 py-5 text-right tabular-nums text-foreground">
                        {opportunity.merchant_count}
                      </td>
                      <td className="px-6 py-5 text-foreground-muted">
                        {formatDate(opportunity.needed_by)}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge
                          label={titleCase(opportunity.status)}
                          tone={statusTone(opportunity.status)}
                        />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/supplier/opportunities/${opportunity.opportunity_id}`,
                            )
                          }
                        >
                          Review
                          <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <EmptyState
          title="No qualified demand yet"
          description="New group demand matching your service area and catalog will appear here."
          icon={<BadgeDollarSign className="h-6 w-6" />}
          action={
            <Button
              variant="outline"
              onClick={() => navigate("/supplier/catalog")}
            >
              Review catalog
            </Button>
          }
        />
      )}
    </PageMotion>
  );
}

export function SupplierOpportunityDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { opportunityId = "" } = useParams();
  const { idToken } = useAuth();
  const opportunities = usePreviewQuery(
    ["supplier", "opportunities"],
    idToken,
    getSupplierOpportunities,
    { items: demoSupplierOpportunities },
  );
  const catalog = usePreviewQuery(
    ["supplier", "catalog"],
    idToken,
    getSupplierCatalog,
    demoSupplierCatalog,
  );

  const opportunity = opportunities.data?.items.find(
    (item) => item.opportunity_id === opportunityId,
  );
  const matchingCatalog = useMemo(
    () =>
      (catalog.data?.items ?? []).filter(
        (item) => item.product_id === opportunity?.product_id,
      ),
    [catalog.data, opportunity?.product_id],
  );

  const [catalogItemId, setCatalogItemId] = useState("");
  const selectedCatalog =
    matchingCatalog.find((item) => item.catalog_item_id === catalogItemId) ??
    matchingCatalog[0];
  const [unitPriceMad, setUnitPriceMad] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [formError, setFormError] = useState("");
  const [submittedOffer, setSubmittedOffer] = useState<Offer | null>(null);

  const selectedPriceCentimes =
    unitPriceMad.trim() === ""
      ? (selectedCatalog?.unit_price_centimes ?? 0)
      : Math.round(Number(unitPriceMad) * 100);
  const selectedMinimum =
    minimumQuantity.trim() === ""
      ? (selectedCatalog?.minimum_quantity ?? 0)
      : Number(minimumQuantity);
  const estimatedRevenue =
    selectedPriceCentimes * (opportunity?.total_quantity ?? 0);

  const offerMutation = useMutation({
    mutationFn: async (request: CreateSupplierOfferRequest) => {
      if (idToken) return createSupplierOffer(request, idToken);

      const item =
        matchingCatalog.find(
          (catalogItem) =>
            catalogItem.catalog_item_id === request.catalog_item_id,
        ) ?? selectedCatalog;
      const requestedQuantity = opportunity?.total_quantity ?? 0;
      const productCost = request.unit_price_centimes * requestedQuantity;
      return {
        offer_id: `preview-offer-${Date.now()}`,
        organization_id: "supplier-atlas",
        procurement_need_id: request.opportunity_id,
        supplier_organization_id: "supplier-atlas",
        catalog_item_id: request.catalog_item_id,
        product_id: opportunity?.product_id ?? "cooking-oil-1l",
        unit: opportunity?.unit ?? "BOTTLE",
        requested_quantity: requestedQuantity,
        unit_price_centimes: request.unit_price_centimes,
        minimum_quantity: request.minimum_quantity,
        delivery_fee_centimes: item?.delivery_fee_centimes ?? 0,
        delivery_days: item?.delivery_days ?? 1,
        product_cost_centimes: productCost,
        landed_cost_centimes: productCost + (item?.delivery_fee_centimes ?? 0),
        landed_unit_cost_centimes: request.unit_price_centimes,
        expected_unit_margin_centimes: null,
        eligible_alone: true,
        affordable: true,
        status: "AVAILABLE_NOW" as const,
        explanation:
          "Preview quote prepared for the aggregated merchant demand.",
        rejection_reasons: [],
      };
    },
    onSuccess: (offer) => {
      setSubmittedOffer(offer);
      setFormError("");
      void queryClient.invalidateQueries({
        queryKey: ["supplier", "opportunities"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["supplier", "dashboard"],
      });
    },
  });

  if ((opportunities.isPending || catalog.isPending) && idToken) {
    return <LoadingPanel label="Loading opportunity details" />;
  }

  if (opportunities.isError || catalog.isError) {
    return (
      <ErrorPanel
        title="Opportunity details are unavailable"
        retry={() => {
          void opportunities.refetch();
          void catalog.refetch();
        }}
      />
    );
  }

  if (!opportunity) {
    return (
      <EmptyState
        title="Opportunity not found"
        description="This opportunity may have closed or it does not belong to the current supplier."
        icon={<TriangleAlert className="h-6 w-6" />}
        action={
          <Button onClick={() => navigate("/supplier/opportunities")}>
            Back to opportunities
          </Button>
        }
      />
    );
  }

  const submitOffer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!selectedCatalog) {
      setFormError("Add a matching catalog item before submitting this quote.");
      return;
    }
    if (!Number.isFinite(selectedPriceCentimes) || selectedPriceCentimes <= 0) {
      setFormError("Enter a valid unit price greater than 0 MAD.");
      return;
    }
    if (!Number.isFinite(selectedMinimum) || selectedMinimum <= 0) {
      setFormError("Enter a valid minimum quantity.");
      return;
    }

    offerMutation.mutate({
      opportunity_id: opportunity.opportunity_id,
      catalog_item_id: selectedCatalog.catalog_item_id,
      unit_price_centimes: selectedPriceCentimes,
      minimum_quantity: selectedMinimum,
    });
  };

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Qualified demand"
        title={productName(opportunity.product_id)}
        description={`${formatQuantity(opportunity.total_quantity, opportunity.unit)} requested by ${opportunity.merchant_count} anonymized businesses in ${opportunity.coarse_area}.`}
        breadcrumbs={[
          { label: "Opportunities", href: "/supplier/opportunities" },
          { label: productName(opportunity.product_id) },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/supplier/opportunities")}
          >
            Back to opportunities
          </Button>
        }
      />
      <PreviewNotice live={Boolean(idToken)} />

      {submittedOffer ? (
        <Card
          className="border-emerald-200 bg-success-subtle"
          role="status"
          aria-live="polite"
        >
          <CardContent className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface text-success">
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Wholesale quote submitted
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Your offer of{" "}
                  <Money centimes={submittedOffer.unit_price_centimes} /> per{" "}
                  {opportunity.unit.toLowerCase()} is now linked to this
                  opportunity.
                </p>
              </div>
            </div>
            <StatusBadge label="Quote submitted" tone="confirmed" />
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Qualified demand summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-6">
                <div>
                  <dt className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
                    <Boxes aria-hidden="true" className="h-4 w-4" />
                    Total demand
                  </dt>
                  <dd className="mt-2 text-xl font-bold tabular-nums text-foreground">
                    {formatQuantity(
                      opportunity.total_quantity,
                      opportunity.unit,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
                    <UsersRound aria-hidden="true" className="h-4 w-4" />
                    Businesses
                  </dt>
                  <dd className="mt-2 text-xl font-bold tabular-nums text-foreground">
                    {opportunity.merchant_count}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
                    <MapPin aria-hidden="true" className="h-4 w-4" />
                    Service area
                  </dt>
                  <dd className="mt-2 font-semibold text-foreground">
                    {opportunity.coarse_area}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
                    <CalendarClock aria-hidden="true" className="h-4 w-4" />
                    Needed by
                  </dt>
                  <dd className="mt-2 font-semibold text-foreground">
                    {formatDate(opportunity.needed_by)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-brand-200 bg-primary-subtle/50">
            <CardContent>
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface text-primary">
                  <Building2 aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-brand-950">
                    Merchant privacy is protected
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    You see product demand, a coarse area, and the number of
                    participants. Individual sales, cash, and merchant
                    identities remain private.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prepare your wholesale quote</CardTitle>
            <p className="text-sm text-foreground-muted">
              Use a matching catalog item and set the price and minimum quantity
              you can honor.
            </p>
          </CardHeader>
          <CardContent>
            {matchingCatalog.length ? (
              <form className="space-y-5" onSubmit={submitOffer}>
                <div>
                  <label
                    htmlFor="quote-catalog-item"
                    className="mb-2 block text-sm font-semibold text-foreground"
                  >
                    Catalog item
                  </label>
                  <select
                    id="quote-catalog-item"
                    className={fieldClassName}
                    value={
                      catalogItemId || selectedCatalog?.catalog_item_id || ""
                    }
                    onChange={(event) => {
                      setCatalogItemId(event.target.value);
                      setUnitPriceMad("");
                      setMinimumQuantity("");
                    }}
                  >
                    {matchingCatalog.map((item) => (
                      <option
                        key={item.catalog_item_id}
                        value={item.catalog_item_id}
                      >
                        {item.supplier_sku} ·{" "}
                        {formatMAD(item.unit_price_centimes)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="quote-price"
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Unit price (MAD)
                    </label>
                    <input
                      id="quote-price"
                      className={fieldClassName}
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={
                        unitPriceMad ||
                        (
                          (selectedCatalog?.unit_price_centimes ?? 0) / 100
                        ).toFixed(2)
                      }
                      onChange={(event) => setUnitPriceMad(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quote-minimum"
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Minimum quantity
                    </label>
                    <input
                      id="quote-minimum"
                      className={fieldClassName}
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={
                        minimumQuantity ||
                        String(selectedCatalog?.minimum_quantity ?? "")
                      }
                      onChange={(event) =>
                        setMinimumQuantity(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 rounded-card border border-border bg-surface-subtle p-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-foreground-muted">
                      Estimated revenue
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                      <Money centimes={estimatedRevenue} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted">
                      Delivery condition
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {selectedCatalog?.delivery_days ?? 1} day delivery ·{" "}
                      {formatMAD(selectedCatalog?.delivery_fee_centimes ?? 0)}
                    </p>
                  </div>
                </div>

                {formError || offerMutation.isError ? (
                  <div
                    className="rounded-control border border-red-200 bg-danger-subtle p-4 text-sm text-danger"
                    role="alert"
                  >
                    {formError ||
                      (offerMutation.error instanceof Error
                        ? offerMutation.error.message
                        : "The quote could not be submitted. Please try again.")}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={offerMutation.isPending}
                >
                  <Send aria-hidden="true" className="h-4 w-4" />
                  Submit wholesale quote
                </Button>
                <p className="text-center text-xs leading-relaxed text-foreground-muted">
                  Submitting creates an offer. It does not reveal individual
                  merchant details.
                </p>
              </form>
            ) : (
              <EmptyState
                title="No matching catalog item"
                description={`Add ${productName(opportunity.product_id)} to your catalog before quoting this opportunity.`}
                icon={<PackagePlus className="h-6 w-6" />}
                action={
                  <Button onClick={() => navigate("/supplier/catalog")}>
                    Add catalog item
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </section>
    </PageMotion>
  );
}

export function SupplierCatalogPage() {
  const queryClient = useQueryClient();
  const { idToken } = useAuth();
  const catalog = usePreviewQuery(
    ["supplier", "catalog"],
    idToken,
    getSupplierCatalog,
    demoSupplierCatalog,
  );
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const catalogMutation = useMutation({
    mutationFn: async (request: CreateCatalogItemRequest) => {
      if (idToken) return createSupplierCatalogItem(request, idToken);
      return {
        catalog_item_id: `preview-catalog-${Date.now()}`,
        organization_id: "supplier-atlas",
        status: "ACTIVE" as const,
        ...request,
      } satisfies SupplierCatalogItem;
    },
    onSuccess: (item) => {
      setSuccessMessage(`${item.supplier_sku} was added to the catalog.`);
      setShowForm(false);
      setFormError("");
      void queryClient.invalidateQueries({
        queryKey: ["supplier", "catalog"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["supplier", "dashboard"],
      });
    },
  });

  if (catalog.isPending && idToken) {
    return <LoadingPanel label="Loading supplier catalog" />;
  }

  if (catalog.isError) {
    return (
      <ErrorPanel
        title="Supplier catalog is unavailable"
        retry={() => void catalog.refetch()}
      />
    );
  }

  const items = catalog.data?.items ?? [];

  const submitCatalogItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    const values = new FormData(event.currentTarget);
    const unitPrice = Math.round(Number(values.get("unit_price_mad")) * 100);
    const deliveryFee = Math.round(
      Number(values.get("delivery_fee_mad")) * 100,
    );
    const minimum = Number(values.get("minimum_quantity"));
    const available = Number(values.get("available_quantity"));
    const deliveryDays = Number(values.get("delivery_days"));
    const productId = String(values.get("product_id") ?? "").trim();
    const supplierSku = String(values.get("supplier_sku") ?? "").trim();
    const unit = String(values.get("unit") ?? "")
      .trim()
      .toUpperCase();

    if (
      !productId ||
      !supplierSku ||
      !unit ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !Number.isFinite(minimum) ||
      minimum <= 0 ||
      !Number.isFinite(available) ||
      available <= 0 ||
      !Number.isFinite(deliveryDays) ||
      deliveryDays <= 0 ||
      !Number.isFinite(deliveryFee) ||
      deliveryFee < 0
    ) {
      setFormError("Complete every field with a valid positive value.");
      return;
    }

    catalogMutation.mutate({
      product_id: productId,
      supplier_sku: supplierSku,
      unit,
      unit_price_centimes: unitPrice,
      minimum_quantity: minimum,
      available_quantity: available,
      delivery_fee_centimes: deliveryFee,
      delivery_days: deliveryDays,
      service_areas: ["Berrechid Center"],
    });
  };

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Supplier workspace"
        title="Product catalog"
        description="Manage the prices, minimum quantities, stock, and delivery conditions used for merchant comparisons."
        actions={
          <Button onClick={() => setShowForm((current) => !current)}>
            <PackagePlus aria-hidden="true" className="h-4 w-4" />
            {showForm ? "Close form" : "Add catalog item"}
          </Button>
        }
      />
      <PreviewNotice live={Boolean(idToken)} />

      {successMessage ? (
        <div
          className="flex items-center gap-3 rounded-control border border-emerald-200 bg-success-subtle p-4 text-sm font-medium text-success"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
          {successMessage}
        </div>
      ) : null}

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add a catalog item</CardTitle>
            <p className="text-sm text-foreground-muted">
              Prices are entered in MAD and sent to the API as integer centimes.
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
              onSubmit={submitCatalogItem}
            >
              <div>
                <label
                  htmlFor="catalog-product"
                  className="mb-2 block text-sm font-semibold"
                >
                  Product ID
                </label>
                <input
                  id="catalog-product"
                  name="product_id"
                  className={fieldClassName}
                  placeholder="cooking-oil-1l"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="catalog-sku"
                  className="mb-2 block text-sm font-semibold"
                >
                  Supplier SKU
                </label>
                <input
                  id="catalog-sku"
                  name="supplier_sku"
                  className={fieldClassName}
                  placeholder="ATL-OIL-1L"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="catalog-unit"
                  className="mb-2 block text-sm font-semibold"
                >
                  Unit
                </label>
                <select
                  id="catalog-unit"
                  name="unit"
                  className={fieldClassName}
                  defaultValue="BOTTLE"
                >
                  <option value="BOTTLE">Bottle</option>
                  <option value="BAG">Bag</option>
                  <option value="CARTON">Carton</option>
                  <option value="UNIT">Unit</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="catalog-price"
                  className="mb-2 block text-sm font-semibold"
                >
                  Unit price (MAD)
                </label>
                <input
                  id="catalog-price"
                  name="unit_price_mad"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={fieldClassName}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="catalog-minimum"
                  className="mb-2 block text-sm font-semibold"
                >
                  Minimum quantity
                </label>
                <input
                  id="catalog-minimum"
                  name="minimum_quantity"
                  type="number"
                  min="1"
                  step="1"
                  className={fieldClassName}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="catalog-available"
                  className="mb-2 block text-sm font-semibold"
                >
                  Available quantity
                </label>
                <input
                  id="catalog-available"
                  name="available_quantity"
                  type="number"
                  min="1"
                  step="1"
                  className={fieldClassName}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="catalog-delivery-fee"
                  className="mb-2 block text-sm font-semibold"
                >
                  Delivery fee (MAD)
                </label>
                <input
                  id="catalog-delivery-fee"
                  name="delivery_fee_mad"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  className={fieldClassName}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="catalog-delivery-days"
                  className="mb-2 block text-sm font-semibold"
                >
                  Delivery days
                </label>
                <input
                  id="catalog-delivery-days"
                  name="delivery_days"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="1"
                  className={fieldClassName}
                  required
                />
              </div>

              {formError || catalogMutation.isError ? (
                <div
                  className="rounded-control border border-red-200 bg-danger-subtle p-4 text-sm text-danger md:col-span-2 xl:col-span-4"
                  role="alert"
                >
                  {formError ||
                    (catalogMutation.error instanceof Error
                      ? catalogMutation.error.message
                      : "The catalog item could not be saved.")}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
                <Button type="submit" loading={catalogMutation.isPending}>
                  <PackagePlus aria-hidden="true" className="h-4 w-4" />
                  Save catalog item
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  disabled={catalogMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {items.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4 text-right">Unit price</th>
                  <th className="px-6 py-4 text-right">MOQ</th>
                  <th className="px-6 py-4 text-right">Available</th>
                  <th className="px-6 py-4">Delivery</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr
                    key={item.catalog_item_id}
                    className="transition-colors hover:bg-surface-subtle"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-primary">
                          <PackageCheck
                            aria-hidden="true"
                            className="h-5 w-5"
                          />
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">
                            {productName(item.product_id)}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {item.product_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-medium text-foreground">
                      {item.supplier_sku}
                    </td>
                    <td className="px-6 py-5 text-right font-semibold tabular-nums">
                      <Money centimes={item.unit_price_centimes} />
                    </td>
                    <td className="px-6 py-5 text-right tabular-nums">
                      {formatQuantity(item.minimum_quantity, item.unit)}
                    </td>
                    <td className="px-6 py-5 text-right tabular-nums">
                      {formatQuantity(item.available_quantity, item.unit)}
                    </td>
                    <td className="px-6 py-5 text-foreground-muted">
                      {item.delivery_days} day
                      {item.delivery_days === 1 ? "" : "s"} ·{" "}
                      {formatMAD(item.delivery_fee_centimes)}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge
                        label={titleCase(item.status)}
                        tone={
                          item.status === "ACTIVE" ? "confirmed" : "neutral"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Your catalog is empty"
          description="Add a product so MIZAN can match it with qualified merchant demand."
          icon={<PackagePlus className="h-6 w-6" />}
          action={
            <Button onClick={() => setShowForm(true)}>
              Add first catalog item
            </Button>
          }
        />
      )}
    </PageMotion>
  );
}
