"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../components/admin/admin-shell";
import { PageTransition } from "../../components/page-transition";
import { CountUp } from "../../components/student/count-up";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import { ConfirmModal } from "../../components/admin/confirm-modal";
import { api, normalizeApiError } from "../../lib/api";
import {
  formatArabicTime,
  getSeatColor,
  getSeatFill,
  isSameDay,
  formatRelative,
} from "../../lib/admin-utils";
import { useAuth } from "../../providers/auth-provider";

type SessionItem = {
  id: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  scheduledAt: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  bookedSeats: number;
  capacity: number;
  bookingsCount: number;
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [teachersCount, setTeachersCount] = useState(0);
  const [roomsCount, setRoomsCount] = useState(0);
  const [centerName, setCenterName] = useState("مركزك");
  const [toast, setToast] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SessionItem | null>(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/centers/sessions"),
      api.get("/centers/teachers"),
      api.get("/centers/rooms"),
    ])
      .then(([sessionsRes, teachersRes, roomsRes]) => {
        const sessionItems = sessionsRes.data?.sessions ?? sessionsRes.data ?? [];
        const resolvedCenterName =
          sessionsRes.data?.center?.name ??
          sessionsRes.data?.centerName ??
          sessionItems[0]?.center?.name ??
          sessionItems[0]?.center_name ??
          "مركزك";
        const teacherItems = teachersRes.data?.teachers ?? teachersRes.data ?? [];
        const roomItems = roomsRes.data?.rooms ?? roomsRes.data ?? [];
        setSessions(sessionItems.map(mapSession));
        setTeachersCount(teacherItems.length);
        setRoomsCount(roomItems.length);
        setCenterName(resolvedCenterName);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  }, []);

  const todaySessions = useMemo(
    () => sessions.filter((session) => isSameDay(session.scheduledAt)),
    [sessions]
  );

  const todayCount = todaySessions.length;
  const adminName = user?.email?.split("@")[0] ?? "مشرف";
  const activityFeed = useMemo(() => {
    const items: { text: string; time: string; icon: string }[] = [];
    if (teachersCount > 0) {
      items.push({
        text: "تم إضافة مدرس جديد",
        time: formatRelative(new Date()),
        icon: "👨‍🏫",
      });
    }
    if (sessions.length > 0) {
      const booked = sessions[0]?.bookedSeats ?? 0;
      items.push({
        text: `تم حجز ${booked} مقعد في حصة ${sessions[0]?.subject ?? ""}`,
        time: formatRelative(sessions[0]?.scheduledAt ?? new Date()),
        icon: "📅",
      });
    }
    if (sessions.some((session) => session.status === "cancelled")) {
      items.push({
        text: "تم إلغاء حجز",
        time: formatRelative(new Date()),
        icon: "❌",
      });
    }
    return items.slice(0, 3);
  }, [sessions, teachersCount]);

  const handleCancel = () => {
    if (!cancelTarget) return;
    setCanceling(true);
    api
      .put(`/centers/sessions/${cancelTarget.id}/cancel`)
      .then(() => {
        setSessions((prev) =>
          prev.map((item) =>
            item.id === cancelTarget.id ? { ...item, status: "cancelled" } : item
          )
        );
        setToast(
          `اتلغت الحصة وترجعت فلوس ${cancelTarget.bookingsCount} طالب ✓`
        );
        setCancelTarget(null);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setCanceling(false));
  };

  return (
    <AdminShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}

        <section className="rounded-3xl bg-gradient-to-l from-primary/20 to-primary/5 p-6">
          <h1 className="text-2xl font-semibold">أهلاً، {adminName} 👋</h1>
          <p className="mt-2 text-sm text-muted">إدارة مركز {centerName}</p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "📅", label: "إجمالي الحصص", value: sessions.length },
            { icon: "👨‍🏫", label: "المدرسين", value: teachersCount },
            { icon: "🚪", label: "الـ Rooms", value: roomsCount },
            { icon: "✅", label: "حصص النهارده", value: todayCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {stat.icon}
                </span>
                <div>
                  <p className="text-lg font-semibold">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">حصص النهارده</h2>
            <Link href="/admin/sessions" className="text-sm text-primary">
              عرض كل الحصص
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {todaySessions.length === 0 ? (
              <EmptyState
                illustration="📅"
                title="مفيش حصص النهارده"
                subtitle="تابع جدول الحصص لإدارة الأسبوع"
              />
            ) : (
              todaySessions.map((session) => {
                const fill = getSeatFill(session.bookedSeats, session.capacity);
                return (
                  <div
                    key={session.id}
                    className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-muted">
                          {formatArabicTime(session.scheduledAt)}
                        </p>
                        <p className="text-base font-semibold">
                          {session.subject} · {session.gradeLevel}
                        </p>
                        <p className="text-xs text-muted">{session.teacherName}</p>
                      </div>
                      <div className="flex-1 md:px-6">
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${getSeatColor(fill)}`}
                            style={{ width: `${fill}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {session.bookedSeats} / {session.capacity} مقعد
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-xs md:items-end">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            session.status === "scheduled"
                              ? "bg-secondary/15 text-secondary"
                              : session.status === "ongoing"
                              ? "animate-pulse bg-success/15 text-success"
                              : session.status === "completed"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {session.status === "scheduled"
                            ? "قادمة"
                            : session.status === "ongoing"
                            ? "جارية الآن 🟢"
                            : session.status === "completed"
                            ? "انتهت"
                            : "ملغية"}
                        </span>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/attendance?sessionId=${session.id}`}
                            className="text-primary"
                          >
                            عرض الحضور
                          </Link>
                          {session.status === "scheduled" && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(session)}
                              className="text-error"
                            >
                              إلغاء
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">آخر النشاطات</h2>
          <div className="mt-4 space-y-3">
            {activityFeed.map((item, index) => (
              <div
                key={`${item.text}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
                <span className="text-xs text-muted">{item.time}</span>
              </div>
            ))}
          </div>
        </section>

        {cancelTarget && (
          <ConfirmModal
            title="⚠️ هتلغي الحصة دي؟"
            message={`هيتم إلغاء ${cancelTarget.bookingsCount} حجز وإرجاع الفلوس للطلاب. مش هتقدر ترجع الحصة تاني`}
            confirmText={canceling ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
            confirmColor="bg-error"
            onConfirm={handleCancel}
            onCancel={() => setCancelTarget(null)}
          />
        )}
      </PageTransition>
    </AdminShell>
  );
}

function mapSession(item: any): SessionItem {
  return {
    id: item.id ?? item._id,
    subject: item.subject ?? "",
    gradeLevel: item.gradeLevel ?? item.grade_level ?? "",
    teacherName: item.teacher?.name ?? item.teacherName ?? "مدرس",
    scheduledAt: item.scheduled_at ?? item.scheduledAt ?? item.date ?? new Date(),
    status: item.status ?? "scheduled",
    bookedSeats: item.bookedSeats ?? item.booked_count ?? item.bookings_count ?? 0,
    capacity: item.capacity ?? item.totalSeats ?? 0,
    bookingsCount: item.bookingsCount ?? item.bookings_count ?? 0,
  };
}
