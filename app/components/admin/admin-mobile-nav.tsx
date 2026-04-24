"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/dashboard", icon: "🏠", label: "الرئيسية" },
  { href: "/admin/sessions", icon: "📅", label: "الحصص" },
  { href: "/admin/teachers", icon: "👨‍🏫", label: "المدرسين" },
  { href: "/admin/attendance", icon: "📷", label: "الحضور" },
  { href: "/admin/rooms", icon: "🚪", label: "الـ Rooms" },
  {href:"/admin/settings",icon:"",label:"اعدادات"}
];

export function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 pb-safe backdrop-blur md:hidden">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-2 min-w-[56px]"
          >
            <span
              className={`h-1 w-5 rounded-full transition-all duration-200 ${
                isActive ? "bg-primary" : "bg-transparent"
              }`}
            />
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xl transition-all duration-200 ${
                isActive ? "bg-primary/10" : ""
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`text-[10px] font-medium transition-colors duration-200 ${
                isActive ? "text-primary" : "text-muted"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}