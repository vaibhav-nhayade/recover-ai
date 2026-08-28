"use client";

import Link from "next/link";
import { Activity, AlertCircle, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { registerMerchant } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [industry, setIndustry] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await registerMerchant({
        business_name: businessName.trim(),
        legal_name: legalName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        industry: industry.trim() || undefined,
        country: "IN",
        currency: "INR",
        timezone: "Asia/Kolkata",
      });

      router.replace("/login?registered=true");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4 py-10">
      <div className="w-full max-w-lg">
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
              Create merchant account
            </h2>

            <p className="mt-1 text-sm text-secondary">
              Set up your workspace to start using RecoverAI.
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
                htmlFor="businessName"
                className="mb-1.5 block text-sm font-medium text-primary"
              >
                Business name
              </label>

              <input
                id="businessName"
                name="businessName"
                type="text"
                autoComplete="organization"
                required
                minLength={2}
                maxLength={150}
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Acme Technologies"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor="legalName"
                className="mb-1.5 block text-sm font-medium text-primary"
              >
                Legal name{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>

              <input
                id="legalName"
                name="legalName"
                type="text"
                autoComplete="organization"
                maxLength={200}
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                placeholder="Acme Technologies Private Limited"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-primary"
                >
                  Phone{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={32}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="industry"
                className="mb-1.5 block text-sm font-medium text-primary"
              >
                Industry{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>

              <input
                id="industry"
                name="industry"
                type="text"
                maxLength={100}
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                placeholder="SaaS, E-commerce, Fintech..."
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
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
              />

              <p className="mt-1.5 text-[11px] text-muted">
                Password must contain at least 8 characters.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-soft px-3.5 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Country</span>
                <span className="font-semibold text-primary">India</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-secondary">Currency</span>
                <span className="font-semibold text-primary">INR (₹)</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-secondary">Timezone</span>
                <span className="font-semibold text-primary">
                  Asia/Kolkata
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-center text-sm text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-accent hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          RecoverAI &middot; Revenue recovery operations
        </p>
      </div>
    </main>
  );
}