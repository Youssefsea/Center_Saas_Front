"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { TeacherShell } from "../../components/teacher/teacher-shell";
import { PageTransition } from "../../components/page-transition";
import { CountUp } from "../../components/student/count-up";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import {
  TeacherSessionCard,
  TeacherSession,
} from "../../components/teacher/teacher-session-card";
import {
  TeacherCenterCard,
  TeacherCenter,
} from "../../components/teacher/teacher-center-card";
import {
  TeacherReviewCard,
  TeacherReview,
} from "../../components/teacher/teacher-review-card";
import { StarRating } from "../../components/star-rating";
import { api, normalizeApiError } from "../../lib/api";
import { formatRating, getTeacherGreeting } from "../../lib/teacher-utils";

type TeacherInfo = {
  name: string;
  isVerified: boolean;
};

type TeacherStats = {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalStudents: number;
  rating: number;
  totalReviews: number;
  totalCenters: number;
};

export default function TeacherDashboardPage() {
  const [teacher, setTeacher] = useState<TeacherInfo>({
    name: "المدرس",
    isVerified: false,
  });
  const [stats, setStats] = useState<TeacherStats>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalStudents: 0,
    rating: 0,
    totalReviews: 0,
    totalCenters: 0,
  });
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [centers, setCenters] = useState<TeacherCenter[]>([]);
  const [reviews, setReviews] = useState<TeacherReview[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/teacher/me"),
      api.get("/teacher/me/stats"),
      api.get("/teacher/me/sessions", { params: { status: "scheduled", limit: 3 } }),
      api.get("/teacher/me/centers"),
      api.get("/teacher/me/reviews", { params: { limit: 3, offset: 0 } }),
    ])
      .then(([teacherRes, statsRes, sessionsRes, centersRes, reviewsRes]) => {
        const teacherData = teacherRes.data?.teacher ?? teacherRes.data ?? {};
        const statsData = statsRes.data?.stats ?? statsRes.data ?? {};
        const sessionItems = sessionsRes.data?.sessions ?? sessionsRes.data ?? [];
        const centerItems = centersRes.data?.centers ?? centersRes.data ?? [];
        const reviewItems = reviewsRes.data?.reviews ?? reviewsRes.data ?? [];
        setTeacher(mapTeacher(teacherData));
        setStats(mapStats(statsData));
        const mappedSessions = sessionItems
          .map(mapSession)
          .sort(
            (a, b) =>
              new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
          .slice(0, 3);
        setSessions(mappedSessions);
        setCenters(centerItems.map(mapCenter));
        setReviews(reviewItems.map(mapReview));
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const greeting = getTeacherGreeting();

  return (
    <TeacherShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}

        <section className="rounded-3xl bg-gradient-to-l from-secondary/20 to-primary/20 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">أهلاً، مستر {teacher.name} 👋</h1>
              <p className="mt-2 text-sm text-muted">{greeting}</p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                teacher.isVerified
                  ? "bg-success/10 text-success"
                  : "bg-accent/15 text-accent"
              }`}
            >
              {teacher.isVerified ? "✓ مدرس موثّق" : "في انتظار التوثيق"}
            </span>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`stat-skeleton-${index}`}
                className="skeleton h-28 w-full rounded-3xl border border-slate-100"
              />
            ))
          ) : (
            <>
              <StatCard
                icon="📅"
                label="إجمالي الحصص"
                value={stats.totalSessions}
                sub={`${stats.completedSessions} مكتملة`}
              />
              <StatCard
                icon="⏰"
                label="حصص قادمة"
                value={stats.upcomingSessions}
                sub={
                  stats.upcomingSessions > 0 ? (
                    <span className="flex items-center gap-2 text-accent">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                      عندك حصص قريباً
                    </span>
                  ) : (
                    "مفيش حصص قادمة"
                  )
                }
              />
              <StatCard icon="👥" label="إجمالي الطلاب" value={stats.totalStudents} />
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    ⭐
                  </span>
                  <div>
                    <p className="text-lg font-semibold">{(stats.rating)}</p>
                    <p className="text-xs text-muted">متوسط التقييم</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <StarRating value={stats.rating} size="sm" />
                  <span>({stats.totalReviews} تقييم)</span>
                </div>
              </div>
              <StatCard icon="🏫" label="مراكز أعمل فيها" value={stats.totalCenters} />
            </>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">الحصص القادمة</h2>
              <p className="text-sm text-muted font-english" dir="ltr">
                Upcoming Sessions
              </p>
            </div>
            <Link href="/teacher/sessions" className="text-sm text-primary">
              عرض كل الحصص
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`session-skeleton-${index}`}
                  className="skeleton h-32 w-full rounded-3xl border border-slate-100"
                />
              ))
            ) : sessions.length === 0 ? (
              <EmptyState
                illustration="📅"
                title="مفيش حصص قادمة"
                subtitle="تابع جدولك أول بأول"
              />
            ) : (
              sessions.map((session) => (
                <TeacherSessionCard key={session.id} session={session} />
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">مراكزي</h2>
              <p className="text-sm text-muted font-english" dir="ltr">
                My Centers
              </p>
            </div>
            <Link href="/teacher/centers" className="text-sm text-primary">
              عرض كل المراكز
            </Link>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`center-skeleton-${index}`}
                  className="skeleton h-44 w-72 rounded-3xl border border-slate-100"
                />
              ))
            ) : centers.length === 0 ? (
              <div className="w-full">
                <EmptyState
                  illustration="🏫"
                  title="مش مرتبط بأي مركز لسه"
                  subtitle="المراكز بتضيفك، تواصل مع مركز عشان يضيفك"
                />
              </div>
            ) : (
              centers.slice(0, 3).map((center) => (
                <div key={center.id} className="min-w-[280px]">
                  <TeacherCenterCard center={center} compact />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">آخر التقييمات</h2>
              <p className="text-sm text-muted font-english" dir="ltr">
                Latest Reviews
              </p>
            </div>
            <Link href="/teacher/reviews" className="text-sm text-primary">
              عرض كل التقييمات
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`review-skeleton-${index}`}
                  className="skeleton h-28 w-full rounded-3xl border border-slate-100"
                />
              ))
            ) : reviews.length === 0 ? (
              <EmptyState
                illustration="⭐"
                title="مفيش تقييمات لسه"
                subtitle="لما طلابك يقيّموا، هتظهر هنا"
              />
            ) : (
              reviews.map((review) => (
                <TeacherReviewCard key={review.id} review={review} compact />
              ))
            )}
          </div>
        </section>
      </PageTransition>
    </TeacherShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: number;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <p className="text-lg font-semibold">
            <CountUp value={value} />
          </p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function mapTeacher(data: any): TeacherInfo {
  return {
    name: data.name ?? data.full_name ?? data.user_name ?? data.user?.name ?? "المدرس",
    isVerified: data.is_verified ?? data.isVerified ?? data.verified ?? false,
  };
}

function mapStats(data: any): TeacherStats {
  return {
    totalSessions: data.total_sessions ?? data.totalSessions ?? 0,
    completedSessions: data.completed_sessions ?? data.completedSessions ?? 0,
    upcomingSessions: data.upcoming_sessions ?? data.upcomingSessions ?? 0,
    totalStudents:
      data.total_students_taught ??
      data.total_students ??
      data.totalStudentsTaught ??
      0,
    rating: data.rating ?? data.average_rating ?? 0,
    totalReviews: data.total_reviews ?? data.reviews_count ?? 0,
    totalCenters: data.total_centers ?? data.totalCenters ?? 0,
  };
}

export function mapSession(item: any): TeacherSession {
  const rawStatus = item.status ;
  return {
    id: item.id || null,
    subject: item.subject ||  "مادة",
    gradeLevel:
      item.grade_level || "—",
    centerName:
      item.center_name || "مركز",
    scheduledAt: item.scheduled_at||null,
    duration: item.duration_min||90,
    price: item.price ||undefined,
    seatsBooked:
      item.total_bookings || 0,
    capacity: item.capacity || undefined,
    status:item.status || "scheduled",
    attendedCount:
      item.total_attended || 0,
    confirmedBookings:
      item.confirmed_bookings|| 0,
  };
}

function mapCenter(item: any): TeacherCenter {
  return {
    id: item.id ?? item._id,
    name: item.name ?? item.center_name ?? "مركز",
    address: item.address ?? item.location ?? "",
    phone: item.phone ?? item.phone_number ?? null,
    rating: item.rating ?? item.average_rating ?? null,
    joinedAt: item.joinedAt ?? item.joined_at ?? item.created_at ?? null,
    mySessionsCount:
      item.my_sessions_count ??
      item.mySessionsCount ??
      item.sessions_count ??
      0,
    myRoomsCount:
      item.my_rooms_count ?? item.myRoomsCount ?? item.rooms_count ?? 0,
    contentCount: item.content_count ?? item.contentCount ?? 0,
  };
}

function mapReview(item: any): TeacherReview {
  return {
    id: item.id ?? item._id,
    studentName:
      item.student?.name ?? item.studentName ?? item.student_name ?? "طالب",
    rating: item.rating ?? item.stars ?? 0,
    comment: item.comment ?? item.review ?? "",
    centerName:
      item.center?.name ?? item.centerName ?? item.center_name ?? "مركز",
    subject: item.subject ?? item.session?.subject ?? "",
    gradeLevel: item.gradeLevel ?? item.grade_level ?? item.session?.grade_level ?? "",
    createdAt: item.createdAt ?? item.created_at ?? item.date ?? new Date(),
  };
}
