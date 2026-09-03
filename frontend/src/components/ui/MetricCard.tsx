import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

type MetricTone =
  | "neutral"
  | "success"
  | "danger"
  | "accent"
  | "warning";

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: MetricTone;
}) {
  const tones: Record<MetricTone, string> = {
    neutral: "text-primary",
    success: "text-success",
    danger: "text-danger",
    accent: "text-brand",
    warning: "text-warning",
  };

  return (
    <Card className="kpi-card min-h-[174px] overflow-hidden p-5">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <p className="kpi-label">{label}</p>

        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            {icon}
          </div>
        )}
      </div>

      <p
        className={cn(
          "relative z-10 kpi-value",
          tones[tone],
        )}
      >
        {value}
      </p>

      {detail && (
        <p className="relative z-10 kpi-detail">
          {detail}
        </p>
      )}
    </Card>
  );
}