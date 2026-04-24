import Link from "next/link";
import { formatArabicDate } from "../../lib/teacher-utils";

export type TeacherCenter = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  rating?: number | null;
  joinedAt?: string | null;
  mySessionsCount: number;
  myRoomsCount: number;
  contentCount?: number | null;
};

const gradients = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
];

export function TeacherCenterCard({
  center,
  compact,
}: {
  center: TeacherCenter;
  compact?: boolean;
}) {
  const gradient = gradients[center.id.length % gradients.length];
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
      <div className={`bg-gradient-to-l ${gradient} p-4 text-white`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg">
            {center.name.slice(0, 2)}
          </div>
          <div>
            <p className="text-base font-semibold">{center.name}</p>
            <p className="text-xs text-white/80">{center.address}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2 text-sm">
        {!compact && (
          <>
            {center.phone && (
              <a href={`tel:${center.phone}`} className="text-muted">
                📞 {center.phone}
              </a>
            )}
     
            {center.joinedAt && (
              <p className="text-xs text-muted">
                عضو منذ {formatArabicDate(center.joinedAt)}
              </p>
            )}
          </>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span>{center.mySessionsCount} حصة في المركز ده</span>
          <span>{center.myRoomsCount} room</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4 text-xs">
        {compact ? (
          <Link
            href={`/teacher/content?centerId=${center.id}`}
            className="rounded-full border border-primary px-3 py-1 text-primary"
          >
            عرض المحتوى
          </Link>
        ) : (
          <>
            <Link
              href={`/teacher/sessions?centerId=${center.id}`}
              className="rounded-full border border-primary px-3 py-1 text-primary"
            >
              عرض الحصص
            </Link>
            <Link
              href={`/teacher/content?centerId=${center.id}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
            >
              إدارة المحتوى
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
