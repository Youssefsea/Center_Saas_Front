"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeacherShell } from "../../components/teacher/teacher-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import {
  TeacherContentCard,
  TeacherContentItem,
} from "../../components/teacher/teacher-content-card";
import { ContentFormModal } from "../../components/teacher/content-form-modal";
import { DeleteContentModal } from "../../components/teacher/delete-content-modal";
import {
  CenterSelectorPanel,
  CenterSelectorItem,
} from "../../components/teacher/center-selector-panel";
import { api, normalizeApiError } from "../../lib/api";

type CenterItem = CenterSelectorItem;

export default function TeacherContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contents, setContents] = useState<TeacherContentItem[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type?: "error" | "success" | "warning";
  } | null>(null);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editContent, setEditContent] = useState<TeacherContentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherContentItem | null>(null);

  const selectedCenter = useMemo(
    () => centers.find((center) => center.id === selectedId) ?? null,
    [centers, selectedId]
  );

  const refreshContent = useCallback((centerId: string) => {
    setLoadingContent(true);
    return api
      .get("/teacher/me/content", { params: { centerId } })
      .then((response) => {
        const items = response.data?.content ?? response.data ?? [];
        const mapped = items.map(mapContent);
        setContents(mapped);
        setCenters((prev) =>
          prev.map((center) =>
            center.id === centerId
              ? { ...center, contentCount: mapped.length }
              : center
          )
        );
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast({ message: normalized.message, type: "error" });
      })
      .finally(() => setLoadingContent(false));
  }, []);

  useEffect(() => {
    setLoadingCenters(true);
    api
      .get("/teacher/me/centers")
      .then((response) => {
        const items = response.data?.centers ?? response.data ?? [];
        const mapped = items.map(mapCenter);
        setCenters(mapped);
        setSelectedId((prev) => prev ?? mapped[0]?.id ?? null);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast({ message: normalized.message, type: "error" });
      })
      .finally(() => setLoadingCenters(false));
  }, []);

  useEffect(() => {
    if (!centers.length) return;
    const paramCenter = searchParams.get("centerId");
    if (paramCenter && centers.some((center) => center.id === paramCenter)) {
      if (paramCenter !== selectedId) setSelectedId(paramCenter);
      return;
    }
    if (!selectedId) {
      setSelectedId(centers[0]?.id ?? null);
    }
  }, [centers, searchParams, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setContents([]);
      return;
    }
    refreshContent(selectedId);
  }, [selectedId, refreshContent]);

  useEffect(() => {
    if (!selectedId) return;
    const current = searchParams.get("centerId");
    if (current !== selectedId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("centerId", selectedId);
      router.replace(`/teacher/content?${params.toString()}`);
    }
  }, [selectedId, router, searchParams]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    api
      .delete(`/teacher/me/content/${deleteTarget.id}`)
      .then(() => {
        setToast({
          message:
            deleteTarget.usedInRoomsCount > 0 ? "اتوقف المحتوى ✓" : "اتمسح المحتوى ✓",
          type: deleteTarget.usedInRoomsCount > 0 ? "warning" : "success",
        });
        setDeleteTarget(null);
        if (selectedId) refreshContent(selectedId);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast({ message: normalized.message, type: "error" });
      });
  };

  return (
    <TeacherShell>
      <PageTransition>
        {toast && (
          <ErrorToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">المحتوى</h1>
            <p className="text-sm text-muted font-english" dir="ltr">
              My Content
            </p>
          </div>
          {/* {selectedCenter && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              إضافة محتوى
            </button>
          )} */}
        </section>

        {centers.length > 0 && (
          <div className="mt-4 lg:hidden">
            <select
              value={selectedId ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            >
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {centers.length > 0 && (
            <CenterSelectorPanel
              centers={centers}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
          <div className="flex-1">
            {loadingCenters ? (
              <div className="skeleton h-32 w-full rounded-3xl border border-slate-100" />
            ) : centers.length === 0 ? (
              <EmptyState
                illustration="📚"
                title="مش مرتبط بأي مركز"
                subtitle="مش هتقدر ترفع محتوى لحد ما مركز يضيفك"
              />
            ) : !selectedCenter ? (
              <EmptyState
                illustration="🏫"
                title="اختار مركز من الشمال عشان تشوف المحتوى"
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      محتوى {selectedCenter.name}
                    </h2>
                    <p className="text-sm text-muted">
                      {contents.length} محتوى
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    إضافة محتوى
                  </button>
                </div>

                <div className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-xs text-accent">
                  💡 المحتوى اللي هترفعه هنا متاح للمركز ده بس، المركز بتختار منه اللي
                  تضيفه للـ Rooms
                </div>

                <div className="mt-6">
                  {loadingContent ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`content-loading-${index}`}
                          className="skeleton h-40 w-full rounded-3xl border border-slate-100"
                        />
                      ))}
                    </div>
                  ) : contents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
                      <div className="text-4xl">📚</div>
                      <p className="text-lg font-semibold">
                        مفيش محتوى لـ {selectedCenter.name} لسه
                      </p>
                      <p className="text-sm text-muted">
                        ابدأ بإضافة أول محتوى للمركز ده
                      </p>
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="btn-ripple mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                      >
                        إضافة محتوى
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {contents.map((content) => (
                        <TeacherContentCard
                          key={content.id}
                          content={content}
                          onEdit={() => setEditContent(content)}
                          onDelete={() => setDeleteTarget(content)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {addOpen && selectedCenter && (
          <ContentFormModal
            mode="add"
            centerId={selectedCenter.id}
            centerName={selectedCenter.name}
            onClose={() => setAddOpen(false)}
            onSuccess={() => {
              setAddOpen(false);
              refreshContent(selectedCenter.id);
            }}
          />
        )}

        {editContent && selectedCenter && (
          <ContentFormModal
            mode="edit"
            centerId={selectedCenter.id}
            centerName={selectedCenter.name}
            content={editContent}
            onClose={() => setEditContent(null)}
            onSuccess={() => {
              setEditContent(null);
              refreshContent(selectedCenter.id);
            }}
          />
        )}

        {deleteTarget && (
          <DeleteContentModal
            content={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </PageTransition>
    </TeacherShell>
  );
}

function mapCenter(item: any): CenterItem {
  return {
    id: item.id ?? item._id,
    name: item.name ?? item.center_name ?? "مركز",
    contentCount: item.content_count ?? item.contentCount ?? 0,
  };
}

function mapContent(item: any): TeacherContentItem {
  return {
    id: item.id ?? item._id,
    type: item.type ?? item.content_type ?? "video",
    title: item.title ?? "",
    description: item.description ?? "",
    url: item.url ?? item.link ?? "",
    isFree: item.is_free ?? item.isFree ?? true,
    isActive: item.is_active ?? item.isActive ?? true,
    usedInRoomsCount:
      item.used_in_rooms_count ?? item.usedInRoomsCount ?? item.rooms_count ?? 0,
  };
}
