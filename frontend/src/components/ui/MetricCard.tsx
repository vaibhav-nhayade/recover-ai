import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

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
  tone?: "neutral" | "success" | "danger" | "accent" | "warning";
}) {
  const tones = {
    neutral: "text-primary",
    success: "text-success",
    danger: "text-danger",
    accent: "text-accent",
    warning: "text-warning",
  };

  return (
    <Card className="min-h-[132px]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-secondary">{label}</p>
        {icon}
      </div>
      <p className={cn("mt-3 text-2xl font-bold tracking-tight", tones[tone])}>{value}</p>
      {detail && <p className="mt-1 text-xs text-secondary">{detail}</p>}
    </Card>
  );
}
