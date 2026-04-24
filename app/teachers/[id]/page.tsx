"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CenterCard } from "../../components/center-card";
import { EmptyState } from "../../components/empty-state";
import { ErrorToast } from "../../components/error-toast";
import { PageTransition } from "../../components/page-transition";
import { SkeletonCard } from "../../components/skeleton-card";
import { StarRating } from "../../components/star-rating";
import { api, normalizeApiError } from "../../lib/api";
import { useAuth } from "../../providers/auth-provider";
import useModalKeyboard from "../../hooks/useModalKeyboard";

type TeacherDetails = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  subjects?: string[];
  gradeLevels?: string[];
  rating?: number | null;
  reviewsCount?: number | null;
  bio?: string | null;
  centers?: any[];
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName?: string | null;
};

const formatRelativeDate = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    return `منذ ${diffHours} ساعات`;
  }
  if (diffDays < 7) {
    return `منذ ${diffDays} أيام`;
  }
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function TeacherDetailsPage() {
  const params = useParams<{ id: string }>();
  const { role, isAuthenticated } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const reviewCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    let active = true;
    const controller = new AbortController();
    const fetchTeacher = async () => {
      setLoading(true);
      try {
        const [teacherResponse, reviewsResponse] = await Promise.all([
          api.get(`/teachers/${params.id}`, { signal: controller.signal }),
          api
            .get(`/teachers/${params.id}/reviews`, { signal: controller.signal })
            .catch((error) => {
              const normalized = normalizeApiError(error);
              if (normalized.status === 404) {
                return { data: [] };
              }
              throw error;
            }),
        ]);
        if (!active) return;
        const teacherData = teacherResponse.data?.teacher ?? teacherResponse.data;
        const reviewsData =
          reviewsResponse.data?.reviews ?? reviewsResponse.data ?? [];
        setTeacher({
          id: teacherData.id ?? teacherData._id,
          name: teacherData.teacher_name,
          avatarUrl: teacherData.avatarUrl ?? teacherData.avatar ?? null,
          subjects: teacherData.subjects ?? [],
          gradeLevels: teacherData.gradeLevels ?? teacherData.grade_levels ?? [],
          rating: teacherData.rating ?? null,
          reviewsCount: teacherData.total_reviews,
          bio: teacherData.bio ?? null,
          centers: teacherData.centers ?? [],
        });
        setReviews(
          reviewsData.map((review: any) => ({
            id: review.id ?? review._id,
            rating: review.rating ?? 0,
            comment: review.comment ?? "",
            createdAt:
              review.createdAt ?? review.created_at ?? new Date().toISOString(),
            reviewerName: review.reviewerName ?? review.studentName ?? null,
          }))
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTeacher();
    return () => {
      active = false;
      controller.abort();
    };
  }, [params?.id]);

  const ratingBreakdown = useMemo(() => {
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((review) => review.rating === star).length;
      return { star, count, percent: (count / total) * 100 };
    });
  }, [reviews]);

  const handleToastClose = useCallback(() => setToast(null), []);
  const openReview = useCallback(() => setReviewOpen(true), []);
  const closeReview = useCallback(() => setReviewOpen(false), []);
  const handleReviewRatingChange = useCallback((value: number) => setReviewRating(value), []);
  const handleReviewCommentChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setReviewComment(event.target.value),
    []
  );

  const submitReview = useCallback(() => {
    if (!params?.id) return;
    if (reviewRating < 1) {
      setReviewError("من فضلك اختر تقييم.");
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    api
      .post("/reviews", {
        teacherId: params.id,
        rating: reviewRating,
        comment: reviewComment,
      })
      .then((response) => {
        const review = response.data?.review ?? response.data;
        if (review) {
          setReviews((prev) => [
            {
              id: review.id ?? review._id ?? `${Date.now()}`,
              rating: review.rating ?? reviewRating,
              comment: review.comment ?? reviewComment,
              createdAt: review.createdAt ?? new Date().toISOString(),
              reviewerName: review.reviewerName ?? null,
            },
            ...prev,
          ]);
        }
        setReviewOpen(false);
        setReviewRating(0);
        setReviewComment("");
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.status === 403) {
          setReviewError("لازم تحضر الحصة الأول عشان تقيّم");
        } else {
          setReviewError(normalized.message);
        }
      })
      .finally(() => setSubmittingReview(false));
  }, [params?.id, reviewComment, reviewRating]);

  // التصليح: نقل initials هنا ليكون قبل الـ return المبكر
  const initials = useMemo(
    () =>
      teacher?.name
        ?.split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("") ?? "؟",
    [teacher?.name]
  );

  useModalKeyboard(reviewOpen, closeReview, reviewCloseRef);

  // حالات الـ Return المبكر (يجب أن تكون بعد كل الـ Hooks)
  if (loading) {
    return (
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="h-48" />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (!teacher) {
    return (
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <EmptyState
          illustration="👨‍🏫"
          title="مفيش بيانات للمدرس"
          subtitle="ارجع للبحث وجرب مدرس تاني"
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {toast && <ErrorToast message={toast} onClose={handleToastClose} />}

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative">
            {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.name}
                  loading="lazy"
                  className="h-24 w-24 rounded-full object-cover"
                />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
                {initials}
              </div>
            )}
            <span className="absolute bottom-1 left-1 h-4 w-4 rounded-full border-2 border-white bg-success" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{teacher.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <StarRating value={teacher.rating ?? 0} />
              {typeof teacher.reviewsCount === "number" && (
                <span dir="ltr">({teacher.reviewsCount} تقييم)</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {teacher.subjects?.map((subject) => (
                <span
                  key={subject}
                  className="rounded-full bg-secondary/15 px-3 py-1 text-xs text-secondary"
                >
                  {subject}
                </span>
              ))}
            </div>
            <div className="mt-2 text-sm text-muted">
              {teacher.gradeLevels?.join(" · ")}
            </div>
            {teacher.bio && (
              <p className="mt-3 text-sm text-muted">{teacher.bio}</p>
            )}
          </div>
        </div>
      </section>

      {/* باقي الـ JSX كما هو... */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">بيدرّس في</h2>
            <p className="text-sm text-muted font-english" dir="ltr">
              Teaching At
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teacher.centers?.length ? (
            teacher.centers.map((center: any) => (
              <CenterCard
                key={center.id ?? center._id}
                center={{
                  id: center.center_id ,
                  name: center.name ?? center.center_name ?? "مركز تعليمي",
                  address: center.center_address ,
                }}
              />
            ))
          ) : (
            <EmptyState
              illustration="🏫"
              title="مفيش مراكز متاحة"
              subtitle="المدرس لم يحدد المراكز بعد"
            />
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">آراء الطلاب</h2>
            <p className="text-sm text-muted font-english" dir="ltr">
              Student Reviews
            </p>
          </div>
          {isAuthenticated && role === "student" && (
            <button
              type="button"
              onClick={openReview}
              className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              اكتب تقييم
            </button>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-4">
              {ratingBreakdown.map((item) => (
                <div key={item.star} className="flex items-center gap-3 text-sm">
                  <span>{item.star}★</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="text-muted">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <EmptyState
                  illustration="💬"
                  title="مفيش تقييمات لسه"
                  subtitle="كن أول حد يكتب رأيه"
                />
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {review.reviewerName?.slice(0, 2) ?? "👤"}
                      </div>
                      <div>
                        <StarRating value={review.rating} size="sm" />
                        <p className="text-xs text-muted">
                          {formatRelativeDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">اكتب تقييمك</h3>
              <button
                ref={reviewCloseRef}
                type="button"
                onClick={closeReview}
                aria-label="إغلاق"
                className="text-xl"
              >
                ×
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <StarRating value={reviewRating} onChange={handleReviewRatingChange} size="lg" />
              <textarea
                value={reviewComment}
                onChange={handleReviewCommentChange}
                placeholder="شارك تجربتك..."
                className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              {reviewError && (
                <div className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
                  {reviewError}
                </div>
              )}
              <button
                type="button"
                onClick={submitReview}
                disabled={submittingReview}
                className="btn-ripple w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submittingReview ? "جارٍ الإرسال..." : "إرسال التقييم"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}