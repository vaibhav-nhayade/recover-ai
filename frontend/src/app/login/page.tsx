"use client";

import { FormEvent, useState } from "react";
import { Activity, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { loginMerchant } from "@/lib/api";

const TOKEN_KEY = "recoverai_access_token";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginMerchant({
        email: email.trim(),
        password,
      });

      localStorage.setItem(TOKEN_KEY, response.access_token);

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_8px_24px_rgb(99_91_255_/_0.25)]">
            <Activity className="h-6 w-6" strokeWidth={2.4} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-primary">
            RecoverAI
          </h1>

          <p className="mt-1 text-sm text-secondary">
            Revenue Recovery Platform
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary">
              Sign in
            </h2>

            <p className="mt-1 text-sm text-secondary">
              Access your revenue recovery workspace.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-3 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-primary"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="merchant@example.com"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-primary"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          RecoverAI · Revenue recovery operations
        </p>
      </div>
    </main>
  );
}