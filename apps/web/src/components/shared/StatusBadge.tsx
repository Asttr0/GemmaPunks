import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  Info,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Badge, type BadgeVariant } from "../ui/Badge";

export type StatusTone =
  "draft" | "pending" | "confirmed" | "failed" | "neutral" | "info" | "running";

export interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

const statusConfig: Record<
  StatusTone,
  { variant: BadgeVariant; icon: LucideIcon }
> = {
  draft: { variant: "ai", icon: Sparkles },
  pending: { variant: "warning", icon: Clock3 },
  confirmed: { variant: "success", icon: CheckCircle2 },
  failed: { variant: "danger", icon: AlertCircle },
  neutral: { variant: "neutral", icon: Circle },
  info: { variant: "info", icon: Info },
  running: { variant: "ai", icon: LoaderCircle },
};

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  const { variant, icon: Icon } = statusConfig[tone];

  return (
    <Badge variant={variant} className={className}>
      <Icon
        aria-hidden="true"
        className={
          tone === "running"
            ? "h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
            : "h-3.5 w-3.5"
        }
      />
      {label}
    </Badge>
  );
}
