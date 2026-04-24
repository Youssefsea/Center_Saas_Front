import Link from "next/link";

export type RoomItem = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  centerName?: string;
  accessTier: "free" | "paid";
  contentCount?: number | null;
  hasPaidContent?: boolean;
};

export function RoomCard({
  room,
  compact,
}: {
  room: RoomItem;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-card transition hover:scale-[1.02] hover:shadow-lift">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{room.name}</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-secondary">
            {room.subject}
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
            {room.gradeLevel}
          </span>
        </div>
        <p className="text-sm text-muted">{room.teacherName}</p>
        {room.centerName && (
          <p className="text-xs text-muted">📍 {room.centerName}</p>
        )}
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs ${
            room.accessTier === "free"
              ? "bg-success/10 text-success"
              : "bg-primary/10 text-primary"
          }`}
        >
          {room.accessTier === "free" ? "مجاني" : "مدفوع"}
        </span>
        {!compact && room.contentCount !== undefined && (
          <p className="text-xs text-muted">{room.contentCount} محتوى</p>
        )}
        {room.accessTier === "free" && room.hasPaidContent && (
          <div className="rounded-2xl bg-accent/10 px-3 py-2 text-xs text-accent">
            🔓 ترقية للوصول للمحتوى الكامل
          </div>
        )}
      </div>
      <Link
        href={compact ? `/rooms/${room.id}` : `/rooms/${room.id}/content`}
        className="btn-ripple mt-4 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
      >
        فتح الـ Room
      </Link>
    </div>
  );
}
