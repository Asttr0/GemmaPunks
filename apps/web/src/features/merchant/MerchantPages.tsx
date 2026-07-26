import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
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
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { useAuth } from "../auth/auth-context";
import {
  demoInventory,
  demoMerchantDashboard,
  demoSalesTrend,
  demoTransactions,
} from "../../lib/demo-data";
import {
  getInventory,
  getMerchantDashboard,
  getTransactions,
} from "../../lib/api";
import { formatDateTime, formatQuantity, titleCase } from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";

function ErrorPanel({ title, retry }: { title: string; retry: () => void }) {
  return (
    <EmptyState
      title={title}
      description="The backend did not return this information. Check the API and try again."
      icon={<AlertTriangle className="h-6 w-6" />}
      action={<Button onClick={retry}>Try again</Button>}
    />
  );
}

export function MerchantDashboardPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const dashboard = usePreviewQuery(
    ["merchant", "dashboard"],
    idToken,
    getMerchantDashboard,
    demoMerchantDashboard,
  );
  const transactions = usePreviewQuery(
    ["merchant", "transactions", "recent"],
    idToken,
    getTransactions,
    demoTransactions,
  );

  const trend = useMemo(() => {
    if (!idToken) return demoSalesTrend;

    const grouped = new Map<
      string,
      { day: string; sales: number; profit: number }
    >();
    for (const item of transactions.data?.items ?? []) {
      const day = item.occurred_at
        ? new Intl.DateTimeFormat("en-MA", {
            day: "2-digit",
            month: "short",
          }).format(new Date(item.occurred_at))
        : "Today";
      const current = grouped.get(day) ?? { day, sales: 0, profit: 0 };
      const mad = item.total_centimes / 100;
      if (item.kind === "sale") {
        current.sales += mad;
        current.profit += mad;
      } else {
        current.profit -= mad;
      }
      grouped.set(day, current);
    }
    return [...grouped.values()].slice(-7);
  }, [idToken, transactions.data]);

  if (dashboard.isError) {
    return (
      <ErrorPanel
        title="Merchant dashboard is unavailable"
        retry={() => void dashboard.refetch()}
      />
    );
  }

  const data = dashboard.data ?? demoMerchantDashboard;
  const recent = transactions.data?.items.slice(0, 4) ?? [];

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Merchant workspace"
        title="Good morning, Hassan"
        description="Your business is stable today. One inventory risk needs your attention before it becomes a stockout."
        actions={
          <Button onClick={() => navigate("/merchant/evidence/new")}>
            <ReceiptText className="h-4 w-4" />
            Add business evidence
          </Button>
        }
      />
      <PreviewNotice live={Boolean(idToken)} />

      <StaggerGrid className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <MetricCard
            label="Sales"
            value={<Money centimes={data.kpis.sales_centimes} />}
            description="Confirmed business sales"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Expenses"
            value={<Money centimes={data.kpis.expenses_centimes} />}
            description="Purchases and operating costs"
            icon={<ReceiptText className="h-5 w-5" />}
            tone="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Estimated profit"
            value={<Money centimes={data.kpis.estimated_profit_centimes} />}
            description="Sales minus confirmed expenses"
            icon={<CircleDollarSign className="h-5 w-5" />}
            tone="positive"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Available cash"
            value={<Money centimes={data.kpis.available_cash_centimes} />}
            description="Available for a safe reorder"
            icon={<WalletCards className="h-5 w-5" />}
          />
        </StaggerItem>
      </StaggerGrid>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Sales and profit trend</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  Confirmed records only · last seven available days
                </p>
              </div>
              <StatusBadge label="Business stable" tone="confirmed" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72" aria-label="Sales and profit trend chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0077B6" stopOpacity={0.3} />
                      <stop
                        offset="100%"
                        stopColor="#0077B6"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(value) =>
                      `${Math.round(Number(value) / 1000)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString("en-MA")} MAD`,
                      name === "sales" ? "Sales" : "Profit",
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#CBD5E1",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#0077B6"
                    strokeWidth={3}
                    fill="url(#sales-fill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#00B4D8"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-amber-200">
          <div className="bg-warning-subtle p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-surface text-warning shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="mt-5 text-sm font-semibold text-warning">
              Action recommended
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Cooking oil may run out in 4 days
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Current stock is 14 bottles. A safe reorder of 20 bottles protects
              your sales while staying inside available cash.
            </p>
          </div>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-foreground-muted">
                  Current stock
                </dt>
                <dd className="mt-1 text-xl font-bold tabular-nums">
                  14 bottles
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-foreground-muted">
                  Reorder
                </dt>
                <dd className="mt-1 text-xl font-bold tabular-nums">
                  20 bottles
                </dd>
              </div>
            </dl>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                navigate(
                  `/merchant/procurement/${data.next_action?.target_id ?? "need-oil-001"}`,
                )
              }
            >
              Compare supplier offers
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Recent confirmed activity</CardTitle>
              <Button
                variant="ghost"
                onClick={() => navigate("/merchant/transactions")}
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-border">
              {recent.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-subtle text-primary">
                      {item.kind === "sale" ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <ReceiptText className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">
                        {titleCase(item.kind)}
                      </p>
                      <p className="text-sm text-foreground-muted">
                        {formatDateTime(item.occurred_at)}
                      </p>
                    </div>
                  </div>
                  <Money
                    centimes={item.total_centimes}
                    className="font-semibold text-foreground"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-card bg-primary-subtle text-primary">
                <Boxes className="h-8 w-8" />
              </span>
              <div>
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {data.inventory.product_count}
                </p>
                <p className="text-sm text-foreground-muted">
                  Tracked products
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-control border border-amber-200 bg-warning-subtle p-4">
              <p className="flex items-center gap-2 font-semibold text-warning">
                <AlertTriangle className="h-4 w-4" />
                {data.inventory.low_stock_count} product needs attention
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-5 w-full"
              onClick={() => navigate("/merchant/inventory")}
            >
              Open inventory
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageMotion>
  );
}

export function InventoryPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const inventory = usePreviewQuery(
    ["merchant", "inventory"],
    idToken,
    getInventory,
    demoInventory,
  );

  if (inventory.isError) {
    return (
      <ErrorPanel
        title="Inventory is unavailable"
        retry={() => void inventory.refetch()}
      />
    );
  }

  const items = inventory.data?.items ?? [];

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Merchant workspace"
        title="Inventory"
        description="See confirmed stock, risk levels, and the products that need a purchasing decision."
        actions={
          <Button onClick={() => navigate("/merchant/evidence/new")}>
            <ReceiptText className="h-4 w-4" />
            Add evidence
          </Button>
        }
      />
      <PreviewNotice live={Boolean(idToken)} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Threshold</th>
                <th className="px-6 py-4">Expected stockout</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr
                  key={item.product_id}
                  className={
                    item.low_stock
                      ? "bg-warning-subtle/60"
                      : "hover:bg-surface-subtle"
                  }
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-subtle text-primary">
                        <PackageCheck className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {item.product_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-semibold tabular-nums">
                    {formatQuantity(item.quantity_on_hand, item.unit)}
                  </td>
                  <td className="px-6 py-5 text-right tabular-nums text-foreground-muted">
                    {formatQuantity(item.low_stock_threshold, item.unit)}
                  </td>
                  <td className="px-6 py-5 text-sm text-foreground-muted">
                    {item.predicted_stockout_at
                      ? formatDateTime(item.predicted_stockout_at)
                      : "No risk predicted"}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge
                      label={titleCase(item.status)}
                      tone={item.low_stock ? "pending" : "confirmed"}
                    />
                  </td>
                  <td className="px-6 py-5 text-right">
                    {item.low_stock ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate("/merchant/procurement/need-oil-001")
                        }
                      >
                        Review reorder
                      </Button>
                    ) : (
                      <span className="text-sm text-foreground-muted">
                        Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageMotion>
  );
}

export function TransactionsPage() {
  const { idToken } = useAuth();
  const transactions = usePreviewQuery(
    ["merchant", "transactions"],
    idToken,
    getTransactions,
    demoTransactions,
  );

  if (transactions.isError) {
    return (
      <ErrorPanel
        title="Transactions are unavailable"
        retry={() => void transactions.refetch()}
      />
    );
  }

  const items = transactions.data?.items ?? [];

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Merchant workspace"
        title="Confirmed transactions"
        description="Only human-confirmed sales, purchases, and expenses appear here."
      />
      <PreviewNotice live={Boolean(idToken)} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Evidence</th>
                <th className="px-6 py-4 text-right">Lines</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-surface-subtle">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-subtle text-primary">
                        <ReceiptText className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{titleCase(item.kind)}</p>
                        <p className="text-xs text-foreground-muted">
                          {item.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-foreground-muted">
                    {formatDateTime(item.occurred_at)}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge
                      label={
                        item.ingestion_id ? "Evidence linked" : "Manual entry"
                      }
                      tone={item.ingestion_id ? "info" : "neutral"}
                    />
                  </td>
                  <td className="px-6 py-5 text-right tabular-nums">
                    {item.lines?.length ?? 0}
                  </td>
                  <td className="px-6 py-5 text-right font-semibold">
                    <Money centimes={item.total_centimes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageMotion>
  );
}
