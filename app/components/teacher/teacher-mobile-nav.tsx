"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/teacher/dashboard", icon: "🏠", label: "الرئيسية" },
  { href: "/teacher/sessions", icon: "📅", label: "الحصص" },
  { href: "/teacher/centers", icon: "🏫", label: "السنتر" }, // يُفضل تقصير الكلمات قدر الإمكان
  { href: "/teacher/content", icon: "📚", label: "المحتوى" },
  { href: "/teacher/reviews", icon: "⭐", label: "التقييمات" },
  { href: "/teacher/profile", icon: "👤", label: "حسابي" }, // بدلاً من "الملف الشخصي" الطويلة
];

export function TeacherMobileNav() {
  const pathname = usePathname();
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white/95 px-1 pt-2 backdrop-blur-md md:hidden"
      // استخدام style لضمان توافق الـ Safe Area مع هواتف الآيفون الحديثة
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }} 
    >
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            {/* دمجنا المؤشر مع الأيقونة لتوفير المساحة العمودية (تم إزالة الشريط العلوي) */}
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-lg transition-all duration-300 ${
                isActive 
                  ? "bg-primary/15 text-primary scale-110 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {item.icon}
            </span>
            
            <span
              className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-300 whitespace-nowrap ${
                isActive ? "text-primary font-bold" : "text-slate-500"
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