import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  portalAccent?: "merchant" | "supplier";
  orgName?: string;
}

const navItems: NavItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="size-5" />,
  },
  { path: "/catalog", label: "Catalog", icon: <Package className="size-5" /> },
  {
    path: "/orders",
    label: "Orders",
    icon: <ShoppingCart className="size-5" />,
  },
  {
    path: "/customers",
    label: "Customers",
    icon: <Users className="size-5" />,
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: <BarChart3 className="size-5" />,
  },
  {
    path: "/settings",
    label: "Settings",
    icon: <Settings className="size-5" />,
  },
];

export function Sidebar({
  portalAccent = "merchant",
  orgName = "Organization",
}: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-30 rounded-lg bg-surface p-2 shadow-sm border border-border lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5 text-foreground" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border bg-surface transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <span
            className={cn(
              "text-lg font-semibold",
              portalAccent === "supplier" ? "text-brand-500" : "text-brand-700",
            )}
          >
            MIZAN Souq
          </span>
          <button
            className="lg:hidden rounded-lg p-1 hover:bg-surface-subtle"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="size-4 text-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? `bg-brand-100 text-brand-950`
                    : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
                )}
                onClick={() => setMobileOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-950">
              {orgName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {orgName}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarSpacer() {
  return <div className="w-[240px] shrink-0" aria-hidden="true" />;
}
