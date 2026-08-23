import { Badge } from "./Badge";
import type { Priority } from "@/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variant = priority === "HIGH" ? "danger" : priority === "MEDIUM" ? "warning" : "neutral";
  return <Badge variant={variant}>{priority}</Badge>;
}
