"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudentLayout } from "../../../components/student/student-layout";
import { PageTransition } from "../../../components/page-transition";
import { ContentItem, RoomContentItem } from "../../../components/student/content-item";
import { UpgradeBanner } from "../../../components/student/upgrade-banner";
import { ErrorToast } from "../../../components/error-toast";
import { EmptyState } from "../../../components/empty-state";
import { api, normalizeApiError } from "../../../lib/api";
import { useWallet } from "../../../providers/wallet-provider";
import useModalKeyboard from "../../../hooks/useModalKeyboard";
import { ERRORS } from "../../../../constants";

const ContentModal = dynamic(() => import("../../../components/ContentModal").then((mod) => mod.ContentModal), {
  ssr: false,
});

type RoomInfo = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  accessTier: "free" | "paid";
  price: number;
};

export default function RoomContentPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const { balance, refresh } = useWallet();
  const [toast, setToast] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [content, setContent] = useState<RoomContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [activeContent, setActiveContent] = useState<RoomContentItem | null>(null);
  const upgradeRef = useRef<HTMLDivElement | null>(null);
  const upgradeCloseRef = useRef<HTMLButtonElement | null>(null);

  const fetchContent = useCallback((signal?: AbortSignal) => {
    if (!params?.roomId) return;
    setLoading(true);
    api
      .get(`/rooms/${params.roomId}/content`, { signal })
      .then((response) => {
        const data = response.data ?? {};
        const roomData = data.room ?? data;
        console.log("rrom",roomData); 
        const contentData = data.content ?? [];
        setRoom({
          id: roomData.id ?? params.roomId,
          name: roomData.name ?? roomData.room_name ?? "Room",
          subject: roomData.subject ?? roomData.subject_name ?? "",
          gradeLevel: roomData.gradeLevel ?? roomData.grade_level ?? "",
          teacherName: roomData.teacher_name ??  "مدرس",
          accessTier: data.access_tier ?? roomData.access_tier ?? "free",
          price: roomData.paid_price ?? 0,
        });
        setContent(
          contentData
            .map((item: any) => {
              const rawType = item.type ?? "video";
              const typeValue = ["video", "pdf", "link"].includes(rawType)
                ? rawType
                : "video";
              return {
                id: item.id ?? item.content_id ?? item._id ?? "",
                type: typeValue,
                title: item.title ?? "",
                description: item.description ?? null,
                url: item.url ?? null,
                isFree: item.is_free ?? item.isFree ?? false,
                sortOrder: item.sort_order ?? 0,
              };
            })
            .sort((a: RoomContentItem, b: RoomContentItem) => a.sortOrder - b.sortOrder)
        );
      })
      .catch((error) => {
        if (signal?.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
  }, [params?.roomId]);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    fetchContent(controller.signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => controller.abort();
  }, [fetchContent, refresh]);

  const lockedCount = useMemo(
    () => content.filter((item) => !item.isFree && !item.url).length,
    [content]
  );

  const handleUpgrade = useCallback(() => {
    if (!room) return;
    if ((balance ?? 0) < room.price) {
      return;
    }
    setUpgrading(true);
    api
      .put(`/rooms/${room.id}/upgrade`)
      .then(() => {
        setToast("اتفتحلك المحتوى الكامل! 🎉");
        setUpgradeOpen(false);
        refresh();
        fetchContent();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.code === "INSUFFICIENT_BALANCE") {
          setToast(ERRORS.INSUFFICIENT_BALANCE);
        } else if (
          normalized.code === "ALREADY_PAID" ||
          normalized.code === "ALREADY_UPGRADED"
        ) {
          setToast("انت بالفعل عندك وصول كامل");
        } else {
          setToast(normalized.message);
        }
      })
      .finally(() => setUpgrading(false));
  }, [balance, fetchContent, refresh, room]);

  const handleLockedClick = useCallback(() => {
    upgradeRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleContentClick = useCallback((item: RoomContentItem) => {
    if (!item.url) {
      handleLockedClick();
      return;
    }
    setActiveContent(item);
  }, [handleLockedClick]);

  const handleToastClose = useCallback(() => setToast(null), []);
  const handleOpenUpgrade = useCallback(() => setUpgradeOpen(true), []);
  const handleCloseUpgrade = useCallback(() => setUpgradeOpen(false), []);
  const handleContentClose = useCallback(() => setActiveContent(null), []);
  const handleWalletTopUp = useCallback(() => router.push("/wallet"), [router]);

  useModalKeyboard(upgradeOpen, handleCloseUpgrade, upgradeCloseRef);
  return (
    <StudentLayout>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}
        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-muted">
            جارٍ تحميل المحتوى...
          </div>
        ) : room ? (
          <>
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">{room.name}</h1>
                  <p className="text-sm text-muted">
                    {room.subject} · {room.gradeLevel}
                  </p>
                  <p className="text-sm text-muted">{room.teacherName}</p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs ${
                    room.accessTier === "paid"
                      ? "bg-success/10 text-success"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {room.accessTier === "paid" ? "وصول كامل ✓" : "وصول مجاني"}
                </span>
              </div>
            </section>

            {room.accessTier === "free" && lockedCount > 0 && (
              <div ref={upgradeRef} className="mt-6">
                  <UpgradeBanner
                    price={room.price}
                    lockedCount={lockedCount}
                    onUpgrade={handleOpenUpgrade}
                  />
                </div>
              )}

            <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {content.length === 0 ? (
                <EmptyState
                  illustration="📂"
                  title="مفيش محتوى في الـ Room ده لسه"
                />
              ) : (
                
                content.map((item) => (
             
                  <ContentItem
                    key={item.id}
                    content={item}
                    isLocked={!item.url}
                    onLockedClick={handleLockedClick}
                    onOpen={() => handleContentClick(item)}
                  />
                ))
              )}
            </section>
          </>
        ) : (
          <EmptyState illustration="📂" title="مفيش بيانات للـ Room" />
        )}

        <ContentModal
          content={activeContent}
          roomId={params?.roomId ?? ""}
          onClose={handleContentClose}
        />

        {upgradeOpen && room && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">ترقية الوصول</h3>
                <button
                  type="button"
                  ref={upgradeCloseRef}
                  onClick={handleCloseUpgrade}
                  aria-label="إغلاق"
                  className="text-xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 text-sm text-muted">
                <p>Room: {room.name}</p>
                <p>السعر: {room.price} جنيه</p>
                <p>رصيدك: {balance ?? 0} جنيه</p>
              </div>
              {(balance ?? 0) < room.price ? (
                <div className="mt-4 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
                  رصيدك {balance ?? 0} جنيه، والـ Room بـ {room.price} جنيه —
                  محتاج {room.price - (balance ?? 0)} جنيه أكتر
                  <button
                    type="button"
                    onClick={handleWalletTopUp}
                    className="btn-ripple mt-3 w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
                  >
                    شحن المحفظة
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="btn-ripple mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {upgrading ? "جارٍ الترقية..." : "تأكيد الترقية"}
                </button>
              )}
            </div>
          </div>
        )}
      </PageTransition>
    </StudentLayout>
  );
}
