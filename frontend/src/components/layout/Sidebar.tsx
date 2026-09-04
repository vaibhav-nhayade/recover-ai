"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  ChevronDown,
  Code2,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Recovery Queue",
    href: "/recovery",
    icon: RefreshCw,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: CreditCard,
  },
  {
    label: "Agent",
    href: "/agent",
    icon: Bot,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Audit Trail",
    href: "/audit",
    icon: ShieldCheck,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart,
  },
];

const settingsItems = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Developer",
    href: "/settings#developer",
    icon: Code2,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [internalCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const collapsed = controlledCollapsed ?? internalCollapsed;

  const isActive = (href: string) => {
    const cleanHref = href.split("#")[0];

    return (
      pathname === cleanHref ||
      pathname.startsWith(`${cleanHref}/`)
    );
  };

  const navigation = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b border-[var(--border)]",
          collapsed ? "justify-center px-3" : "px-5",
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "group flex items-center",
            collapsed ? "justify-center" : "gap-3",
          )}
          aria-label="RecoverAI Dashboard"
        >
          {/* RecoverAI financial mark */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--brand)] text-white shadow-[0_7px_20px_rgb(99_91_255_/_0.25)] transition-transform duration-200 group-hover:scale-105">
            <span className="absolute bottom-[8px] left-[8px] h-[7px] w-[3px] rounded-full bg-white/70" />
            <span className="absolute bottom-[8px] left-[14px] h-[12px] w-[3px] rounded-full bg-white/85" />
            <span className="absolute bottom-[8px] left-[20px] h-[17px] w-[3px] rounded-full bg-white" />

            <ArrowUpRight
              className="absolute right-[5px] top-[5px] h-[11px] w-[11px]"
              strokeWidth={3}
            />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[15px] font-bold tracking-[-0.025em] text-[var(--text-primary)]">
                RecoverAI
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.09em] text-[var(--text-muted)]">
                Revenue Operations
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Main navigation */}
      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          collapsed ? "px-2 py-4" : "px-3 py-5",
        )}
      >
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)]">
            Workspace
          </p>
        )}

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center transition-all duration-200",
                  collapsed
                    ? "mx-auto h-11 w-11 justify-center rounded-xl"
                    : "gap-3 rounded-xl px-3 py-2.5",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--brand)]" />
                )}

                <Icon
                  className={cn(
                    "shrink-0",
                    collapsed
                      ? "h-[18px] w-[18px]"
                      : "h-[17px] w-[17px]",
                  )}
                  strokeWidth={active ? 2.2 : 1.9}
                />

                {!collapsed && (
                  <span
                    className={cn(
                      "text-[13px] font-medium",
                      active && "font-semibold",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Settings */}
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          {!collapsed ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setSettingsOpen((value) => !value)
                }
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)]">
                  Settings
                </span>

                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[var(--text-muted)] transition-transform",
                    !settingsOpen && "-rotate-90",
                  )}
                />
              </button>

              {settingsOpen && (
                <div className="mt-1 space-y-1">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
                        )}
                      >
                        <Icon
                          className="h-[17px] w-[17px]"
                          strokeWidth={1.9}
                        />

                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <Icon
                      className="h-[17px] w-[17px]"
                      strokeWidth={1.9}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile navigation trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-primary)] shadow-[var(--shadow-sm)] md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[rgb(255_255_255_/_0.96)] transition-[width] duration-300 md:flex",
          collapsed
            ? "w-[var(--sidebar-collapsed-width)]"
            : "w-[var(--sidebar-width)]",
        )}
      >
        {navigation}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />

          <aside className="relative flex h-full w-[min(86vw,300px)] flex-col bg-[var(--surface)] shadow-[var(--shadow-lg)]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>

            {navigation}
          </aside>
        </div>
      )}
    </>
  );
}