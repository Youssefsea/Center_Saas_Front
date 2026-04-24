"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { StudentLayout } from "../components/student/student-layout";
import { PageTransition } from "../components/page-transition";
import { RoomCard, RoomItem } from "../components/student/room-card";
import { ErrorToast } from "../components/error-toast";
import { EmptyState } from "../components/empty-state";
import { api, normalizeApiError } from "../lib/api";
import useModalKeyboard from "../hooks/useModalKeyboard";

export default function MyRoomsPage() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [joining, setJoining] = useState(false);
  const joinCloseRef = useRef<HTMLButtonElement | null>(null);

  const handleToastClose = useCallback(() => setToast(null), []);
  const fetchRooms = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    api
      .get("/rooms/me", { signal })
      .then((response) => {
        const items = response.data?.rooms ?? response.data ?? [];
        setRooms(items.map(mapRoom));
      })
      .catch((error) => {
        if (signal?.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchRooms(controller.signal);
    return () => controller.abort();
  }, [fetchRooms]);

  const handleJoin = useCallback(() => {
    if (!accessCode) {
      setToast("ادخل كود الـ Room");
      return;
    }
    setJoining(true);
    api
      .post("/rooms/join", { accessCode })
      .then(() => {
        setToast("انضميت للـ Room بنجاح! 🎉");
        setJoinOpen(false);
        setAccessCode("");
        fetchRooms();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.status === 404) {
          setToast("الكود ده مش صح، جرب تاني");
        } else {
          setToast(normalized.message);
        }
      })
      .finally(() => setJoining(false));
  }, [accessCode, fetchRooms]);

  const handleOpenJoin = useCallback(() => setJoinOpen(true), []);
  const handleCloseJoin = useCallback(() => setJoinOpen(false), []);
  const handleAccessCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setAccessCode(event.target.value),
    []
  );

  useModalKeyboard(joinOpen, handleCloseJoin, joinCloseRef);

  return (
    <StudentLayout>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">الـ Rooms بتاعتي</h1>
            <p className="text-sm text-muted font-english" dir="ltr">
              My Rooms
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenJoin}
            className="btn-ripple rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            انضم لـ Room جديد
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-muted">
              جارٍ تحميل الـ Rooms...
            </div>
          ) : rooms.length === 0 ? (
            <EmptyState
              illustration="📚"
              title="مش منضم لأي room"
              subtitle="انضم بكود الـ Room من مدرسك"
            />
          ) : (
            rooms.map((room) => <RoomCard key={room.id} room={room} />)
          )}
        </div>

        {joinOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">انضم للـ Room</h3>
                <button
                  ref={joinCloseRef}
                  type="button"
                  onClick={handleCloseJoin}
                  aria-label="إغلاق"
                  className="text-xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <input
                  value={accessCode}
                  onChange={handleAccessCodeChange}
                  placeholder="أدخل كود الـ Room"
                  aria-label="كود الـ Room"
                  aria-required="true"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="btn-ripple w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {joining ? "جارٍ الانضمام..." : "تأكيد الانضمام"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </StudentLayout>
  );
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
