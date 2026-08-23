import type { ReactNode } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export function TimelineItem({
  label,
  status,
  detail,
}: {
  label: string;
  status: TimelineStatus;
  detail?: ReactNode;
}) {
  const icon =
    status === "COMPLETED" ? <CheckCircle2 className="h-5 w-5 text-success" /> :
    status === "RUNNING" ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> :
    status === "FAILED" ? <XCircle className="h-5 w-5 text-danger" /> :
    <Circle className="h-5 w-5 text-border" />;

  return (
    <div className="relative flex gap-3">
      <div className="relative z-10 bg-surface">{icon}</div>
      <div className={cn("pb-6", status === "PENDING" && "opacity-50")}>
        <p className="text-sm font-medium text-primary">{label}</p>
        {detail && <p className="mt-1 text-xs text-secondary">{detail}</p>}
      </div>
    </div>
  );
}
