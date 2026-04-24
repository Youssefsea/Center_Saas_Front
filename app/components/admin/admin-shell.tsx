"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrivateRoute } from "../route-guards";
import { useAuth } from "../../providers/auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminMobileNav } from "./admin-mobile-nav";

function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const { role, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && role && role !== "center_admin") {
      router.replace("/login");
    }
  }, [isReady, role, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (role !== "center_admin") return null;

  return <>{children}</>;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <AdminRoleGuard>
        <div className="min-h-screen bg-background">
          {/* Sidebar - desktop only */}
          <AdminSidebar />

          {/* Main content */}
          <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:mr-[64px] md:pt-8 lg:mr-[260px]">
            {children}
          </main>

          {/* Bottom nav - mobile only */}
          <AdminMobileNav />
        </div>
      </AdminRoleGuard>
    </PrivateRoute>
  );
}