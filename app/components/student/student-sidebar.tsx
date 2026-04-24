"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../providers/auth-provider";
import { useWallet } from "../../providers/wallet-provider";

const navItems = [
  { href: "/dashboard", label: "الرئيسية", icon: "🏠" },
  { href: "/my-bookings", label: "حجوزاتي", icon: "📅" },
  { href: "/wallet", label: "المحفظة", icon: "💰" },
  { href: "/my-rooms", label: "الـ Rooms", icon: "📚" },
  { href: "/profile", label: "البروفايل", icon: "👤" },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { balance, isLoading } = useWallet();
  const displayName = user?.email?.split("@")[0] ?? "طالب";

  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen flex-col border-l border-slate-200 bg-white/90 p-4 backdrop-blur md:flex md:w-[64px] lg:w-[260px]">
      <div className="flex items-center gap-3 pb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold">{displayName}</p>
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
            طالب
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/my-rooms" && pathname.startsWith("/rooms"));
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
              <span>{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl bg-slate-100 p-3 text-center text-xs lg:text-sm">
        <p className="text-muted">رصيد المحفظة</p>
        <p className="mt-1 font-semibold text-primary">
          {isLoading ? "..." : balance !== null ? `${balance} جنيه` : "--"}
        </p>
        <Link
          href="/wallet"
          className="btn-ripple mt-2 inline-flex w-full items-center justify-center rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white lg:text-sm"
        >
          شحن
        </Link>
      </div>
    </aside>
  );
}
