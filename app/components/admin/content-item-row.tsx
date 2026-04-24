"use client";

export type AdminContentItem = {
  id: string;
  teacherContentId?: string | null;
  teacherName?: string | null;
  type: "video" | "pdf" | "link";
  title: string;
  description?: string | null;
  url?: string | null;
  isFree: boolean;
  isActive: boolean;
  sortOrder?: number | null;
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

export function ContentItemRow({
  item,
  onEdit,
  onDelete,
  draggableProps,
}: {
  item: AdminContentItem;
  onEdit: () => void;
  onDelete: () => void;
  draggableProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  return (
    <div
      {...draggableProps}
      className={`flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card md:flex-row md:items-center md:justify-between ${
        item.isActive ? "" : "opacity-60"
      }`}
    >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${typeStyles[item.type]}`}
          >
            {typeIcons[item.type]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
            {item.teacherName && (
              <p className="text-xs italic text-muted">
                من محتوى {item.teacherName}
              </p>
            )}
            {item.description && (
              <p className="text-xs text-muted line-clamp-2">{item.description}</p>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-primary truncate"
              >
                {item.url}
              </a>
            )}
          </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full px-3 py-1 ${
            item.isFree ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
          }`}
        >
          {item.isFree ? "مجاني" : "مدفوع"}
        </span>
        <span
          className={`rounded-full px-3 py-1 ${
            item.isActive ? "bg-success/10 text-success" : "bg-slate-200 text-slate-600"
          }`}
        >
          {item.isActive ? "نشط" : "موقف"}
        </span>
        <span className="cursor-move rounded-full border border-slate-200 px-3 py-1">
          ⠿
        </span>
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
          className="rounded-full border border-error px-3 py-1 text-error"
        >
          🗑 حذف
        </button>
      </div>
    </div>
  );
}
