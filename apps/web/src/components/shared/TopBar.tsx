import * as React from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  description?: string;
  portalAccent?: "merchant" | "supplier";
}

export function TopBar({
  title,
  description,
  portalAccent = "merchant",
}: TopBarProps) {
  const accentClasses =
    portalAccent === "supplier" ? "border-b-brand-200" : "border-b-transparent";

  return (
    <header className={cn("border-b border-border bg-surface", accentClasses)}>
      <div className="px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-foreground-muted">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-950">
              S
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
