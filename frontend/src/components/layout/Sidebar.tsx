"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Recovery Queue", href: "/recovery", icon: RefreshCw },
  { label: "Transactions", href: "/transactions", icon: CreditCard },
  { label: "Agent", href: "/agent", icon: Bot },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Audit Trail", href: "/audit", icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navigation = (
    <>
      <div className="flex h-16 items-center border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
          <Activity className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-bold tracking-tight text-primary">RecoverAI</p>
          <p className="text-[11px] text-secondary">Revenue Recovery</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-secondary hover:bg-app hover:text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="font-medium text-secondary">Agent Active</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-surface p-2 shadow-sm md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        {navigation}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />
          <aside className="relative flex h-full w-72 flex-col bg-surface shadow-xl">
            <button className="absolute right-3 top-4 rounded-lg p-2 text-secondary hover:bg-app" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
            {navigation}
          </aside>
        </div>
      )}
    </>
  );
}
