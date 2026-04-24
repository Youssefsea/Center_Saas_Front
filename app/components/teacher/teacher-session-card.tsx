"use client";

import { getCountdownLabel, getSeatColor, getSeatFill, formatArabicDateTime } from "../../lib/teacher-utils";

export type TeacherSession = {
  id: string;
  subject: string;
  gradeLevel: string;
  centerName: string;
  centerAddress?: string;
  scheduledAt: string;
  duration: number;
  price: number;
  seatsBooked: number;
  capacity: number;
  status: "scheduled" | "completed" | "cancelled";
  attendedCount?: number;
  confirmedBookings?: number;
};

export function TeacherSessionCard({
  session,
  showAttendance,
}: {
  session: TeacherSession;
  showAttendance?: boolean;
}) {
  const fill = getSeatFill(session.seatsBooked, session.capacity);
  const countdown = getCountdownLabel(session.scheduledAt);
  const confirmed = session.confirmed_bookings|| 0;
  const attended = session.total_attended || 0;
  const attendanceRate = confirmed > 0 ? Math.round((attended / confirmed) * 100) : 0;
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">
            {session.subject} · {session.gradeLevel}
          </p>
          <p className="text-sm text-muted">📍 {session.centerName}</p>
      
        </div>
        <div className="text-sm text-muted">
          <p>📅 {formatArabicDateTime(session.scheduledAt)}</p>
          <p>⏱ {session.duration} دقيقة</p>
          <p>💰 {session.price} جنيه</p>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="h-2 w-36 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${getSeatColor(fill)}`}
              style={{ width: `${fill}%` }}
            />
          </div>
          <p className="text-muted">
            {session.seatsBooked} / {session.capacity} مقعد محجوز
          </p>
          <span
            className={`w-fit rounded-full px-3 py-1 ${
              session.status === "scheduled"
                ? "bg-secondary/15 text-secondary"
                : session.status === "completed"
                ? "bg-success/10 text-success"
                : "bg-error/10 text-error"
            }`}
          >
            {session.status === "scheduled"
              ? "قادمة"
              : session.status === "completed"
              ? "مكتملة ✓":
              session.status === "cancelled"
              ? "ملغية"
              : session.status==="ended"
              ? "انتهت"
              : "؟"}
          </span>
        </div>
      </div>

      {countdown && session.status === "scheduled" && (
        <div className="mt-3">
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              countdown.variant === "today"
                ? "animate-pulse bg-accent text-white"
                : "bg-secondary/15 text-secondary"
            }`}
          >
            {countdown.label}
          </span>
        </div>
      )}

      {showAttendance && session.status === "completed" && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          <span>حضر {attended} طالب</span>
          <span>من أصل {confirmed} حجز</span>
          <span>{attendanceRate}% حضور</span>
        </div>
      )}
    </div>
  );
}
