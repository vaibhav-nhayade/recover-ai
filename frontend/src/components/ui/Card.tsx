import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <section
      {...props}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
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
  ...props
}: CardProps) {
  return (
    <div
      {...props}
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
  ...props
}: CardProps) {
  return (
    <h2
      {...props}
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