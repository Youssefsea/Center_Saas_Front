"use client";

import Link from "next/link";
import { memo } from "react";
import { EmptyState } from "../../components/empty-state";
import { RoomCard, RoomItem } from "../../components/student/room-card";

type RoomsSectionProps = {
  rooms: RoomItem[];
  loading: boolean;
};

export const RoomsSection = memo(function RoomsSection({
  rooms,
  loading,
}: RoomsSectionProps) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">الـ Rooms بتاعتي</h2>
          <p className="text-sm text-muted font-english" dir="ltr">
            My Rooms
          </p>
        </div>
        <Link href="/my-rooms" className="text-sm text-primary">
          عرض كل الـ Rooms
        </Link>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-muted">
            جارٍ تحميل الـ Rooms...
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            illustration="📚"
            title="مش منضم لأي room لسه"
            subtitle="انضم دلوقتي عشان تتابع كل محتوى المدرس"
            actionLabel="انضم دلوقتي"
            actionHref="/my-rooms"
          />
        ) : (
          rooms.map((room) => <RoomCard key={room.id} room={room} compact />)
        )}
      </div>
    </section>
  );
});
