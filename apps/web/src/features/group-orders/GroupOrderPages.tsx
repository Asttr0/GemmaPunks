import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ShieldCheck,
  Truck,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
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
  approveGroupOrder,
  getGroupOrders,
  joinGroupOrder,
} from "../../lib/api";
import { demoGroupOrder } from "../../lib/demo-data";
import { formatDateTime, formatQuantity, titleCase } from "../../lib/format";
import { usePreviewQuery } from "../../lib/use-preview-query";
import { useAuth } from "../auth/auth-context";

export function GroupOrdersListPage() {
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const orders = usePreviewQuery(
    ["merchant", "group-orders"],
    idToken,
    getGroupOrders,
    { items: [demoGroupOrder] },
  );

  return (
    <PageMotion>
      <PageHeader
        eyebrow="Collective purchasing"
        title="Group orders"
        description="Track collective proposals, your participation, and the approvals still required."
      />
      <PreviewNotice live={Boolean(idToken)} />
      {orders.data?.items.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {orders.data.items.map((order) => {
            const progress = Math.min(
              100,
              (order.group_order.total_quantity /
                order.group_order.minimum_quantity) *
                100,
            );
            return (
              <Card key={order.group_order.group_order_id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-card bg-ai-subtle text-ai">
                        <UsersRound className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {titleCase(order.group_order.product_id)}
                        </p>
                        <p className="mt-1 text-sm text-foreground-muted">
                          {order.group_order.coarse_area} ·{" "}
                          {order.group_order.participant_count} businesses
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      label={titleCase(order.member.status)}
                      tone={
                        order.member.status === "APPROVED"
                          ? "confirmed"
                          : order.member.status === "PENDING"
                            ? "pending"
                            : "info"
                      }
                    />
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-muted">
                        Supplier minimum
                      </span>
                      <span className="font-semibold tabular-nums">
                        {order.group_order.total_quantity} /{" "}
                        {order.group_order.minimum_quantity} units
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle">
                      <div
                        className="h-full rounded-full bg-ai"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between rounded-control bg-success-subtle p-4">
                    <span className="text-sm font-medium text-success">
                      Your expected saving
                    </span>
                    <Money
                      centimes={order.total_savings_centimes}
                      className="font-bold text-success"
                    />
                  </div>
                  <Button
                    className="mt-5 w-full"
                    onClick={() =>
                      navigate(
                        `/merchant/group-orders/${order.group_order.group_order_id}`,
                      )
                    }
                  >
                    Review participation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No group orders"
          description="Collective proposals will appear after a compatible supplier offer is found."
        />
      )}
    </PageMotion>
  );
}

export function GroupOrderDetailPage() {
  const { groupOrderId = "group-oil-001" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { idToken } = useAuth();
  const orders = usePreviewQuery(
    ["merchant", "group-orders"],
    idToken,
    getGroupOrders,
    { items: [demoGroupOrder] },
  );
  const initial =
    orders.data?.items.find(
      (item) => item.group_order.group_order_id === groupOrderId,
    ) ?? demoGroupOrder;
  const [previewStatus, setPreviewStatus] = useState(initial.member.status);
  const [readyToApprove, setReadyToApprove] = useState(false);
  const status = idToken ? initial.member.status : previewStatus;
  const order = initial.group_order;
  const member = initial.member;
  const progress = Math.min(
    100,
    (order.total_quantity / order.minimum_quantity) * 100,
  );

  const join = useMutation({
    mutationFn: async () => {
      if (!idToken) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        return { ...initial, member: { ...member, status: "JOINED" as const } };
      }
      return joinGroupOrder(groupOrderId, idToken);
    },
    onSuccess: async () => {
      setPreviewStatus("JOINED");
      setReadyToApprove(true);
      await queryClient.invalidateQueries({
        queryKey: ["merchant", "group-orders"],
      });
    },
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!idToken) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        return {
          ...initial,
          member: { ...member, status: "APPROVED" as const },
        };
      }
      return approveGroupOrder(groupOrderId, idToken, crypto.randomUUID());
    },
    onSuccess: async () => {
      setPreviewStatus("APPROVED");
      await queryClient.invalidateQueries({
        queryKey: ["merchant", "group-orders"],
      });
    },
  });

  if (status === "APPROVED") {
    return (
      <PageMotion>
        <PageHeader
          eyebrow="Participation approved"
          title="Collective order secured"
          description="Your 20-bottle participation is approved. The supplier now sees the consolidated commercial opportunity."
        />
        <Card className="overflow-hidden border-emerald-200">
          <div className="bg-success-subtle px-8 py-10 text-center">
            <motion.span
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-white"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.span>
            <p className="mt-6 text-sm font-semibold text-success">
              Total merchant saving
            </p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-2 text-5xl font-bold tracking-tight text-foreground"
            >
              <Money centimes={member.total_saving_centimes} />
            </motion.p>
            <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
              Product saving and delivery saving are now protected by an
              explicit human approval.
            </p>
          </div>
          <CardContent className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/demo/impact")}>
              Open final impact
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/supplier/dashboard")}
            >
              View supplier opportunity
            </Button>
          </CardContent>
        </Card>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <PageHeader
        breadcrumbs={[
          { label: "Group orders", href: "/merchant/group-orders" },
          { label: "Cooking oil collective" },
        ]}
        eyebrow="Private, explainable, independently approved"
        title="Review your collective order"
        description="Only the quantities required for this purchase are combined. No merchant sales or cash data is shared."
        actions={
          <StatusBadge
            label={
              status === "JOINED"
                ? "Joined · approval pending"
                : "Invitation open"
            }
            tone={status === "JOINED" ? "info" : "pending"}
          />
        }
      />
      <PreviewNotice live={Boolean(idToken)} />

      <Card className="overflow-hidden border-violet-200">
        <div className="bg-ai-subtle p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-card bg-ai text-white">
                <UsersRound className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ai">Combined demand</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">
                  {order.total_quantity} bottles from {order.participant_count}{" "}
                  businesses
                </h2>
              </div>
            </div>
            <p className="rounded-card bg-surface px-4 py-3 text-sm font-semibold text-brand-950 shadow-sm">
              MOQ unlocked
            </p>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">Collective progress</span>
              <span className="font-semibold tabular-nums">
                {order.total_quantity} / {order.minimum_quantity} bottles
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
              <motion.div
                initial={{ width: "36%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full rounded-full bg-ai"
              />
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm text-foreground-muted">Your quantity</p>
            <p className="mt-2 text-3xl font-bold">
              {formatQuantity(member.quantity, order.unit)}
            </p>
            <p className="mt-3 text-sm text-foreground-muted">
              Other businesses contribute 35 anonymized bottles.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-foreground-muted">Original price</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              <Money centimes={member.original_unit_price_centimes} />
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-foreground-muted">
              <Truck className="h-4 w-4" />
              Plus <Money centimes={member.original_delivery_centimes} />{" "}
              delivery
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-success-subtle">
          <CardContent>
            <p className="text-sm font-medium text-success">Collective price</p>
            <p className="mt-2 text-3xl font-bold text-success">
              <Money centimes={member.collective_unit_price_centimes} />
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-success">
              <PackageCheck className="h-4 w-4" />
              Supplier minimum reached
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Your exact savings</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-card bg-surface-subtle p-5">
              <dt className="text-sm text-foreground-muted">Product saving</dt>
              <dd className="mt-2 text-2xl font-bold text-success">
                <Money centimes={member.product_saving_centimes} />
              </dd>
            </div>
            <div className="rounded-card bg-surface-subtle p-5">
              <dt className="text-sm text-foreground-muted">Delivery saving</dt>
              <dd className="mt-2 text-2xl font-bold text-success">
                <Money centimes={member.delivery_saving_centimes} />
              </dd>
            </div>
            <div className="rounded-card bg-brand-950 p-5 text-white">
              <dt className="text-sm text-brand-100">Total saving</dt>
              <dd className="mt-2 text-3xl font-bold">
                <Money centimes={member.total_saving_centimes} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-brand-200">
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-5 w-5 text-success" />
              Human approval sequence
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span
                className={`rounded-badge px-3 py-1.5 font-semibold ${
                  status === "JOINED"
                    ? "bg-success-subtle text-success"
                    : "bg-primary-subtle text-primary"
                }`}
              >
                1. Join proposal
              </span>
              <ArrowRight className="h-4 w-4 text-foreground-muted" />
              <span className="rounded-badge bg-surface-subtle px-3 py-1.5 font-semibold text-foreground-muted">
                2. Approve participation
              </span>
            </div>
          </div>
          {status === "PENDING" ? (
            <Button
              size="lg"
              loading={join.isPending}
              onClick={() => join.mutate()}
            >
              Join this collective order
            </Button>
          ) : (
            <div className="space-y-3">
              {!readyToApprove ? (
                <Button
                  variant="outline"
                  onClick={() => setReadyToApprove(true)}
                >
                  Review final approval
                </Button>
              ) : (
                <div className="rounded-card border border-amber-200 bg-warning-subtle p-4">
                  <p className="text-sm font-semibold text-warning">
                    Approve your 20-bottle commercial participation?
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    This is separate from joining and cannot be performed by
                    Gemma.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      loading={approve.isPending}
                      onClick={() => approve.mutate()}
                    >
                      Approve participation
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setReadyToApprove(false)}
                    >
                      Not yet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center justify-center gap-2 text-sm text-foreground-muted">
        <Clock3 className="h-4 w-4" />
        Join before {formatDateTime(order.join_deadline)}
      </p>
    </PageMotion>
  );
}
