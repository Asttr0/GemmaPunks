import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "../ui/Card";

type MetricTone = "default" | "positive" | "warning" | "ai";

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: MetricTone;
  className?: string;
}

const toneClasses: Record<MetricTone, string> = {
  default: "bg-primary-subtle text-primary",
  positive: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  ai: "bg-ai-subtle text-ai",
};

export function MetricCard({
  label,
  value,
  description,
  icon,
  tone = "default",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-foreground-muted">{label}</p>
          {icon ? (
            <span
              aria-hidden="true"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-control",
                toneClasses[tone],
              )}
            >
              {icon}
            </span>
          ) : null}
        </div>
        <div>
          <p className="break-words text-2xl font-bold leading-tight tracking-tight text-foreground tabular-nums sm:text-3xl">
            {value}
          </p>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {description}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
