"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TeacherShell } from "../../components/teacher/teacher-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { CountUp } from "../../components/student/count-up";
import { api, normalizeApiError } from "../../lib/api";
import { formatArabicDate, formatRating } from "../../lib/teacher-utils";
import { useAuth } from "../../providers/auth-provider";

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().regex(/^01[0125]\d{8}$/, "رقم الموبايل غير صحيح"),
});

type FormValues = z.infer<typeof schema>;

type TeacherInfo = {
  name: string;
  isVerified: boolean;
  bio?: string | null;
  subjects: string[];
  gradeLevels: string[];
  joinedAt?: string | null;
  rating: number;
  totalReviews: number;
};

type TeacherStats = {
  totalSessions: number;
  totalStudents: number;
  totalCenters: number;
  rating: number;
};

export default function TeacherProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<TeacherStats>({
    totalSessions: 0,
    totalStudents: 0,
    totalCenters: 0,
    rating: 0,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // const [lat, setLat] = useState<number | null>(null);
  // const [lng, setLng] = useState<number | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    Promise.all([
      api.get("/teacher/me", { signal: controller.signal }),
      api.get("/users/me", { signal: controller.signal }),
      api.get("/teacher/me/stats", { signal: controller.signal }),
    ])
      .then(([teacherRes, userRes, statsRes]) => {
        const teacherData = teacherRes.data?.teacher ?? teacherRes.data ?? {};
        const userData = userRes.data?.user ?? userRes.data ?? {};
        const statsData = statsRes.data?.stats ?? statsRes.data ?? {};

        const normalizeList = (value: any) =>
          Array.isArray(value) ? value : value ? [value] : [];
        const subjects = normalizeList(
          teacherData.subjects ?? teacherData.subject_names
        );
        const gradeLevels = normalizeList(
          teacherData.grade_levels ?? teacherData.gradeLevels
        );

        setTeacher({
          name:
            teacherData.name ??
            teacherData.full_name ??
            teacherData.user_name ??
            userData.name ??
            "مدرس",
          isVerified:
            teacherData.is_verified ??
            teacherData.isVerified ??
            teacherData.verified ??
            false,
          bio: teacherData.bio ?? teacherData.about ?? null,
          subjects,
          gradeLevels,
          joinedAt:
            teacherData.joined_at ?? teacherData.created_at ?? userData.created_at ?? null,
          rating: statsData.rating ?? teacherData.rating ?? 0,
          totalReviews: statsData.total_reviews ?? teacherData.total_reviews ?? 0,
        });

        setEmail(userData.email ?? "");
        setValue("name", userData.name ?? teacherData.name ?? "");
        setValue("phone", userData.phone ?? "");
    

        setStats({
          totalSessions: statsData.total_sessions ?? statsData.totalSessions ?? 0,
          totalStudents:
            statsData.total_students_taught ??
            statsData.total_students ??
            statsData.totalStudentsTaught ??
            0,
          totalCenters: statsData.total_centers ?? statsData.totalCenters ?? 0,
          rating: statsData.rating ?? 0,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
    return () => controller.abort();
  }, [setValue]);

  const onSubmit = (values: FormValues) => {
    setSuccessMessage(null);
    const payload: Record<string, any> = {
      name: values.name,
      phone: values.phone,
    };

    return api
      .put("/users/me", payload)
      .then(() => setSuccessMessage("اتحفظت بياناتك ✓"))
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };





  const initials = teacher?.name?.slice(0, 1) ?? "م";

  return (
    <TeacherShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl text-white">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{teacher?.name}</h1>
              <p className="text-sm text-muted">{email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span
                  className={`rounded-full px-3 py-1 ${
                    teacher?.isVerified
                      ? "bg-success/10 text-success"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {teacher?.isVerified ? "✓ موثّق" : "في انتظار التوثيق"}
                </span>
                <span className="text-muted">
                  ⭐ {formatRating(teacher?.rating ?? 0)} ({teacher?.totalReviews ?? 0} تقييم)
                </span>
              </div>
            </div>
          </div>
          {teacher?.joinedAt && (
            <p className="mt-4 text-xs text-muted">
              مدرس منذ {formatArabicDate(teacher.joinedAt)}
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { icon: "📅", label: "حصة", value: stats.totalSessions, type: "count" },
            { icon: "👥", label: "طالب", value: stats.totalStudents, type: "count" },
            { icon: "🏫", label: "مركز", value: stats.totalCenters, type: "count" },
            { icon: "⭐", label: "تقييم", value: stats.rating, type: "rating" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {item.icon}
                </span>
                <div>
                  <p className="text-lg font-semibold">
                    {item.type === "rating" ? (
                      formatRating(item.value)
                    ) : (
                      <CountUp value={item.value} />
                    )}
                  </p>
                  <p className="text-xs text-muted">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <h2 className="text-base font-semibold">بياناتي الشخصية</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">الاسم</label>
                <input
                  {...register("name")}
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
                {isSubmitting ? "جارٍ الحفظ..." : "حفظ البيانات"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <h2 className="text-base font-semibold">بيانات المدرس</h2>
              <p className="mt-2 text-xs text-muted">
                بياناتك التعليمية بتتحدث من خلال المراكز
              </p>
              <div className="mt-4 space-y-3 text-sm text-muted">
                <p>{teacher?.bio ?? "لا يوجد نبذة بعد"}</p>
                <div className="flex flex-wrap gap-2">
                  {(teacher?.subjects ?? []).length > 0 ? (
                    teacher?.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="rounded-full bg-secondary/15 px-3 py-1 text-xs text-secondary"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span>المواد غير محدثة</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(teacher?.gradeLevels ?? []).length > 0 ? (
                    teacher?.gradeLevels.map((level) => (
                      <span
                        key={level}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                      >
                        {level}
                      </span>
                    ))
                  ) : (
                    <span>الصفوف غير محدثة</span>
                  )}
                </div>
                {teacher?.joinedAt && (
                  <p className="text-xs text-muted">
                    تاريخ الانضمام: {formatArabicDate(teacher.joinedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-error/40 bg-white p-6 shadow-card">
              <h2 className="text-base font-semibold text-error">منطقة الخطر</h2>
              <button
                type="button"
                onClick={() => setLogoutConfirm(true)}
                className="mt-4 rounded-full border border-error px-4 py-2 text-sm font-semibold text-error"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </section>

        {logoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">تأكيد تسجيل الخروج</h3>
                <button
                  type="button"
                  onClick={() => setLogoutConfirm(false)}
                  aria-label="إغلاق نافذة التأكيد"
                  className="text-xl"
                >
                  ×
                </button>
              </div>
              <p className="mt-4 text-sm text-muted">هتخرج من حسابك الحالي</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.replace("/");
                  }}
                  className="btn-ripple flex-1 rounded-full bg-error px-4 py-2 text-sm font-semibold text-white"
                >
                  تسجيل الخروج
                </button>
                <button
                  type="button"
                  onClick={() => setLogoutConfirm(false)}
                  className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </TeacherShell>
  );
}
