import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-brand text-white hover:bg-brand/90",
    secondary:
      "border border-border bg-surface text-primary hover:bg-app",
    danger: "bg-danger text-white hover:bg-danger/90",
    ghost:
      "text-secondary hover:bg-app hover:text-primary",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}