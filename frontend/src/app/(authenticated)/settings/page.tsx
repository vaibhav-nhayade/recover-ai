"use client";

import {
  Bell,
  Check,
  Code2,
  CreditCard,
  Lock,
  Save,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const [automation, setAutomation] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(
      "recoverai_preferences",
    );

    if (!raw) {
      return;
    }

    try {
      const preferences = JSON.parse(raw) as {
        automation?: boolean;
        notifications?: boolean;
        weeklyReports?: boolean;
      };

      if (
        typeof preferences.automation ===
        "boolean"
      ) {
        setAutomation(preferences.automation);
      }

      if (
        typeof preferences.notifications ===
        "boolean"
      ) {
        setNotifications(
          preferences.notifications,
        );
      }

      if (
        typeof preferences.weeklyReports ===
        "boolean"
      ) {
        setWeeklyReports(
          preferences.weeklyReports,
        );
      }
    } catch {
      // Ignore malformed local preferences.
    }
  }, []);

  function savePreferences() {
    localStorage.setItem(
      "recoverai_preferences",
      JSON.stringify({
        automation,
        notifications,
        weeklyReports,
      }),
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  const businessName = "RecoverAI Merchant";
  const merchantCode = "RECOVERAI";

  const initials =
    businessName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0])
      .join("")
      .toUpperCase() || "RA";

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 pb-12">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
          Workspace configuration
        </div>

        <h1 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Configure your RecoverAI workspace, automation preferences,
          notifications, and developer access.
        </p>
      </div>

      {/* Profile */}
      <Card
        id="profile"
        className="scroll-mt-24 p-5 sm:p-6"
      >
        <SectionHeading
          icon={<UserRound className="h-4 w-4" />}
          title="Merchant Profile"
          description="Identity and business information connected to this workspace."
        />

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-xl font-bold text-[var(--brand)]">
            {initials}
          </div>

          <div className="grid flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Business name"
              value={businessName}
            />

            <InfoItem
              label="Merchant ID"
              value={merchantCode}
            />

            <InfoItem
              label="Email"
              value="merchant@example.com"
            />

            <InfoItem
              label="Country"
              value="IN"
            />

            <InfoItem
              label="Currency"
              value="INR"
            />

            <InfoItem
              label="Timezone"
              value="Asia/Kolkata"
            />
          </div>
        </div>
      </Card>

      {/* Recovery controls */}
      <Card className="p-5 sm:p-6">
        <SectionHeading
          icon={<Zap className="h-4 w-4" />}
          title="Recovery Controls"
          description="Control how RecoverAI operates inside your approved recovery boundaries."
        />

        <div className="mt-5 divide-y divide-[var(--border)]">
          <ToggleRow
            title="Autonomous recovery"
            detail="Allow the recovery agent to execute policy-approved interventions."
            value={automation}
            onChange={setAutomation}
          />

          <ToggleRow
            title="Automatic escalation"
            detail="Escalate cases when stopping rules or recovery limits are reached."
            value={true}
            onChange={() => undefined}
          />
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5 sm:p-6">
        <SectionHeading
          icon={<Bell className="h-4 w-4" />}
          title="Notifications"
          description="Choose which operational updates appear in your workspace."
        />

        <div className="mt-5 divide-y divide-[var(--border)]">
          <ToggleRow
            title="Recovery alerts"
            detail="Receive important notifications for high-value opportunities and recoveries."
            value={notifications}
            onChange={setNotifications}
          />

          <ToggleRow
            title="Weekly performance report"
            detail="Keep a recurring summary of revenue recovered and agent performance."
            value={weeklyReports}
            onChange={setWeeklyReports}
          />
        </div>
      </Card>

      {/* Security */}
      <Card className="p-5 sm:p-6">
        <SectionHeading
          icon={<Lock className="h-4 w-4" />}
          title="Security"
          description="Current authentication and account protection status."
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SecurityItem
            title="Authentication"
            value="JWT enabled"
          />

          <SecurityItem
            title="Account status"
            value="Active"
          />

          <SecurityItem
            title="Environment"
            value="Test Mode"
          />
        </div>
      </Card>

      {/* Developer */}
      <Card
        id="developer"
        className="scroll-mt-24 p-5 sm:p-6"
      >
        <SectionHeading
          icon={<Code2 className="h-4 w-4" />}
          title="Developer"
          description="Technical information for integrating RecoverAI with your payment workflow."
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DeveloperItem
            label="API"
            value="RecoverAI API"
          />

          <DeveloperItem
            label="Version"
            value="v1"
          />

          <DeveloperItem
            label="Backend"
            value="FastAPI"
          />

          <DeveloperItem
            label="Database"
            value="PostgreSQL"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            onClick={() =>
              window.open(
                "http://localhost:8000/docs",
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
          >
            <Code2 className="h-4 w-4" />
            API Documentation
          </button>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
          >
            <ShieldCheck className="h-4 w-4" />
            Integration status
          </button>
        </div>
      </Card>

      {/* Save */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="button"
          onClick={savePreferences}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition hover:-translate-y-0.5"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Preferences saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
        {icon}
      </span>

      <div>
        <h2 className="text-sm font-bold">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-1.5 truncate text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function ToggleRow({
  title,
  detail,
  value,
  onChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <div>
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-secondary)]">
          {detail}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value
            ? "bg-[var(--brand)]"
            : "bg-[var(--border-strong)]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            value
              ? "translate-x-6"
              : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function SecurityItem({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[var(--success)]" />

        <p className="text-xs font-semibold">
          {title}
        </p>
      </div>

      <p className="mt-2 text-xs text-[var(--text-secondary)]">
        {value}
      </p>
    </div>
  );
}

function DeveloperItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-[var(--brand)]" />

        <p className="text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}