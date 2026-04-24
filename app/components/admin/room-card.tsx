import Link from "next/link";
import { CopyableCode } from "./copyable-code";

export type AdminRoom = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherId?: string;
  teacherName: string;
  membersCount: number;
  contentCount: number;
  accessCode: string;
  paidPrice?: number;
  isActive: boolean;
};

const gradients = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-primary/70 to-secondary/70",
];

export function RoomCard({
  room,
  onToggleActive,
  onMembers,
  onRegenerate,
  onEdit,
  onDelete,
}: {
  room: AdminRoom;
  onToggleActive: (room: AdminRoom) => void;
  onMembers: (room: AdminRoom) => void;
  onRegenerate: (room: AdminRoom) => void;
  onEdit: (room: AdminRoom) => void;
  onDelete: (room: AdminRoom) => void;
}) {
  const gradient = gradients[room.id.length % gradients.length];
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
      <div className={`bg-gradient-to-l ${gradient} p-4 text-white`}>
        <h3 className="text-lg font-semibold">{room.name}</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/20 px-3 py-1">{room.subject}</span>
          <span className="rounded-full bg-white/20 px-3 py-1">
            {room.gradeLevel}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <p className="text-muted">👨‍🏫 {room.teacherName}</p>
        <p className="text-muted">👥 {room.membersCount} طالب</p>
        <p className="text-muted">📚 {room.contentCount} محتوى</p>
        <CopyableCode code={room.accessCode} />
        {room.paidPrice !== undefined && (
          <p className="text-muted">💰 {room.paidPrice} جنيه للوصول الكامل</p>
        )}

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={room.isActive}
            onChange={() => onToggleActive(room)}
          />
          {room.isActive ? "نشط" : "موقف"}
        </label>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4 text-xs">
        <Link
          href={`/admin/rooms/${room.id}/content`}
          className="rounded-full border border-primary px-3 py-1 text-primary"
        >
          إدارة المحتوى
        </Link>
        <button
          type="button"
          onClick={() => onMembers(room)}
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
        >
          الأعضاء
        </button>
        <button
          type="button"
          onClick={() => onRegenerate(room)}
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
        >
          تجديد الكود
        </button>
        {/* <button
          type="button"
          onClick={() => onEdit(room)}
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
        >
          تعديل
        </button> */}
        <button
          type="button"
          onClick={() => onDelete(room)}
          className="rounded-full border border-error px-3 py-1 text-error"
        >
          حذف
        </button>
      </div>
    </div>
  );
}
