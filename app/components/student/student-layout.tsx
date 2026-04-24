"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PrivateRoute } from "../route-guards";
import { useAuth } from "../../providers/auth-provider";
import { WalletProvider } from "../../providers/wallet-provider";
import { StudentSidebar } from "./student-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

function StudentRoleGuard({ children }: { children: React.ReactNode }) {
  const { role, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && role && role !== "student") {
      router.replace("/");
    }
  }, [isReady, role, router]);

  if (!isReady) {
    return <div className="p-10 text-center text-muted">جارٍ التحميل...</div>;
  }

  if (role !== "student") {
    return null;
  }

  return <>{children}</>;
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <StudentRoleGuard>
        <WalletProvider>
          <div className="min-h-screen bg-background">
            <StudentSidebar />
            <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:mr-[64px] lg:mr-[260px]">
              {children}
            </div>
            <MobileBottomNav />
          </div>
        </WalletProvider>
      </StudentRoleGuard>
    </PrivateRoute>
  );
}
