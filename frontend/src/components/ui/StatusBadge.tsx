import { Badge } from "./Badge";
import type { RecoveryStatus, TransactionStatus } from "@/types";

export function StatusBadge({ status }: { status: RecoveryStatus | TransactionStatus }) {
  const variant =
    status === "RECOVERED" || status === "SUCCESS"
      ? "success"
      : status === "FAILED"
        ? "danger"
        : status === "ESCALATED"
          ? "warning"
          : "accent";

  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}
