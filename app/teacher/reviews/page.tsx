"use client";

import { useEffect, useMemo, useState } from "react";
import { TeacherShell } from "../../components/teacher/teacher-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import { RatingBreakdown } from "../../components/teacher/rating-breakdown";
import {
  TeacherReview,
  TeacherReviewCard,
} from "../../components/teacher/teacher-review-card";
import { StarRating } from "../../components/star-rating";
import { api, normalizeApiError } from "../../lib/api";
import { REVIEWS_LIMIT } from "../../lib/constants";
import { formatRating } from "../../lib/teacher-utils";

const PAGE_LIMIT = REVIEWS_LIMIT;

export default function TeacherReviewsPage() {
  const [reviews, setReviews] = useState<TeacherReview[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReviews(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReviews = (nextOffset: number, replace = false) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);

    api
      .get("/teacher/me/reviews", { params: { limit: PAGE_LIMIT, offset: nextOffset } })
      .then((response) => {
        const items = response.data?.reviews ?? response.data ?? [];
        const mapped = items.map(mapReview);
        setReviews((prev) => (replace ? mapped : [...prev, ...mapped]));
        setOffset(nextOffset + mapped.length);
        setHasMore(mapped.length === PAGE_LIMIT);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  const overallRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  return (
    <TeacherShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">تقييماتي</h1>
            <p className="text-sm text-muted font-english" dir="ltr">
              My Reviews
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-primary">
              {formatRating(overallRating)}
            </p>
            <StarRating value={overallRating} size="sm" />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">متوسط التقييم</p>
              <p className="mt-1 text-3xl font-semibold text-primary">
                {formatRating(overallRating)}
              </p>
              <p className="mt-2 text-sm text-muted">{reviews.length} تقييم</p>
            </div>
            <div className="min-w-[220px]">
              <RatingBreakdown reviews={reviews} />
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`review-loading-${index}`}
                className="skeleton h-28 w-full rounded-3xl border border-slate-100"
              />
            ))
          ) : reviews.length === 0 ? (
            <EmptyState
              illustration="⭐"
              title="مفيش تقييمات لسه"
              subtitle="لما طلابك يحضروا ويقيّموا، هتظهر هنا"
            />
          ) : (
            reviews.map((review) => (
              <TeacherReviewCard key={review.id} review={review} />
            ))
          )}
        </section>

        {hasMore && !loading && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => loadReviews(offset)}
              disabled={loadingMore}
              className="btn-ripple rounded-full border border-primary px-6 py-2 text-sm font-semibold text-primary disabled:opacity-60"
            >
              {loadingMore ? "جارٍ التحميل..." : "تحميل المزيد"}
            </button>
          </div>
        )}
      </PageTransition>
    </TeacherShell>
  );
}

function mapReview(item: any): TeacherReview {
  return {
    id: item.id ?? item._id,
    studentName:
      item.student?.name ?? item.studentName ?? item.student_name ?? "طالب",
    rating: item.rating ?? item.stars ?? 0,
    comment: item.comment ?? item.review ?? "",
    centerName:
      item.center?.name ?? item.centerName ?? item.center_name ?? "مركز",
    subject: item.subject ?? item.session?.subject ?? "",
    gradeLevel: item.gradeLevel ?? item.grade_level ?? item.session?.grade_level ?? "",
    createdAt: item.createdAt ?? item.created_at ?? item.date ?? new Date(),
  };
}
