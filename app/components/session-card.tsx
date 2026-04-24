import { memo } from "react";

export type SessionSummary = {
  id: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  startsAt: string;
  durationMinutes: number;
  price: number;
  availableSeats: number;
};

type SessionCardProps = {
  session: SessionSummary;
  isAuthenticated: boolean;
  isStudent: boolean;
  onBook: (session: SessionSummary) => void;
  onLogin: () => void;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  });

export const SessionCard = memo(function SessionCard({
  session,
  isAuthenticated,
  isStudent,
  onBook,
  onLogin,
}: SessionCardProps) {
  const isFull = session.availableSeats <= 0;
  const seatsColor =
    session.availableSeats <= 0
      ? "bg-error/10 text-error"
      : session.availableSeats <= 5
      ? "bg-accent/10 text-accent"
      : "bg-success/10 text-success";

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs text-secondary">
          {session.subject}
        </span>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
          {session.gradeLevel}
        </span>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
          {session.price} جنيه
        </span>
      </div>
      <div>
        <p className="text-sm text-muted">المدرس</p>
        <p className="text-base font-semibold">{session.teacherName}</p>
      </div>
      <div className="text-sm text-muted">
         {formatDate(session.startsAt)}، الساعة {formatTime(session.startsAt)}،
      </div>
      <div className="text-sm text-muted">
         {formatDate(session.endAt)}، الساعة {formatTime(session.endAt)}،
      </div>
      
      <div className="text-sm text-muted">المدة: {session.durationMinutes} دقيقة</div>
      <div
        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs ${seatsColor}`}
      >
        {session.availableSeats} مقعد متاح
      </div>
      <div className="mt-2">
        {isFull ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
          >
            الحصة مكتملت
          </button>
        ) : !isAuthenticated ? (
          <button
            type="button"
            onClick={onLogin}
            className="btn-ripple w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.97]"
          >
            سجل دخول للحجز
          </button>
        ) : !isStudent ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
          >
            الحجز متاح للطلاب فقط
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onBook(session)}
            className="btn-ripple w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.97]"
          >
            احجز دلوقتي
          </button>
        )}
      </div>
    </div>
  );
});
