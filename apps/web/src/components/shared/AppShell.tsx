import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export interface AppNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface AppShellProps {
  children: ReactNode;
  navigation: AppNavigationItem[];
  activePath: string;
  organizationName: string;
  role: string;
  userName?: string | null;
  onNavigate?: (href: string) => void;
  onSignOut?: () => void | Promise<void>;
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  children,
  navigation,
  activePath,
  organizationName,
  role,
  userName,
  onNavigate,
  onSignOut,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const portalLabel = "Finance workspace";
  const accountLabel = userName || organizationName;
  const initials = useMemo(
    () => getInitials(accountLabel) || "MS",
    [accountLabel],
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [activePath]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const navigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(href);
    setMobileOpen(false);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-20 items-center justify-between border-b border-border px-6">
        <a
          href="/"
          onClick={(event) => navigate(event, "/")}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4"
          aria-label="MIZAN Control home"
        >
          <span className="block text-xl font-semibold tracking-tight text-brand-950">
            MIZAN <span className="text-primary">Control</span>
          </span>
          <span className="mt-0.5 block text-xs font-medium text-foreground-muted">
            Financial operations intelligence
          </span>
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-control bg-primary-subtle px-3 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface text-primary shadow-sm">
            <Building2 aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-950">
              {organizationName}
            </p>
            <p className="text-xs font-medium text-primary">{portalLabel}</p>
          </div>
        </div>
      </div>

      <nav
        aria-label="Primary navigation"
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Workspace
        </p>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active =
              activePath === item.href ||
              (item.href !== "/" && activePath.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(event) => navigate(event, item.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-medium outline-none transition-colors duration-standard",
                    "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                    active
                      ? "bg-primary-subtle text-brand-950"
                      : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active
                        ? "text-primary"
                        : "text-foreground-muted group-hover:text-primary",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <Badge variant={active ? "primary" : "neutral"}>
                      {item.badge}
                    </Badge>
                  ) : active ? (
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 text-primary"
                    />
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-control p-2">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-950 text-sm font-semibold text-white"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {accountLabel}
            </p>
            <p className="truncate text-xs text-foreground-muted">{role}</p>
          </div>
          {onSignOut ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => void onSignOut()}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Application navigation"
            className="relative h-full w-[min(20rem,88vw)] border-r border-border bg-surface shadow-dialog"
          >
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="min-h-dvh lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-app items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <PanelLeftClose
                aria-hidden="true"
                className="hidden h-5 w-5 text-foreground-muted lg:block"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {organizationName}
                </p>
                <p className="truncate text-xs text-foreground-muted">
                  {portalLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="primary">
                <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{portalLabel}</span>
              </Badge>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-950 text-sm font-semibold text-white lg:hidden"
              >
                {initials}
              </span>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-app px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
