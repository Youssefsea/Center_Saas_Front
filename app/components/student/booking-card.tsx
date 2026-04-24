"use client";

import { getCountdownLabel, formatArabicDateTime, isFutureDate } from "../../lib/student-utils";

export type BookingItem = {
  id: string;
  subject: string;
  gradeLevel: string;
  teacher_name: string;
  teacherId?: string;
  teacherAvatar?: string | null;
  center_name: string;
  startsAt: Date;
  durationMinutes: number;
  price: number;
  status: "confirmed" | "pending" | "cancelled" | "attended";
  qrCode?: string | null;
  reviewed?: boolean;
};

type BookingCardProps = {
  booking: BookingItem;
  variant?: "dashboard" | "list";
  onQr?: (booking: BookingItem) => void;
  onCancel?: (booking: BookingItem) => void;
  onReview?: (booking: BookingItem) => void;
  allowQr?: boolean;
};

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-accent/10 text-accent",
  cancelled: "bg-error/10 text-error",
  attended: "bg-primary/10 text-primary",
};

const statusLabels: Record<string, string> = {
  confirmed: "مؤكد ✓",
  pending: "في الانتظار",
  cancelled: "ملغي",
  attended: "حضرت ✓",
};

export function BookingCard({
  booking,
  variant = "list",
  onQr,
  onCancel,
  onReview,
  allowQr = true,
}: BookingCardProps) {
  const countdown = getCountdownLabel(booking.startsAt);
  const canCancel =
    (booking.status === "confirmed" || booking.status === "pending") &&
    isFutureDate(booking.startsAt);
  const canShowQr =
    allowQr && (booking.status === "confirmed" || booking.status === "pending");

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">
            {booking.subject} · {booking.gradeLevel}
          </p>
          <p className="text-sm text-muted">{booking.teacher_name}</p>
          <p className="text-xs text-muted">📍 {booking.center_name}</p>
        </div>
        <div className="text-sm text-muted">
          {formatArabicDateTime(booking.startsAt)}
        </div>
      </div>

      {variant === "dashboard" && countdown && (
        <div className="mt-3 flex items-center gap-2">
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

      {variant === "list" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded-full px-3 py-1 ${statusStyles[booking.status]}`}>
            {statusLabels[booking.status]}
          </span>
          <span className="text-muted">
            المدة: {booking.durationMinutes} دقيقة
          </span>
          <span className="text-muted">السعر: {booking.price} جنيه</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canShowQr && (
          <button
            type="button"
            onClick={() => onQr?.(booking)}
            className="btn-ripple rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
          >
            عرض الـ QR
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => onCancel?.(booking)}
            className="rounded-full border border-error px-4 py-2 text-sm font-semibold text-error"
          >
            إلغاء الحجز
          </button>
        )}
        {booking.status === "attended" && !booking.reviewed && (
          <button
            type="button"
            onClick={() => onReview?.(booking)}
            className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            اكتب تقييم
          </button>
        )}
      </div>
    </div>
  );
}
