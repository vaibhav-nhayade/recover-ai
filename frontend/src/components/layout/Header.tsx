"use client";

import { Bell, ChevronDown, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const titles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Autonomous revenue recovery performance and operational health.",
  },
  "/recovery": {
    title: "Recovery Queue",
    description: "Prioritized revenue cases awaiting diagnosis, action, or verification.",
  },
  "/transactions": {
    title: "Transactions",
    description: "Monitor payment activity and revenue recovery signals.",
  },
  "/agent": {
    title: "AI Agent",
    description: "Monitor autonomous recovery decisions and agent activity.",
  },
  "/analytics": {
    title: "Analytics",
    description: "Understand recovery performance, trends, and revenue impact.",
  },
  "/audit": {
    title: "Audit Trail",
    description: "Review every decision and action taken by RecoverAI.",
  },
};

export default function Header() {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isCase = pathname.startsWith("/recovery/");

  const page = isCase
    ? {
        title: "Case Investigation",
        description: "Investigate the cause, decision, and recovery path for this case.",
      }
    : titles[pathname] ?? {
        title: "RecoverAI",
        description: "AI-powered revenue recovery platform.",
      };

  return (
    <header className="sticky top-0 z-40 flex min-h-[68px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[rgb(255_255_255_/_0.88)] px-4 backdrop-blur-xl sm:px-6 lg:px-7">
      {/* Page identity */}
      <div className="min-w-0 pl-11 md:pl-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[15px] font-bold tracking-[-0.02em] text-[var(--text-primary)] sm:text-base">
            {page.title}
          </h1>

          <span className="hidden rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--brand)] sm:inline-flex">
            Live
          </span>
        </div>

        <p className="mt-0.5 hidden max-w-2xl truncate text-xs text-[var(--text-secondary)] sm:block">
          {page.description}
        </p>
      </div>

      {/* Header actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((value) => !value);
              setProfileOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />

            <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full border-2 border-white bg-[var(--danger)]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Notifications
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    Important recovery events
                  </p>
                </div>

                <span className="rounded-full bg-[var(--danger-soft)] px-2 py-1 text-[9px] font-bold text-[var(--danger)]">
                  3 new
                </span>
              </div>

              <div className="divide-y divide-[var(--border)]">
                <NotificationItem
                  title="High-value recovery opportunity"
                  description="₹48,200 payment failure has a 91% recovery probability."
                  time="8 min ago"
                  tone="danger"
                />

                <NotificationItem
                  title="Recovery completed"
                  description="₹24,999 successfully recovered from PAY_83921."
                  time="32 min ago"
                  tone="success"
                />

                <NotificationItem
                  title="Human review required"
                  description="INV_7721 exceeded the automated recovery policy."
                  time="1 hr ago"
                  tone="warning"
                />
              </div>

              <button
                type="button"
                className="w-full border-t border-[var(--border)] px-4 py-3 text-left text-xs font-semibold text-[var(--brand)] hover:bg-[var(--surface-soft)]"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>

        {/* Merchant profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((value) => !value);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-[var(--surface-soft)] sm:pl-2"
            aria-label="Open merchant profile"
            aria-expanded={profileOpen}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)]">
              VM
            </div>

            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Vaibhav Merchant
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Test Mode
              </p>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-[var(--text-muted)] sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
              <div className="border-b border-[var(--border)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]">
                    VM
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Vaibhav Merchant
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      MRC_8F29A1
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                >
                  <UserRound className="h-4 w-4" />
                  Merchant Profile
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationItem({
  title,
  description,
  time,
  tone,
}: {
  title: string;
  description: string;
  time: string;
  tone: "danger" | "success" | "warning";
}) {
  const dotClass = {
    danger: "bg-[var(--danger)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
  }[tone];

  return (
    <div className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-soft)]">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />

      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--text-primary)]">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">
          {description}
        </p>

        <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
          {time}
        </p>
      </div>
    </div>
  );
}