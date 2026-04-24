import Link from "next/link";
import { memo } from "react";
import { StarRating } from "./star-rating";

export type TeacherSummary = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  subjects?: string[];
  gradeLevels?: string[];
  rating?: number | null;
  reviewsCount?: number | null;
};

export const TeacherCard = memo(function TeacherCard({
  teacher,
}: {
  teacher: TeacherSummary;
}) {
  const initials =
    teacher.name
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("") ?? "؟";
console.log("Rendering TeacherCard for:", teacher);
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-card p-5 shadow-card transition hover:scale-[1.02] hover:shadow-lift">
      <div>
        <div className="flex items-center gap-3">
          {teacher.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              loading="lazy"
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {initials}
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold">{teacher.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted">
              <StarRating value={teacher.rating ?? 0} size="sm" />
              {typeof teacher.reviewsCount === "number" && (
                <span dir="ltr">({teacher.reviewsCount})</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {teacher.subjects?.map((subject) => (
            <span
              key={subject}
              className="rounded-full bg-secondary/15 px-2 py-1 text-xs text-secondary"
            >
              {subject}
            </span>
          ))}
        </div>

        <div className="mt-3 text-xs text-muted">
          {teacher.gradeLevels?.join(" · ")}
        </div>
      </div>

      <Link
        href={`/teachers/${teacher.id}`}
        className="btn-ripple mt-4 inline-flex items-center justify-center rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.97]"
      >
        عرض البروفايل
      </Link>
    </div>
  );
});
