"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "الرئيسية", icon: "🏠" },
  { href: "/my-bookings", label: "حجوزاتي", icon: "📅" },
  { href: "/wallet", label: "المحفظة", icon: "💰" },
  { href: "/my-rooms", label: "الـ Rooms", icon: "📚" },
  { href: "/profile", label: "البروفايل", icon: "👤" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/90 py-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === "/my-rooms" && pathname.startsWith("/rooms"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-xs ${
              isActive ? "text-primary" : "text-muted"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
