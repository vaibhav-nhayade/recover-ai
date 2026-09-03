"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("recoverai_theme");

    const shouldUseDark =
      saved === "dark" ||
      (!saved &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle(
      "dark",
      shouldUseDark,
    );

    setDark(shouldUseDark);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = !dark;

    document.documentElement.classList.toggle(
      "dark",
      next,
    );

    localStorage.setItem(
      "recoverai_theme",
      next ? "dark" : "light",
    );

    setDark(next);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle dark mode"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary opacity-0"
      >
        <Moon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand-dark"
    >
      {dark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}