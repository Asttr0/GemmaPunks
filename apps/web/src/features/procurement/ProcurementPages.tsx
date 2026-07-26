import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Boxes,
  CalendarClock,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Truck,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../components/shared/EmptyState";
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
  compareOffers,
  getProcurementNeeds,
  proposeGroupOrder,
} from "../../lib/api";
import type { Offer, ProcurementNeed } from "../../lib/api";
import {
  demoGroupOrder,
  demoOfferComparison,
  demoProcurementNeed,
} from "../../lib/demo-data";
import { formatDate, formatQuantity, titleCase } from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";
import { useAuth } from "../auth/auth-context";

function NeedCard({
  need,
  onOpen,
}: {
  need: ProcurementNeed;
  onOpen: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-warning" />
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-warning-subtle text-warning">
              <PackageSearch className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {titleCase(need.product_id)}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                {need.coarse_area} · {need.sales_history_days} days of sales
                history
              </p>
            </div>
          </div>
          <StatusBadge label={titleCase(need.status)} tone="pending" />
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-foreground-muted">
              Stock left
            </dt>
            <dd className="mt-1 text-xl font-bold tabular-nums">
              {formatQuantity(need.stock_on_hand ?? 0, need.unit)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-foreground-muted">
              Days remaining
            </dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-warning">
              {need.days_remaining ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-foreground-muted">
              Safe reorder
            </dt>
            <dd className="mt-1 text-xl font-bold tabular-nums">
              {formatQuantity(need.quantity_needed, need.unit)}
            </dd>
          </div>
        </dl>
        <Button className="mt-6 w-full" onClick={onOpen}>
          Open purchasing decision
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProcurementListPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const needs = usePreviewQuery(
    ["merchant", "procurement-needs"],
    idToken,
    getProcurementNeeds,
    [demoProcurementNeed],
  );

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Purchasing intelligence"
        title="Procurement needs"
        description="Restocking recommendations based on confirmed stock, sales rate, and safe quantities."
      />
      <PreviewNotice live={Boolean(idToken)} />
      {needs.data?.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {needs.data.map((need) => (
            <NeedCard
              key={need.need_id}
              need={need}
              onOpen={() => navigate(`/merchant/procurement/${need.need_id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No purchasing needs"
          description="MIZAN has not detected an urgent restocking requirement."
        />
      )}
    </PageMotion>
  );
}

function OfferCard({
  offer,
  recommended,
}: {
  offer: Offer;
  recommended?: boolean;
}) {
  return (
    <motion.article
      layout
      className={`relative rounded-card border bg-surface p-5 ${
        recommended
          ? "border-primary shadow-[0_12px_30px_rgba(0,119,182,0.12)]"
          : offer.status === "GROUP_ONLY"
            ? "border-violet-200"
            : "border-border"
      }`}
    >
      {recommended ? (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-badge bg-primary px-3 py-1 text-xs font-semibold text-white">
          <BadgeCheck className="h-3.5 w-3.5" />
          Best individual offer
        </span>
      ) : null}
      {offer.status === "GROUP_ONLY" ? (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-badge bg-ai px-3 py-1 text-xs font-semibold text-white">
          <UsersRound className="h-3.5 w-3.5" />
          Collective opportunity
        </span>
      ) : null}
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {titleCase(offer.supplier_organization_id)}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            <Money centimes={offer.unit_price_centimes} />
          </p>
          <p className="text-sm text-foreground-muted">
            per {offer.unit.toLowerCase()}
          </p>
        </div>
        <StatusBadge
          label={offer.status === "GROUP_ONLY" ? "Group only" : "Available"}
          tone={offer.status === "GROUP_ONLY" ? "draft" : "confirmed"}
        />
      </div>
      <dl className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2 text-foreground-muted">
            <Boxes className="h-4 w-4" /> Minimum quantity
          </dt>
          <dd className="font-semibold tabular-nums">
            {offer.minimum_quantity}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2 text-foreground-muted">
            <Truck className="h-4 w-4" /> Delivery
          </dt>
          <dd className="font-semibold">
            <Money centimes={offer.delivery_fee_centimes} /> ·{" "}
            {offer.delivery_days}d
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2 text-foreground-muted">
            <Banknote className="h-4 w-4" /> Landed total
          </dt>
          <dd className="font-semibold">
            <Money centimes={offer.landed_cost_centimes} />
          </dd>
        </div>
      </dl>
      <p className="mt-5 rounded-control bg-surface-subtle p-3 text-sm leading-relaxed text-foreground-muted">
        {offer.explanation}
      </p>
    </motion.article>
  );
}

export function ProcurementCockpitPage() {
  const { needId = "need-oil-001" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { idToken } = useAuth();
  const needs = usePreviewQuery(
    ["merchant", "procurement-needs"],
    idToken,
    getProcurementNeeds,
    [demoProcurementNeed],
  );
  const comparison = usePreviewQuery(
    ["merchant", "offer-comparison", needId],
    idToken,
    (token) =>
      compareOffers(
        {
          procurement_need_id: needId,
          quantity: 20,
        },
        token,
      ),
    demoOfferComparison,
  );

  const need =
    needs.data?.find((item) => item.need_id === needId) ?? demoProcurementNeed;
  const available = comparison.data?.available_now ?? [];
  const groupOffer = comparison.data?.group_opportunity;
  const recommended = [...available].sort(
    (left, right) => left.landed_cost_centimes - right.landed_cost_centimes,
  )[0];

  const propose = useMutation({
    mutationFn: async () => {
      if (!groupOffer) throw new Error("No collective offer is available.");
      if (!idToken) {
        await new Promise((resolve) => window.setTimeout(resolve, 600));
        return demoGroupOrder;
      }
      return proposeGroupOrder(
        {
          procurement_need_id: need.need_id,
          product_id: need.product_id,
          quantity: need.quantity_needed,
          supplier_organization_id: groupOffer.supplier_organization_id,
          supplier_catalog_item_id: groupOffer.catalog_item_id,
        },
        idToken,
      );
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["merchant", "group-orders"],
      });
      navigate(`/merchant/group-orders/${result.group_order.group_order_id}`);
    },
  });

  return (
    <PageMotion>
      <PageHeader
        breadcrumbs={[
          { label: "Procurement", href: "/merchant/procurement" },
          { label: "Cooking oil decision" },
        ]}
        eyebrow="Explainable purchasing decision"
        title="Prevent the cooking-oil stockout"
        description="MIZAN separates the forecast, affordability, supplier terms, and collective opportunity so you can verify every number."
      />
      <PreviewNotice live={Boolean(idToken)} />

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-amber-200">
          <div className="bg-warning-subtle p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-card bg-surface text-warning shadow-sm">
                  <AlertTriangle className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-warning">
                    Stockout forecast
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-foreground">
                    {need.days_remaining} days remaining
                  </h2>
                </div>
              </div>
              <StatusBadge label="Action needed" tone="pending" />
            </div>
          </div>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-foreground-muted">Stock on hand</dt>
                <dd className="mt-1 text-xl font-bold">
                  {formatQuantity(need.stock_on_hand ?? 0, need.unit)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground-muted">
                  Daily sales rate
                </dt>
                <dd className="mt-1 text-xl font-bold">
                  {formatQuantity(need.average_daily_sales ?? 0, need.unit)}/day
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground-muted">
                  Recommended reorder
                </dt>
                <dd className="mt-1 text-xl font-bold text-primary">
                  {formatQuantity(need.quantity_needed, need.unit)}
                </dd>
              </div>
            </dl>
            <p className="mt-5 rounded-control bg-surface-subtle p-4 text-sm leading-relaxed text-foreground-muted">
              {need.explanation}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decision deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-card bg-primary-subtle text-primary">
                <CalendarClock className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-foreground-muted">Order needed by</p>
                <p className="mt-1 text-xl font-bold">
                  {formatDate(need.needed_by)}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
              The forecast uses confirmed records only. {need.uncertainty_note}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">
              Three commercial paths
            </p>
            <h2 className="mt-1 text-2xl font-bold text-foreground">
              Compare supplier offers
            </h2>
          </div>
          <p className="text-sm text-foreground-muted">
            Ranking uses landed cost, MOQ, delivery, and affordability.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {available.map((offer) => (
            <OfferCard
              key={offer.offer_id}
              offer={offer}
              recommended={offer.offer_id === recommended?.offer_id}
            />
          ))}
          {groupOffer ? <OfferCard offer={groupOffer} /> : null}
        </div>
      </section>

      {groupOffer ? (
        <Card className="overflow-hidden border-violet-200">
          <div className="bg-ai-subtle p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-card bg-ai text-white">
                  <UsersRound className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ai">
                    Collective opportunity found
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-foreground">
                    Two nearby businesses add 35 compatible bottles
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
                    Your 20 bottles become a 55-bottle order. This passes the
                    supplier’s 50-bottle minimum without revealing private
                    business data.
                  </p>
                </div>
              </div>
              <div className="rounded-card bg-surface px-5 py-4 text-right shadow-sm">
                <p className="text-xs text-foreground-muted">
                  Collective price
                </p>
                <p className="mt-1 text-2xl font-bold text-ai">
                  <Money centimes={groupOffer.unit_price_centimes} />
                </p>
              </div>
            </div>
          </div>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-foreground-muted">
              <ShieldCheck className="h-4 w-4 text-success" />
              You will review savings, join, and approve separately.
            </p>
            <Button
              variant="ai"
              loading={propose.isPending}
              onClick={() => propose.mutate()}
            >
              <Sparkles className="h-4 w-4" />
              Build collective proposal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </PageMotion>
  );
}
