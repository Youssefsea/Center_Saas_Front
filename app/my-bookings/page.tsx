"use client";

import dynamic from "next/dynamic";
import {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StudentLayout } from "../components/student/student-layout";
import { PageTransition } from "../components/page-transition";
import { BookingCard, BookingItem } from "../components/student/booking-card";
import { ErrorToast } from "../components/error-toast";
import { EmptyState } from "../components/empty-state";
import { StarRating } from "../components/star-rating";
import { api, normalizeApiError } from "../lib/api";
import { formatArabicDateTime, isFutureDate } from "../lib/student-utils";
import { useWallet } from "../providers/wallet-provider";
import useModalKeyboard from "../hooks/useModalKeyboard";

const QRModal = dynamic(() => import("../components/student/qr-modal"), {
  ssr: false,
});

type Tab = "all" | "confirmed" | "pending" | "cancelled";

export default function MyBookingsPage() {
  const { refresh } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<BookingItem | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const cancelCloseRef = useRef<HTMLButtonElement | null>(null);
  const reviewCloseRef = useRef<HTMLButtonElement | null>(null);

  const fetchBookings = useCallback((signal?: AbortSignal) => {
    const params = activeTab === "all" ? {} : { status: activeTab };
    return api.get("/bookings/me", { params, signal });
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    fetchBookings(controller.signal)
      .then((response) => {
        const items = response.data?.bookings ?? response.data ?? [];
        setBookings(items.map(mapBooking));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchBookings]);

  const totalCount = useMemo(() => bookings.length, [bookings]);

  const handleToastClose = useCallback(() => setToast(null), []);
  const openReview = useCallback((booking: BookingItem) => {
    setReviewTarget(booking);
    setReviewRating(0);
    setReviewComment("");
    setReviewError(null);
  }, []);

  const handleReviewSubmit = useCallback(() => {
    if (!reviewTarget) return;
    if (!reviewTarget.teacherId) {
      setReviewError("بيانات المدرس غير متاحة حالياً");
      return;
    }
    if (reviewRating < 1) {
      setReviewError("اختار تقييم من 1 إلى 5");
      return;
    }
    setSubmittingReview(true);
    api
      .post("/reviews", {
        teacherId: reviewTarget.teacherId,
        rating: reviewRating,
        comment: reviewComment,
      })
      .then(() => {
        setBookings((prev) =>
          prev.map((item) =>
            item.id === reviewTarget.id ? { ...item, reviewed: true } : item
          )
        );
        setToast("شكراً على تقييمك! ⭐");
        setReviewTarget(null);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.status === 403) {
          setReviewError("لازم تكون حضرت الحصة الأول عشان تقدر تقيّم");
        } else {
          setReviewError(normalized.message);
        }
      })
      .finally(() => setSubmittingReview(false));
  }, [reviewComment, reviewRating, reviewTarget]);

  const handleCancel = useCallback(() => {
    if (!cancelTarget) return;
    setCancelling(true);
    api
      .put(`/bookings/${cancelTarget.id}/cancel`)
      .then(() => {
        return fetchBookings().then((response) => {
          const items = response.data?.bookings ?? response.data ?? [];
          setBookings(items.map(mapBooking));
          setToast("اتلغى الحجز وترجعلك فلوسك ✓");
          refresh();
          setCancelTarget(null);
        });
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setCancelling(false));
  }, [cancelTarget, fetchBookings, refresh]);

  const handleTabClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const value = event.currentTarget.dataset.tab as Tab | undefined;
      if (value) setActiveTab(value);
    },
    []
  );
  const handleOpenQr = useCallback((item: BookingItem) => setSelectedBooking(item), []);
  const handleOpenCancel = useCallback((item: BookingItem) => setCancelTarget(item), []);
  const handleCancelClose = useCallback(() => setCancelTarget(null), []);
  const handleReviewClose = useCallback(() => setReviewTarget(null), []);
  const handleReviewRatingChange = useCallback((value: number) => setReviewRating(value), []);
  const handleReviewCommentChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setReviewComment(event.target.value),
    []
  );
  const handleQrClose = useCallback(() => setSelectedBooking(null), []);

  useModalKeyboard(Boolean(cancelTarget), handleCancelClose, cancelCloseRef);
  useModalKeyboard(Boolean(reviewTarget), handleReviewClose, reviewCloseRef);

  return (
    <StudentLayout>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold">حجوزاتي</h1>
            <p className="text-sm text-muted">{totalCount} حجز</p>
          </div>

          <div className="flex flex-wrap gap-4 border-b border-slate-200 text-sm font-medium">
            {[
              { key: "all", label: "الكل" },
              { key: "confirmed", label: "القادمة" },
              { key: "pending", label: "المنتظرة" },
              { key: "cancelled", label: "الملغية" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                data-tab={tab.key}
                onClick={handleTabClick}
                className={`pb-2 ${
                  activeTab === tab.key
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-muted">
                جارٍ تحميل الحجوزات...
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState
                illustration="📅"
                title="مفيش حجوزات هنا"
                subtitle="جرب تحجز حصة جديدة"
                actionLabel="ابدأ البحث"
                actionHref="/search"
              />
            ) : (
              bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onQr={handleOpenQr}
                  onCancel={handleOpenCancel}
                  onReview={openReview}
                  allowQr={isFutureDate(booking.startsAt)}
                />
              ))
            )}
          </div>
        </div>

        {selectedBooking && selectedBooking.qrCode && (
            <QRModal
              qrCode={selectedBooking.qrCode}
              sessionInfo={`${selectedBooking.subject} · ${formatArabicDateTime(
                selectedBooking.startsAt
              )}`}
              onClose={handleQrClose}
            />
        )}

        {cancelTarget && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">متأكد إنك عايز تلغي؟</h3>
                <button
                  ref={cancelCloseRef}
                  type="button"
                  onClick={handleCancelClose}
                  aria-label="إغلاق"
                  className="text-xl"
                >
                  ×
                </button>
              </div>
              <p className="mt-4 text-sm text-muted">
                هيترجعلك {cancelTarget.price} جنيه في محفظتك
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="btn-ripple flex-1 rounded-full bg-error px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {cancelling ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelClose}
                  className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {reviewTarget && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">اكتب تقييمك</h3>
                <button
                  ref={reviewCloseRef}
                  type="button"
                  onClick={handleReviewClose}
                  aria-label="إغلاق"
                  className="text-xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <div className="text-sm text-muted">{reviewTarget.teacherName}</div>
                <StarRating value={reviewRating} onChange={handleReviewRatingChange} size="lg" />
                <textarea
                  value={reviewComment}
                  onChange={handleReviewCommentChange}
                  placeholder="قولنا رأيك في المدرس..."
                  aria-label="تعليق التقييم"
                  aria-required="true"
                  aria-invalid={Boolean(reviewError)}
                  className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                {reviewError && (
                  <div className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
                    {reviewError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleReviewSubmit}
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
    </StudentLayout>
  );
}

function mapBooking(item: any): BookingItem {
  const rawStatus = item.status ?? item.booking_status ?? item.bookingStatus;
  const statusValue = ["confirmed", "pending", "cancelled", "attended"].includes(
    rawStatus
  )
    ? rawStatus
    : "confirmed";
  return {
    id: item.id ?? item._id,
    subject: item.session?.subject ?? "مادة",
    gradeLevel:  item.session?.grade_level ?? "",
    teacher_name:item.teacher_name??"مدرس",
    teacherId:item.teacher_id??null,
    teacherAvatar: item.teacher?.avatar ?? item.teacher?.avatarUrl ?? null,
    center_name:item.center_name?? "",
   startsAt: new Date(item.session.scheduled_at),
    durationMinutes: item.session.duration_min,
    price: item.amount_paid ?? 0,
    status: statusValue,
    qrCode: item.qr_code ?? null,
    reviewed: item.reviewed ?? item.hasReview ?? false,
  };
}
