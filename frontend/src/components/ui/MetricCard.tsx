import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

type MetricTone =
  | "neutral"
  | "success"
  | "danger"
  | "accent"
  | "warning";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: MetricTone;
}

const tones: Record<MetricTone, string> = {
  neutral: "text-[var(--text-primary)]",
  success: "text-[var(--success)]",
  danger: "text-[var(--danger)]",
  accent: "text-[var(--brand)]",
  warning: "text-[var(--warning)]",
};

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <Card className="min-h-[132px] p-5">
      <div className="flex h-full min-h-[92px] flex-col">
        {/* Header */}
        <div className="flex min-h-[40px] items-start justify-between gap-3">
          <p className="max-w-[80%] text-sm font-medium leading-5 text-[var(--text-secondary)]">
            {label}
          </p>

          {icon && (
            <div className="shrink-0 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mt-auto">
          <p
            className={cn(
              "whitespace-nowrap text-[28px] font-bold leading-none tracking-[-0.035em]",
              tones[tone],
            )}
          >
            {value}
          </p>

          {detail && (
            <p className="mt-2 text-xs leading-4 text-[var(--text-secondary)]">
              {detail}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}