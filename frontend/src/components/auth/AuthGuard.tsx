"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentMerchant } from "@/lib/api";

const TOKEN_KEY = "recoverai_access_token";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuthentication() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (pathname !== "/login") {
          router.replace("/login");
        } else if (!cancelled) {
          setCheckingAuth(false);
        }

        return;
      }

      try {
        await getCurrentMerchant(token);

        if (!cancelled) {
          setCheckingAuth(false);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);

        if (pathname !== "/login") {
          router.replace("/login");
        } else if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuthentication();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />

          <p className="mt-3 text-sm font-medium text-secondary">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}