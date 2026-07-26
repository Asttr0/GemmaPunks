import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  PiggyBank,
  Store,
  Truck,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../components/shared/EmptyState";
import { MetricCard } from "../../components/shared/MetricCard";
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
import { getGroupOrders, type GroupOrderListResponse } from "../../lib/api";
import { demoGroupOrder } from "../../lib/demo-data";
import { formatMAD, formatQuantity } from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";
import { useAuth } from "../auth/auth-context";

const previewGroupOrders: GroupOrderListResponse = {
  items: [demoGroupOrder],
};

function ImpactLoading() {
  return (
    <PageMotion>
      <PageHeader
        eyebrow="Demo result"
        title="Collective purchasing impact"
        description="Loading the business outcome."
      />
      <div className="h-72 animate-pulse rounded-showcase border border-border bg-surface-subtle motion-reduce:animate-none" />
      <div
        className="grid animate-pulse gap-4 motion-reduce:animate-none md:grid-cols-2 xl:grid-cols-4"
        aria-label="Loading impact metrics"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-card border border-border bg-surface-subtle"
          />
        ))}
      </div>
    </PageMotion>
  );
}

export function ImpactPage() {
  const navigate = useNavigate();
  const params = useParams<"groupOrderId" | "id">();
  const { idToken } = useAuth();
  const selectedGroupOrderId = params.groupOrderId ?? params.id;
  const groupOrders = usePreviewQuery(
    ["group-orders", "impact"],
    idToken,
    getGroupOrders,
    previewGroupOrders,
  );

  if (groupOrders.isPending) {
    return <ImpactLoading />;
  }

  if (groupOrders.isError) {
    return (
      <PageMotion>
        <PageHeader
          eyebrow="Demo result"
          title="Collective purchasing impact"
          description="Review the final business result of the collective order."
        />
        <EmptyState
          title="The impact result is unavailable"
          description="The backend could not return the collective order. Check the API connection and try again."
          icon={<AlertTriangle className="h-6 w-6" />}
          action={
            <Button onClick={() => void groupOrders.refetch()}>
              Try again
            </Button>
          }
        />
      </PageMotion>
    );
  }

  const items = groupOrders.data?.items ?? [];
  const result =
    items.find(
      (item) => item.group_order.group_order_id === selectedGroupOrderId,
    ) ??
    items[0] ??
    null;

  if (!result) {
    return (
      <PageMotion>
        <PageHeader
          eyebrow="Demo result"
          title="Collective purchasing impact"
          description="Review the final business result of the collective order."
        />
        <EmptyState
          title="No collective-order result yet"
          description="Join and approve a collective order before opening the final impact view."
          icon={<UsersRound className="h-6 w-6" />}
          action={
            <Button onClick={() => navigate("/merchant/group-orders")}>
              Open group orders
            </Button>
          }
        />
      </PageMotion>
    );
  }

  const { group_order: order, member } = result;
  const approved = member.status === "APPROVED";
  const targetReached = order.total_quantity >= order.minimum_quantity;
  const extraQuantity = Math.max(
    0,
    order.total_quantity - order.minimum_quantity,
  );
  const nearbyQuantity = Math.max(0, order.total_quantity - member.quantity);

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Demo result"
        title="Collective purchasing impact"
        description={
          approved
            ? "The merchant approved this participation. Here is the confirmed expected business impact."
            : "This is the projected impact. The merchant must approve participation before the order becomes consequential."
        }
        breadcrumbs={[
          { label: "Merchant", href: "/merchant/dashboard" },
          { label: "Group orders", href: "/merchant/group-orders" },
          { label: order.group_order_id },
          { label: "Impact" },
        ]}
        actions={
          <StatusBadge
            label={approved ? "Participation approved" : "Awaiting approval"}
            tone={approved ? "confirmed" : "pending"}
          />
        }
      />

      <PreviewNotice live={Boolean(idToken)} />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-showcase border border-brand-200 bg-gradient-to-br from-brand-950 via-brand-700 to-brand-500 p-7 text-white shadow-raised sm:p-10"
        aria-labelledby="impact-total-heading"
      >
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative grid gap-8 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold text-brand-100">
              {approved ? "Expected total saving" : "Projected total saving"}
            </p>
            <h2
              id="impact-total-heading"
              className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            >
              <Money centimes={result.total_savings_centimes} />
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85">
              One merchant needed {formatQuantity(member.quantity, order.unit)}.
              Nearby demand unlocked the supplier&apos;s wholesale price without
              revealing another merchant&apos;s private financial information.
            </p>
          </div>
          <div className="rounded-card border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              Reorder ready before stockout
            </p>
            <p className="mt-3 text-lg font-semibold">
              Cooking oil stays available
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              Cooking oil can be reordered before the four-day forecast ends.
            </p>
          </div>
        </div>
      </motion.section>

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Impact metrics"
      >
        <MetricCard
          label="Stockout prevented"
          value="1 product"
          description="Cooking oil 1L"
          icon={<PackageCheck className="h-5 w-5" />}
          tone="positive"
        />
        <MetricCard
          label="Unit price"
          value={`${formatMAD(result.original_unit_price_centimes)} → ${formatMAD(
            result.collective_unit_price_centimes,
          )}`}
          description="Before and after collective purchasing"
          icon={<PiggyBank className="h-5 w-5" />}
          tone="positive"
        />
        <MetricCard
          label="Product saving"
          value={<Money centimes={member.product_saving_centimes} />}
          description="Lower price across the merchant quantity"
          icon={<Store className="h-5 w-5" />}
          tone="positive"
        />
        <MetricCard
          label="Delivery saving"
          value={<Money centimes={member.delivery_saving_centimes} />}
          description="The consolidated delivery removes this cost"
          icon={<Truck className="h-5 w-5" />}
          tone="positive"
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>How the network unlocked the offer</CardTitle>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                Demand was combined only at the product, quantity, area, and
                deadline level.
              </p>
            </div>
            <StatusBadge
              label={
                targetReached
                  ? `Minimum exceeded by ${formatQuantity(extraQuantity, order.unit)}`
                  : "Minimum not reached"
              }
              tone={targetReached ? "confirmed" : "pending"}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
            <div className="rounded-control bg-primary-subtle p-5">
              <p className="text-sm font-medium text-foreground-muted">
                Your business
              </p>
              <p className="mt-2 text-xl font-bold tabular-nums text-brand-950">
                {formatQuantity(member.quantity, order.unit)}
              </p>
            </div>
            <span className="hidden text-2xl font-semibold text-primary lg:block">
              +
            </span>
            <div className="rounded-control bg-surface-subtle p-5">
              <p className="text-sm font-medium text-foreground-muted">
                Nearby compatible demand
              </p>
              <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
                {formatQuantity(nearbyQuantity, order.unit)}
              </p>
            </div>
            <ArrowRight
              aria-hidden="true"
              className="hidden h-6 w-6 text-primary lg:block"
            />
            <div className="rounded-control border border-emerald-200 bg-success-subtle p-5">
              <p className="text-sm font-medium text-success">
                Collective demand
              </p>
              <p className="mt-2 text-xl font-bold tabular-nums text-success">
                {formatQuantity(order.total_quantity, order.unit)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">
                Supplier minimum:{" "}
                {formatQuantity(order.minimum_quantity, order.unit)}
              </span>
              <span className="font-semibold text-success">
                {order.participant_count} businesses together
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-surface-subtle"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                targetReached
                  ? 100
                  : Math.round(
                      (order.total_quantity / order.minimum_quantity) * 100,
                    )
              }
              aria-valuetext={`${formatQuantity(
                order.total_quantity,
                order.unit,
              )} combined against a minimum of ${formatQuantity(
                order.minimum_quantity,
                order.unit,
              )}`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    100,
                    (order.total_quantity / order.minimum_quantity) * 100,
                  )}%`,
                }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="h-full rounded-full bg-success"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand-200 bg-primary-subtle">
        <CardContent className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <blockquote className="max-w-3xl">
            <p className="text-xl font-semibold leading-relaxed text-brand-950 sm:text-2xl">
              “One small shop has little negotiating power. A network of small
              shops has a market.”
            </p>
          </blockquote>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/merchant/dashboard")}
            >
              Merchant dashboard
            </Button>
            <Button
              onClick={() =>
                navigate(`/merchant/group-orders/${order.group_order_id}`)
              }
            >
              {approved ? "Review order" : "Review and approve"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageMotion>
  );
}
