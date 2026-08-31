"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const collapsed = controlledCollapsed ?? internalCollapsed;

  const setCollapsed = (value: boolean) => {
    setInternalCollapsed(value);
    onCollapsedChange?.(value);
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navigation = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-[68px] shrink-0 items-center border-b border-[var(--border)]",
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
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-[0_6px_18px_rgb(99_91_255_/_0.28)] transition-transform duration-200 group-hover:scale-105">
            <Activity className="h-[18px] w-[18px]" strokeWidth={2.5} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-[var(--success)]" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[15px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                RecoverAI
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                Revenue Recovery
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Main navigation */}
      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          collapsed ? "px-2 py-4" : "px-3 py-4",
        )}
      >
        <div className="space-y-1">
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Workspace
            </p>
          )}

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
                  "group relative flex items-center rounded-xl transition-all duration-200",
                  collapsed
                    ? "mx-auto h-11 w-11 justify-center"
                    : "gap-3 px-3 py-2.5",
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
                    collapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]",
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

        {/* Settings section */}
        <div
          className={cn(
            "mt-6 border-t border-[var(--border)] pt-4",
            collapsed && "mt-5",
          )}
        >
          {!collapsed ? (
            <>
              <button
                type="button"
                onClick={() => setSettingsOpen((value) => !value)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Settings
                </span>

                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200",
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
                        <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
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
                    <Icon className="h-[17px] w-[17px]" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Agent status */}
      <div
        className={cn(
          "shrink-0 border-t border-[var(--border)]",
          collapsed ? "p-3" : "p-4",
        )}
      >
        {collapsed ? (
          <div
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success-soft)]"
            title="Agent Active"
          >
            <span className="h-2.5 w-2.5 animate-[pulse-soft_1.8s_ease-in-out_infinite] rounded-full bg-[var(--success)]" />
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Agent Status
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-2 w-2 animate-[pulse-soft_1.8s_ease-in-out_infinite] rounded-full bg-[var(--success)]" />
                  <span className="text-xs font-semibold text-[var(--success)]">
                    Active
                  </span>
                </div>
              </div>

              <Bot className="h-5 w-5 text-[var(--success)]" strokeWidth={1.8} />
            </div>

            <p className="mt-2 text-[10px] leading-4 text-[var(--text-muted)]">
              Monitoring revenue recovery operations.
            </p>
          </div>
        )}
      </div>

      {/* Collapse button */}
      <div
        className={cn(
          "shrink-0 border-t border-[var(--border)]",
          collapsed ? "p-2" : "p-3",
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
            collapsed
              ? "mx-auto h-10 w-10 justify-center"
              : "w-full gap-2 px-3 py-2",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-medium">Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-300 ease-out md:flex",
          collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]",
        )}
      >
        {navigation}
      </aside>

      {/* Mobile drawer */}
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