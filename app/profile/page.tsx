"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { StudentLayout } from "../components/student/student-layout";
import { PageTransition } from "../components/page-transition";
import { ErrorToast } from "../components/error-toast";
import { api, normalizeApiError } from "../lib/api";
import { formatArabicDate } from "../lib/student-utils";
import { useAuth } from "../providers/auth-provider";
import { useWallet } from "../providers/wallet-provider";
import useModalKeyboard from "../hooks/useModalKeyboard";
import { PHONE_REGEX } from "../lib/constants";

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().regex(PHONE_REGEX, "رقم الموبايل غير صحيح"),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type ProfileData = {
  name: string;
  email: string;
  phone?: string | null;
  createdAt?: string | null;
  stats?: {
    total_bookings?: number;
    attended_sessions?: number;
    pending_bookings?: number;
    confirmed_bookings?: number;
    cancelled_bookings?: number;
    attendance_rate?: number;
  };

};

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { balance, refresh } = useWallet();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const logoutCloseRef = useRef<HTMLButtonElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", location: "" },
  });

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    abortRef.current?.abort();
    abortRef.current = controller;
    api
      .get("/users/me", { signal: controller.signal })
      .then((response) => {
        const data = response.data ?? {};
        const profileData: ProfileData = {
          name: data.user.name ?? "",
          email: data.user.email ?? "",
          phone: data.user.phone ?? "",
          createdAt: data.user.createdAt ?? data.user.created_at ?? null,
          stats: {
            total_bookings: data.stats?.total_bookings,
            attended_sessions: data.stats?.attended_sessions,
            pending_bookings: data.stats?.pending_bookings,
            confirmed_bookings: data.stats?.confirmed_bookings,
            cancelled_bookings: data.stats?.cancelled_bookings,
            attendance_rate: data.stats?.attendance_rate,
          },
        };
        setProfile(profileData);
        setValue("name", profileData.name);
        setValue("phone", profileData.phone ?? "");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
    return () => controller.abort();
  }, [refresh, setValue]);

  const handleToastClose = useCallback(() => setToast(null), []);
  const handleLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setToast("المتصفح لا يدعم تحديد الموقع");
      return;
    }

  }, []);

  const onSubmit = useCallback((values: FormValues) => {
    setSuccessMessage(null);
    return api
      .put("/users/me", {
        name: values.name,
        phone: values.phone,
      })
      .then(() => {
        setSuccessMessage("اتحفظت التغييرات ✓");
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  }, []);

  const initials = useMemo(
    () => profile?.name?.slice(0, 1).toUpperCase() ?? "ط",
    [profile?.name]
  );

  const handleOpenLogout = useCallback(() => setLogoutConfirm(true), []);
  const handleCloseLogout = useCallback(() => setLogoutConfirm(false), []);
  const handleLogout = useCallback(() => {
    logout();
    router.replace("/");
  }, [logout, router]);

  useModalKeyboard(logoutConfirm, handleCloseLogout, logoutCloseRef);

  return (
    <StudentLayout>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-xl">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-semibold">{profile?.name}</h1>
                <p className="text-sm text-muted">{profile?.email}</p>
                <span className="mt-2 inline-flex rounded-full bg-success/10 px-3 py-1 text-xs text-success">
                  طالب
                </span>
              </div>
            </div>
            {profile?.createdAt && (
              <p className="mt-4 text-xs text-muted">
                عضو منذ {formatArabicDate(profile.createdAt)}
              </p>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">الاسم</label>
                <input
                  {...register("name")}
                  aria-label="الاسم"
                  aria-required="true"
                  aria-invalid={Boolean(errors.name)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-error">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">رقم الموبايل</label>
                <input
                  {...register("phone")}
                  aria-label="رقم الموبايل"
                  aria-required="true"
                  aria-invalid={Boolean(errors.phone)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-error">{errors.phone.message}</p>
                )}
              </div>
           
          
              {successMessage && (
                <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
                  {successMessage}
                </div>
              )}
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="btn-ripple w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <h2 className="text-base font-semibold">إحصائيات سريعة</h2>
              <div className="mt-4 space-y-3 text-sm text-muted">
                <p>إجمالي الحجوزات: {profile?.stats?.total_bookings ?? 0}</p>
                <p>الحصص اللي حضرتها: {profile?.stats?.attended_sessions ?? 0}</p>
                <p>الحجوزات المعلقة: {profile?.stats?.pending_bookings ?? 0}</p>
                <p>الحجوزات المؤكدة: {profile?.stats?.confirmed_bookings ?? 0}</p>
                <p>الحجوزات الملغاة: {profile?.stats?.cancelled_bookings ?? 0}</p>
                <p>نسبة الحضور: {profile?.stats?.attendance_rate ? `${profile.stats.attendance_rate}%` : "0%"}</p>
              </div>
            </div>
                <p>
                  رصيد المحفظة: {balance ?? 0} جنيه{" "}
                <button
                  type="button"
                  onClick={() => router.push("/wallet")}
                  aria-label="عرض المحفظة"
                  className="text-primary"
                >
                  عرض المحفظة
                </button>
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-error/30 bg-error/5 p-6">
              <h2 className="text-base font-semibold text-error">منطقة خطرة</h2>
              <button
                type="button"
                onClick={handleOpenLogout}
                className="mt-4 w-full rounded-full border border-error px-4 py-2 text-sm font-semibold text-error"
              >
                تسجيل الخروج
              </button>
            </div>
          

        {logoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">تأكيد تسجيل الخروج</h3>
                <button
                  ref={logoutCloseRef}
                  type="button"
                  onClick={handleCloseLogout}
                  aria-label="إغلاق نافذة التأكيد"
                  className="text-xl"
                >
                  ×
                </button>
              </div>
              <p className="mt-4 text-sm text-muted">
                متأكد إنك عايز تسجل الخروج؟
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-ripple flex-1 rounded-full bg-error px-4 py-2 text-sm font-semibold text-white"
                >
                  تأكيد
                </button>
                <button
                  type="button"
                  onClick={handleCloseLogout}
                  className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </StudentLayout>
  );
}
