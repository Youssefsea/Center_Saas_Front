import { StarRating } from "../star-rating";
import { formatRelative } from "../../lib/teacher-utils";

export type TeacherReview = {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  centerName: string;
  subject: string;
  gradeLevel: string;
  createdAt: string;
};

export function TeacherReviewCard({
  review,
  compact,
}: {
  review: TeacherReview;
  compact?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {review.studentName.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-semibold">{review.studentName}</p>
          <StarRating value={review.rating} size="sm" />
        </div>
      </div>
      <p className={`mt-3 text-sm ${compact ? "line-clamp-2" : ""}`}>
        {review.comment}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full bg-secondary/15 px-2 py-1 text-secondary">
          {review.centerName}
        </span>
        <span>
          {review.subject} · {review.gradeLevel}
        </span>
        <span>{formatRelative(review.createdAt)}</span>
      </div>
    </div>
  );
}
