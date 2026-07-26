import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
              {breadcrumbs.map((item, index) => (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-center gap-2"
                >
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  {item.href && index < breadcrumbs.length - 1 ? (
                    <a
                      href={item.href}
                      className="rounded-sm outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      aria-current={
                        index === breadcrumbs.length - 1 ? "page" : undefined
                      }
                      className={
                        index === breadcrumbs.length - 1
                          ? "font-medium text-foreground"
                          : undefined
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p>
        ) : null}
        <h1
          id="page-title"
          tabIndex={-1}
          className="text-3xl font-bold leading-tight tracking-tight text-foreground outline-none sm:text-4xl"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
