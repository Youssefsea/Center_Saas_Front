import { motion } from "framer-motion";

export type RoomContentItem = {
  id: string;
  type: "video" | "pdf" | "link";
  title: string;
  description?: string | null;
  url?: string | null;
  isFree: boolean;
  sortOrder: number;
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

export function ContentItem({
  content,
  isLocked,
  onLockedClick,
  onOpen,
}: {
  content: RoomContentItem;
  isLocked: boolean;
  onLockedClick: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.div
      whileHover={isLocked ? undefined : { y: -4 }}
      onClick={isLocked ? onLockedClick : onOpen}
      className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-card ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${typeStyles[content.type]}`}
        >
          {typeIcons[content.type]}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">{content.title}</h3>
          {content.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {content.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className={`rounded-full px-3 py-1 ${
                content.isFree ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
              }`}
            >
              {content.isFree ? "مجاني" : "مدفوع"}
            </span>
          </div>
        </div>
      </div>
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100/80 text-sm text-muted backdrop-blur">
          <span className="text-2xl">🔒</span>
          <span>محتوى مدفوع — ترقي للوصول</span>
        </div>
      )}
    </motion.div>
  );
}
