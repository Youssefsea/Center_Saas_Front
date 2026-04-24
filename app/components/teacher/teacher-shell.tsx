"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrivateRoute } from "../route-guards";
import { useAuth } from "../../providers/auth-provider";
import { TeacherSidebar } from "./teacher-sidebar";
import { TeacherMobileNav } from "./teacher-mobile-nav";

function TeacherRoleGuard({ children }: { children: React.ReactNode }) {
  const { role, isReady } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isReady && role && role !== "teacher") {
      router.replace("/login");
    }
  }, [isReady, role, router]);

  if (!isReady) {
    return <div className="p-10 text-center text-muted">جارٍ التحميل...</div>;
  }

  if (role !== "teacher") {
    return null;
  }

  return <>{children}</>;
}

export function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <TeacherRoleGuard>
        <div className="min-h-screen bg-background">
          
           <TeacherSidebar />
          <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:mr-[64px] md:pt-8 lg:mr-[260px]">
            {children}
          </main>
          <TeacherMobileNav />
        </div>
      </TeacherRoleGuard>
    </PrivateRoute>
  );
}
