"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { roleRedirects } from "../lib/constants";
import { useAuth } from "../providers/auth-provider";

const GuardLoading = () => (
  <div className="p-10 text-center text-muted" role="status" aria-live="polite">
    جارٍ التحميل...
  </div>
);

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady) {
    return <GuardLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      const target = role ? roleRedirects[role] ?? "/" : "/";
      router.replace(target);
    }
  }, [isReady, isAuthenticated, role, router]);

  if (!isReady) {
    return <GuardLoading />;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
