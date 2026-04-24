"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "../../components/empty-state";
import { ErrorToast } from "../../components/error-toast";
import { PageTransition } from "../../components/page-transition";
import { SessionCard, SessionSummary } from "../../components/session-card";
import { SkeletonCard } from "../../components/skeleton-card";
import { TeacherCard } from "../../components/teacher-card";
import { api, normalizeApiError } from "../../lib/api";
import { useAuth } from "../../providers/auth-provider";
import useModalKeyboard from "../../hooks/useModalKeyboard";
import { ERRORS } from "../../../constants";

type CenterDetails = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  logoUrl?: string | null;
  distanceKm?: number | null;
  teachers: any[];
};

export default function CenterDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [center, setCenter] = useState<CenterDetails | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(
    null
  );
  const [filters, setFilters] = useState({ subject: "", gradeLevel: "" });
  const [bookingState, setBookingState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingErrorCode, setBookingErrorCode] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const bookingCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    let active = true;
    const controller = new AbortController();
    const fetchCenter = async () => {
      setLoading(true);
      try {
        const [centerResponse, sessionsResponse] = await Promise.all([
          api.get(`/discovery/centers/${params.id}`, {
            signal: controller.signal,
          }),
          api.get(`/discovery/centers/${params.id}/sessions`, {
            signal: controller.signal,
          }),
        ]);
        if (!active) return;
        const centerData = centerResponse.data?.center ?? centerResponse.data;
        const sessionsData =
          sessionsResponse.data?.sessions ?? sessionsResponse.data;

        setCenter({
          id: centerData.id ?? centerData._id,
          name: centerData.center_name ?? "",
          address: centerData.center_address ?? "عنوان غير متوفر",
          phone: centerData.center_phone ?? null,
          logoUrl: centerData.center_logo_url ?? null,
          distanceKm: centerData.distanceKm ?? centerData.distance ?? null,
          teachers: centerData.teachers ?? [],
        });
        setSessions(
          sessionsData.map((session: any) => ({
            id: session.session_id,
            subject: session.subject,
            gradeLevel: session.grade_level ?? "",
            teacherName: session.teacher_name ?? session.teacherName ?? "مدرس",
            scheduled_at:
              session.scheduled_at
 ??
              " ",
            endAt: session.scheduled_at
              ? new Date(
                  new Date(session.scheduled_at).getTime() +
                    (session.duration ?? 90) * 60000
                ).toISOString()
              : null,
            startsAt: new Date(session.scheduled_at),
            durationMinutes: session.duration ?? session.durationMinutes ?? 90,
            price: session.price ?? 0,
            availableSeats: session.availableSeats ?? session.available_seats ?? 0,
          }))
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCenter();
    return () => {
      active = false;
      controller.abort();
    };
  }, [params?.id]);

  useEffect(() => {
    if (!selectedSession) return;
    const controller = new AbortController();
    api
      .get("/wallet", { signal: controller.signal })
      .then((response) => {
        const balance =
          response.data?.balance ?? response.data?.walletBalance ?? null;
        setWalletBalance(typeof balance === "number" ? balance : null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setWalletBalance(null);
      });
    return () => controller.abort();
  }, [selectedSession]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (filters.subject && session.subject !== filters.subject) return false;
      if (filters.gradeLevel && session.gradeLevel !== filters.gradeLevel) return false;
      return true;
    });
  }, [sessions, filters]);

  const uniqueSubjects = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.subject))).filter(Boolean),
    [sessions]
  );
  const uniqueGrades = useMemo(
    () =>
      Array.from(new Set(sessions.map((session) => session.gradeLevel))).filter(
        Boolean
      ),
    [sessions]
  );

  const openBooking = useCallback((session: SessionSummary) => {
    setSelectedSession(session);
    setBookingState("idle");
    setBookingError(null);
    setBookingErrorCode(null);
  }, []);

  const handleToastClose = useCallback(() => setToast(null), []);
  const handleBookingClose = useCallback(() => setSelectedSession(null), []);

  const confirmBooking = useCallback(() => {
    if (!selectedSession) return;
    setBookingState("submitting");
    api
      .post("/bookings", { sessionId: selectedSession.id })
      .then(() => {
        setBookingState("success");
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setBookingErrorCode(normalized.code);
        if (normalized.code === "SESSION_FULL") {
          setBookingError(ERRORS.SESSION_FULL);
        } else if (normalized.code === "ALREADY_BOOKED") {
          setBookingError(ERRORS.ALREADY_BOOKED);
        } else if (normalized.code === "INSUFFICIENT_BALANCE") {
          setBookingError(
            normalized.message ?? ERRORS.INSUFFICIENT_BALANCE
          );
        } else {
          setBookingError(normalized.message);
        }
        setBookingState("error");
      });
  }, [selectedSession]);

  const handleLogin = useCallback(() => router.push("/login"), [router]);
  const handleSubjectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setFilters((prev) => ({ ...prev, subject: event.target.value })),
    []
  );
  const handleGradeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setFilters((prev) => ({ ...prev, gradeLevel: event.target.value })),
    []
  );

  useModalKeyboard(Boolean(selectedSession), handleBookingClose, bookingCloseRef);

  if (loading) {
    return (
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="h-48" />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (!center) {
    return (
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <EmptyState
          illustration="🏫"
          title="مفيش بيانات للمركز"
          subtitle="حاول ترجع للبحث وتختار مركز تاني"
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {toast && <ErrorToast message={toast} onClose={handleToastClose} />}

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-2xl text-primary">
            {center.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={center.logoUrl}
                  alt={center.name}
                  loading="lazy"
                  className="h-20 w-20 rounded-3xl object-cover"
                />
            ) : (
              center.name.slice(0, 2)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{center.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span>📍 {center.address}</span>
              {center.phone && <span>📞 {center.phone}</span>}
              {typeof center.distanceKm === "number" && (
                <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs text-secondary">
                  {center.distanceKm.toFixed(1)} كم
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">المدرسين</h2>
            <p className="text-sm text-muted font-english" dir="ltr">
              Teachers
            </p>
          </div>
        </div>
        {center.teachers.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              illustration="👩‍🏫"
              title="مفيش مدرسين لسه"
              subtitle="تابع قريبًا لظهور المدرسين"
            />
          </div>
        ) : (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
            {center.teachers.map((teacher: any) => (
              <div key={teacher.id ?? teacher._id} className="min-w-[260px]">
                <TeacherCard
                  teacher={{
                    id: teacher.teacher_id ?? teacher._id,
                    name: teacher.teacher_name ?? teacher.full_name ?? "مدرس",
                    avatarUrl: teacher.avatarUrl ?? teacher.avatar ?? null,
                    subjects: teacher.subjects ?? [],
                    gradeLevels: teacher.gradeLevels ?? teacher.grade_levels ?? [],
                    rating: teacher.rating ?? null,
                    reviewsCount: teacher.total_reviews ?? teacher.reviews_count ?? null,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">الحصص المتاحة</h2>
            <p className="text-sm text-muted font-english" dir="ltr">
              Available Sessions
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={filters.subject}
              onChange={handleSubjectChange}
              aria-label="تصفية المادة"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل المواد</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              value={filters.gradeLevel}
              onChange={handleGradeChange}
              aria-label="تصفية الصف الدراسي"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل الصفوف</option>
              {uniqueGrades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              illustration="📅"
              title="مفيش حصص مطابقة"
              subtitle="جرّب تغير الفلاتر"
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isAuthenticated={isAuthenticated}
                isStudent={role === "student"}
                onBook={openBooking}
                onLogin={handleLogin}
              />
            ))}
          </div>
        )}
      </section>

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">تأكيد الحجز</h3>
              <button
                type="button"
                ref={bookingCloseRef}
                onClick={handleBookingClose}
                aria-label="إغلاق"
                className="text-xl"
              >
                ×
              </button>
            </div>

            {bookingState === "success" ? (
              <div className="mt-6 flex flex-col items-center gap-4 text-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-100 text-2xl">
                  QR
                </div>
                <p className="text-lg font-semibold">تم الحجز بنجاح 🎉</p>
                <p className="text-sm text-muted">
                  اعرض الكود عند الدخول للحصة
                </p>
                <button
                  type="button"
                  onClick={handleBookingClose}
                  className="btn-ripple w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white"
                >
                  تمام
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold">{selectedSession.subject}</p>
                  <p className="text-muted">
                    {selectedSession.gradeLevel} · {selectedSession.teacherName}
                  </p>
                  <p className="mt-2 text-muted">
                    السعر: {selectedSession.price} جنيه
                  </p>
                  <p className="mt-1 text-muted">
                    رصيدك:{" "}
                    {typeof walletBalance === "number"
                      ? `${walletBalance} جنيه`
                      : "غير متاح"}
                  </p>
                </div>

                {bookingState === "error" && bookingError && (
                  <div className="mt-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
                    {bookingError}
                    {bookingErrorCode === "INSUFFICIENT_BALANCE" && (
                      <Link
                        href="/wallet"
                        className="mt-2 block text-sm font-semibold text-accent"
                      >
                        شحن دلوقتي
                      </Link>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={bookingState === "submitting"}
                  className="btn-ripple mt-4 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {bookingState === "submitting" ? "جارٍ التأكيد..." : "تأكيد الحجز"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
