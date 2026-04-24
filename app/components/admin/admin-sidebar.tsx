"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, normalizeApiError } from "../../lib/api";
import { useAuth } from "../../providers/auth-provider";
import { ErrorToast } from "../error-toast";
import Image from "next/image";

const navItems = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: "🏠" },
  { href: "/admin/sessions", label: "الحصص", icon: "📅" },
  { href: "/admin/teachers", label: "المدرسين", icon: "👨‍🏫" },
  { href: "/admin/attendance", label: "الحضور", icon: "📷" },
  { href: "/admin/rooms", label: "الـ Rooms", icon: "🚪" },
  { href: "/admin/settings", label: "إعدادات المركز", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [centerName, setCenterName] = useState("مركزك");
  const [ava, setava] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/centers/me", { signal: controller.signal })
      .then((response) => {
        const data = response.data?.center ?? {};
        setCenterName(data.name);
        setava(data.avatar_url);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        console.error("Failed to load center info", normalized);
      });
    return () => controller.abort();
  }, []);

  const initials = centerName.slice(0, 2);
  const handleToastClose = useCallback(() => setToast(null), []);
  const handleLogout = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  return (
    <>
      {toast && <ErrorToast message={toast} onClose={handleToastClose} />}

      <aside className="fixed right-0 top-0 z-40 hidden h-screen w-[64px] flex-col justify-between border-l border-slate-200 bg-white/90 p-4 backdrop-blur md:flex lg:w-[260px]">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 pb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-white">
              {ava ? (
                <Image src={ava} alt="avatar" width={48} height={48} />
              ) : (
                <span className="text-lg">{initials}</span>
              )}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold">{centerName}</p>
              <p className="text-xs text-muted">Center Admin</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="shrink-0 text-base">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-muted lg:p-4">
          <p className="hidden font-semibold text-slate-700 lg:block">{centerName}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-xs text-error lg:mt-3"
          >
            <span className="hidden lg:inline">تسجيل الخروج</span>
            <span className="text-base lg:hidden">🚪</span>
          </button>
        </div>
      </aside>
    </>
  );
}