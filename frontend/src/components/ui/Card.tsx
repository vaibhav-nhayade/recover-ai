import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
        "shadow-[var(--shadow-xs)]",
        "transition-[border-color,box-shadow,transform] duration-200",
        "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  children,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        "mb-5 flex items-start justify-between gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: CardProps) {
  return (
    <h2
      className={cn(
        "text-sm font-bold leading-5 tracking-[-0.01em]",
        "text-[var(--text-primary)]",
        className,
      )}
    >
      {children}
    </h2>
  );
}