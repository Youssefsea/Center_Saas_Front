"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "../providers/auth-provider";
import useModalKeyboard from "../hooks/useModalKeyboard";
import { createPortal } from "react-dom";

const roleLabels: Record<string, string> = {
  student: "طالب",
  teacher: "مدرس",
  center_admin: "مدير مركز",
  super_admin: "مدير عام",
};

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuCloseRef = useRef<HTMLButtonElement | null>(null);

  const links = [
    { href: "/", label: "الرئيسية" },
    { href: "/search", label: "البحث" },
  ];

  const handleGoToProfile = useCallback(() => {
    const href =
      user?.role === "teacher"
        ? "/teacher/profile"
        : user?.role === "center_admin"
          ? "/admin/dashboard"
          : "/profile";
    window.location.href = href;
    setIsMenuOpen(false);
  }, [user?.role]);

  const handleOpenMenu = useCallback(() => setIsOpen(true), []);
  const handleCloseMenu = useCallback(() => setIsOpen(false), []);
  const handleToggleProfileMenu = useCallback(
    () => setIsMenuOpen((prev) => !prev),
    []
  );
  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
  }, [logout]);
  const handleLogoutMobile = useCallback(() => {
    logout();
    setIsOpen(false);
  }, [logout]);

  useModalKeyboard(isOpen, handleCloseMenu, menuCloseRef);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow">
              ن
            </div>
            <div>
              <p className="text-base font-semibold">ذاكر صح</p>
              <p className="text-xs text-muted font-english" dir="ltr">
                EduConnect
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-slate-600 hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                >
                  دخول
                </Link>
                <Link
                  href="/register"
                  className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.97]"
                >
                  تسجيل
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleProfileMenu}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                    {user?.email?.[0]?.toUpperCase() ?? "؟"}
                  </div>
                  <span className="text-sm font-medium">{user?.email}</span>
                  {user?.role && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                      {roleLabels[user.role]}
                    </span>
                  )}
                </button>
                {isMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-card">
                    <button
                      type="button"
                      onClick={handleGoToProfile}
                      className="w-full rounded-xl px-3 py-2 text-right text-sm text-slate-700 hover:bg-slate-100"
                    >
                      الملف الشخصي
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl px-3 py-2 text-right text-sm text-error hover:bg-error/10"
                    >
                      خروج
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 md:hidden"
            onClick={handleOpenMenu}
            aria-label="فتح القائمة"
          >
            ☰
          </button>
        </div>
      </header>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] md:hidden"
            onClick={handleCloseMenu}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

            <div
              className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white text-sm">
                    ن
                  </div>
                  <span className="text-sm font-bold text-slate-800">ذاكر صح</span>
                </div>
                <button
                  ref={menuCloseRef}
                  type="button"
                  onClick={handleCloseMenu}
                  aria-label="إغلاق"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              {isAuthenticated && (
                <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-secondary font-semibold">
                    {user?.email?.[0]?.toUpperCase() ?? "؟"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {user?.email}
                    </p>
                    {user?.role && (
                      <span className="text-xs text-muted">
                        {roleLabels[user.role]}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col px-4 py-4 gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleCloseMenu}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 hover:bg-slate-50 hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleGoToProfile}
                    className="rounded-xl px-4 py-3 text-right text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-primary"
                  >
                    الملف الشخصي
                  </button>
                )}
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex flex-col gap-3 px-4">
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/login"
                      onClick={handleCloseMenu}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      دخول
                    </Link>
                    <Link
                      href="/register"
                      onClick={handleCloseMenu}
                      className="btn-ripple rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      تسجيل مجاناً
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogoutMobile}
                    className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/20"
                  >
                    تسجيل الخروج
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}