"use client";

import Link from "next/link";
import { memo } from "react";
import { BookingCard, BookingItem } from "../../components/student/booking-card";
import { EmptyState } from "../../components/empty-state";

type UpcomingBookingsSectionProps = {
  bookings: BookingItem[];
  loading: boolean;
  onQr: (item: BookingItem) => void;
  onCancel: (item: BookingItem) => void;
};

export const UpcomingBookingsSection = memo(function UpcomingBookingsSection({
  bookings,
  loading,
  onQr,
  onCancel,
}: UpcomingBookingsSectionProps) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">حصصك الجاية</h2>
          <p className="text-sm text-muted font-english" dir="ltr">
            Upcoming Sessions
          </p>
        </div>
        <Link href="/my-bookings" className="text-sm text-primary">
          عرض كل الحجوزات
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-muted">
            جارٍ تحميل الحجوزات...
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            illustration="📅"
            title="مفيش حصص قادمة، احجز دلوقتي!"
            subtitle="ابدأ دور على مركز أو مدرس مناسب"
            actionLabel="ابدأ البحث"
            actionHref="/search"
          />
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              variant="dashboard"
              onQr={onQr}
              onCancel={onCancel}
            />
          ))
        )}
      </div>
    </section>
  );
});
