"use client";

import { Bell, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/recovery": "Recovery Queue",
  "/transactions": "Transactions",
  "/agent": "Agent",
  "/analytics": "Analytics",
  "/audit": "Audit Trail",
};

export default function Header() {
  const pathname = usePathname();
  const title = pathname.startsWith("/recovery/") ? "Case Investigation" : titles[pathname] ?? "RecoverAI";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-5 md:px-7">
      <div className="pl-10 md:pl-0">
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
        <p className="hidden text-xs text-secondary sm:block">Autonomous revenue recovery operations</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Agent Active
        </div>

        <button className="relative rounded-lg p-2 text-secondary hover:bg-app" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-app">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            VM
          </div>
          <span className="hidden text-sm font-medium text-primary sm:block">Vaibhav Merchant</span>
          <ChevronDown className="hidden h-4 w-4 text-secondary sm:block" />
        </button>
      </div>
    </header>
  );
}
