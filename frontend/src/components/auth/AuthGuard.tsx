"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const TOKEN_KEY = "recoverai_access_token";

export default function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      router.replace(
        `/login?next=${encodeURIComponent(pathname)}`,
      );
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="text-sm text-secondary">
          Loading…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}