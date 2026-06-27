import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              ن
            </div>
            <div>
              <p className="text-base font-semibold">ذاكر صح</p>
              <p className="text-xs text-muted font-english" dir="ltr">
                EduConnect
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">
            منصة تربط الطلاب بالمراكز التعليمية والمدرسين في كل محافظات مصر.
          </p>
        </div>

      

        <div className="flex flex-col gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <span>🌐</span>
        
          </div>
          <span className="text-xs text-muted">جميع الحقوق محفوظة 2026</span>
        </div>
      </div>
    </footer>
  );
}
