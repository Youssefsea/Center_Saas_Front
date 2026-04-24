"use client";

import { memo } from "react";
import { EmptyState } from "../../components/empty-state";

type TeacherItem = {
  id: string;
  name: string;
  bio?: string | null;
  subjects: string[];
  gradeLevels: string[];
  rating: number;
  reviewsCount: number;
  sessionsCount: number;
};

type TeachersListProps = {
  teachers: TeacherItem[];
  onRemove: (teacher: TeacherItem) => void;
};

export const TeachersList = memo(function TeachersList({
  teachers,
  onRemove,
}: TeachersListProps) {
  if (teachers.length === 0) {
    return (
      <EmptyState
        illustration="👨‍🏫"
        title="مفيش مدرسين لسه"
        subtitle="ابدأ بإضافة أول مدرس"
      />
    );
  }
console.log("TeachersList render with teachers:", teachers);
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {teachers.map((teacher) => (
        <div
          key={teacher.id}
          className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
              {teacher.name.slice(0, 1)}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold">{teacher.name}</h3>
              {teacher.bio && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">{teacher.bio}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {teacher.subjects.slice(0, 3).map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-secondary/15 px-2 py-1 text-secondary"
                  >
                    {subject}
                  </span>
                ))}
                {teacher.subjects.length > 3 && (
                  <span className="text-muted">+{teacher.subjects.length - 3}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                {teacher.gradeLevels.map((level) => (
                  <span key={level} className="rounded-full bg-slate-100 px-2 py-1">
                    {level}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                ⭐ {teacher.rating} ({teacher.reviewsCount} تقييم)
              </p>
              <p className="text-xs text-muted">حصص المركز: {teacher.sessionsCount}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <a
              href={`/teachers/${teacher.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-primary px-3 py-1 text-primary"
            >
              عرض البروفايل
            </a>
            <button
              type="button"
              onClick={() => onRemove(teacher)}
              className="rounded-full border border-error px-3 py-1 text-error"
            >
              إزالة من المركز
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});
