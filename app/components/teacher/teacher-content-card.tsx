export type TeacherContentItem = {
  id: string;
  type: "video" | "pdf" | "link";
  title: string;
  description?: string | null;
  url: string;
  isFree: boolean;
  isActive: boolean;
  usedInRoomsCount: number;
};

const typeStyles: Record<string, string> = {
  video: "bg-primary/10 text-primary",
  pdf: "bg-error/10 text-error",
  link: "bg-secondary/10 text-secondary",
};

const typeIcons: Record<string, string> = {
  video: "🎬",
  pdf: "📄",
  link: "🔗",
};

export function TeacherContentCard({
  content,
  onEdit,
  onDelete,
}: {
  content: TeacherContentItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-card ${
        content.isActive ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${typeStyles[content.type]}`}
        >
          {typeIcons[content.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold line-clamp-2 break-words">
            {content.title}
          </p>
          {content.description && (
            <p className="mt-1 line-clamp-2 break-words text-sm text-muted">
              {content.description}
            </p>
          )}
          <a
            href={content.url}
            target="_blank"
            rel="noreferrer"
            title={content.url}
            className="mt-2  block truncate text-xs text-primary"
          >
            {content.url}
          </a>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-3 py-1 ${
                content.isFree ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
              }`}
            >
              {content.isFree ? "مجاني" : "مدفوع"}
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                content.isActive ? "bg-success/10 text-success" : "bg-slate-200 text-slate-600"
              }`}
            >
              {content.isActive ? "نشط" : "موقف"}
            </span>
            <span
              className={`text-xs ${
                content.usedInRoomsCount > 0 ? "text-secondary" : "text-muted"
              }`}
            >
              {content.usedInRoomsCount > 0
                ? `مستخدم في ${content.usedInRoomsCount} room`
                : "مش مستخدم لسه"}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-slate-200 px-3 py-1"
        >
          ✏️ تعديل
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={`rounded-full border px-3 py-1 ${
            content.usedInRoomsCount > 0
              ? "border-accent text-accent"
              : "border-error text-error"
          }`}
        >
          {content.usedInRoomsCount > 0 ? "⏸ إيقاف" : "🗑 حذف"}
        </button>
      </div>
    </div>
  );
}
