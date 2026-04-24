"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentLayout } from "../components/student/student-layout";
import { PageTransition } from "../components/page-transition";
import { BookingItem } from "../components/student/booking-card";
import { RoomItem } from "../components/student/room-card";
import { ErrorToast } from "../components/error-toast";
import { api, normalizeApiError } from "../lib/api";
import { formatArabicDateTime, getTimeGreeting, isFutureDate } from "../lib/student-utils";
import { useAuth } from "../providers/auth-provider";
import { useWallet } from "../providers/wallet-provider";
import { CancelBookingModal } from "./components/CancelBookingModal";
import { DashboardStats } from "./components/DashboardStats";
import { RoomsSection } from "./components/RoomsSection";
import { UpcomingBookingsSection } from "./components/UpcomingBookingsSection";

const QRModal = dynamic(() => import("../components/student/qr-modal").then((mod) => mod.QRModal), { ssr: false });

export default function DashboardPage() {
  const { user } = useAuth();
  const { balance, refresh } = useWallet();
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(
    (signal?: AbortSignal) =>
      api.get("/bookings/me", { params: { status: "confirmed" }, signal }),
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      refresh(controller.signal),
      fetchBookings(controller.signal),
      api.get("/rooms/me", { signal: controller.signal }),
    ])
      .then(([, bookingsResponse, roomsResponse]) => {
        const bookingsData = bookingsResponse.data?.bookings ?? bookingsResponse.data ?? [];
        const roomsData = roomsResponse.data?.rooms ?? roomsResponse.data ?? [];

        const mappedBookings = bookingsData.map(mapBooking).filter(Boolean);
        const upcoming = mappedBookings
          .filter((booking) => isFutureDate(booking.startsAt))
          .sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
          )
          .slice(0, 3);
        setBookings(upcoming);
        setRooms(roomsData.map(mapRoom).slice(0, 3));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchBookings, refresh]);

  const displayName = user?.email?.split("@")[0] ?? "طالب";
  const greeting = getTimeGreeting();

  const handleToastClose = useCallback(() => setToast(null), []);
  const handleCancel = useCallback(() => {
    if (!cancelTarget) return;
    setCancelling(true);
    api
      .put(`/bookings/${cancelTarget.id}/cancel`)
      .then(() => {
        return fetchBookings().then((response) => {
          const items = response.data?.bookings ?? response.data ?? [];
          const mappedBookings = items.map(mapBooking).filter(Boolean);
          const upcoming = mappedBookings
            .filter((booking) => isFutureDate(booking.startsAt))
            .sort(
              (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
            )
            .slice(0, 3);
          setBookings(upcoming);
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

  const stats = useMemo(
    () => [
      {
        icon: "📅",
        label: "حصصك القادمة",
        value: bookings.length,
        color: "bg-primary/10 text-primary",
      },
      {
        icon: "💰",
        label: "رصيد المحفظة",
        value: balance ?? 0,
        suffix: " جنيه",
        color: "bg-success/10 text-success",
      },
      {
        icon: "📚",
        label: "الـ Rooms بتاعتك",
        value: rooms.length,
        color: "bg-secondary/10 text-secondary",
      },
    ],
    [balance, bookings.length, rooms.length]
  );

  const handleOpenQr = useCallback((item: BookingItem) => setSelectedBooking(item), []);
  const handleOpenCancel = useCallback(
    (item: BookingItem) => setCancelTarget(item),
    []
  );
  const handleCancelClose = useCallback(() => setCancelTarget(null), []);
  const handleQrClose = useCallback(() => setSelectedBooking(null), []);

  return (
    <StudentLayout>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}

        <section className="rounded-3xl bg-gradient-to-l from-primary/20 to-primary/5 p-6">
          <h1 className="text-2xl font-semibold">أهلاً، {displayName} 👋</h1>
          <p className="mt-2 text-sm text-muted">{greeting}</p>
        </section>

        <DashboardStats stats={stats} />

        <UpcomingBookingsSection
          bookings={bookings}
          loading={loading}
          onQr={handleOpenQr}
          onCancel={handleOpenCancel}
        />

        <RoomsSection rooms={rooms} loading={loading} />

        {selectedBooking && selectedBooking.qrCode && (
            <QRModal
              qrCode={selectedBooking.qrCode}
              sessionInfo={`${selectedBooking.subject} · ${formatArabicDateTime(
                selectedBooking.startsAt
              )}`}
              onClose={handleQrClose}
            />
        )}

        <CancelBookingModal
          booking={cancelTarget}
          cancelling={cancelling}
          onConfirm={handleCancel}
          onClose={handleCancelClose}
        />
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
    subject: item.subject ?? item.session?.subject ?? "مادة",
    gradeLevel: item.gradeLevel ?? item.session?.grade_level ?? item.grade_level ?? "",
    teacherName:
      item.teacher?.name ?? item.session?.teacher?.name ?? item.teacherName ?? "مدرس",
    teacherId:
      item.teacher?.id ??
      item.teacher?._id ??
      item.session?.teacher?.id ??
      item.session?.teacher?._id ??
      item.teacherId ??
      null,
    teacherAvatar: item.teacher?.avatar ?? item.teacher?.avatarUrl ?? null,
    centerName:
      item.center?.name ?? item.session?.center?.name ?? item.centerName ?? "",
    startsAt: item.startsAt ?? item.session?.starts_at ?? item.date ?? new Date(),
    durationMinutes: item.duration ?? item.durationMinutes ?? 90,
    price: item.price ?? item.amount ?? item.session?.price ?? 0,
    status: statusValue,
    qrCode: item.qrCode ?? item.qr_code ?? item.qr ?? null,
    reviewed: item.reviewed ?? item.hasReview ?? false,
  };
}

function mapRoom(item: any): RoomItem {
  return {
    id: item.id ?? item._id,
    name: item.name ?? item.room_name ?? "Room",
    subject: item.subject ?? item.subject_name ?? "",
    gradeLevel: item.gradeLevel ?? item.grade_level ?? "",
    teacherName: item.teacher?.name ?? item.teacherName ?? "مدرس",
    centerName: item.center?.name ?? item.centerName ?? "",
    accessTier: item.access_tier ?? item.accessTier ?? "free",
    contentCount: item.contentCount ?? item.content_count ?? null,
    hasPaidContent: item.hasPaidContent ?? item.has_paid_content ?? false,
  };
}
