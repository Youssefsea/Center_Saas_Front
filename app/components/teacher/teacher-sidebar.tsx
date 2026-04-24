"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, normalizeApiError } from "../../lib/api";
import { formatRating } from "../../lib/teacher-utils";
import { useAuth } from "../../providers/auth-provider";
import { ErrorToast } from "../error-toast";

const navItems = [
  { href: "/teacher/dashboard", label: "الرئيسية", icon: "🏠" },
  { href: "/teacher/sessions", label: "حصصي", icon: "📅" },
  { href: "/teacher/centers", label: "مراكزي", icon: "🏫" },
  { href: "/teacher/content", label: "المحتوى", icon: "📚" },
  { href: "/teacher/reviews", label: "التقييمات", icon: "⭐" },
  { href: "/teacher/profile", label: "بروفايلي", icon: "👤" },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [teacherName, setTeacherName] = useState("المدرس");
  const [rating, setRating] = useState("0.0");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/teacher/me")
      .then((response) => {
        const data = response.data?.teacher ?? response.data ?? {};
        setTeacherName(data.name ?? data.full_name ?? "المدرس");
        setRating(formatRating(data.rating ?? data.average_rating));
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        console.error("Failed to load teacher info", normalized);
      });
  }, []);

  const initials = teacherName.slice(0, 1);

  return (
    <>
      {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
      <aside className="fixed right-0 top-0 z-40 hidden h-screen w-[260px] border-l border-slate-200 bg-white/90 p-4 backdrop-blur md:flex md:w-[64px] lg:w-[260px]">
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                {initials}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold">{teacherName}</p>
                <p className="text-xs text-muted">Teacher</p>
              </div>
            </div>
            <nav className="flex flex-col gap-2 ">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                <Link
  key={item.href}
  href={item.href}
  className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm transition ${
    isActive
      ? "bg-primary text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100"
  }`}
>
  <span className="text-lg leading-none">{item.icon}</span>
  <span className="leading-none">{item.label}</span>
</Link>
                );
              })}
            </nav>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-muted">
            <p className="font-semibold text-slate-700">{teacherName}</p>
            <p className="mt-2 rounded-full bg-primary/10 px-2 py-1 text-primary">
              {rating} ⭐
            </p>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="mt-3 text-xs text-error"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
