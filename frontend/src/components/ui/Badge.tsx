import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  className,
}: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent/10 text-accent",
    neutral: "bg-black/[0.04] text-secondary",
  };

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center",
        "whitespace-nowrap rounded-full px-2.5",
        "text-[11px] font-semibold leading-none",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}