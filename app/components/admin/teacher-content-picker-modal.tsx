"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, normalizeApiError } from "../../lib/api";
import { ErrorToast } from "../error-toast";
import { CONTENT_LIMIT, ERRORS } from "../../../constants";
import useModalKeyboard from "../../hooks/useModalKeyboard";

type TeacherContentItem = {
  id: string;
  type: "video" | "pdf" | "link";
  title: string;
  description?: string | null;
  url: string;
  isFree: boolean;
  teacherName: string;
  alreadyUsedCount: number;
};

const typeStyles: Record<string, string> = {
  video: "bg-primary/10 text-primary",
  pdf: "bg-error/10 text-error",
  link: "bg-secondary/10 text-secondary",
};

const typeIcons: Record<string, string> = {
  video: "🎬",
  pdf: "📄",
  link: "🔗",
};

const typeFilters = [
  { value: "all", label: "الكل" },
  { value: "video", label: "🎬 فيديو" },
  { value: "pdf", label: "📄 PDF" },
  { value: "link", label: "🔗 رابط" },
];

const accessFilters = [
  { value: "all", label: "الكل" },
  { value: "free", label: "مجاني" },
  { value: "paid", label: "مدفوع" },
];

export function TeacherContentPickerModal({
  roomId,
  teacherId,
  teacherName,
  existingContentIds,
  currentMaxSortOrder,
  onSuccess,
  onClose,
}: {
  roomId: string;
  teacherId: string | null;
  teacherName: string;
  existingContentIds: string[];
  currentMaxSortOrder: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [content, setContent] = useState<TeacherContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrideIsFree, setOverrideIsFree] = useState(true);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [nextSortOrder, setNextSortOrder] = useState(currentMaxSortOrder + 1);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setNextSortOrder(currentMaxSortOrder + 1);
  }, [currentMaxSortOrder]);

  useEffect(() => {
    if (!teacherId) {
      setContent([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    api
      .get(`/centers/teachers/${teacherId}/content`, {
        params: { limit: CONTENT_LIMIT, offset: 0 },
        signal: controller.signal,
      })
      .then((response) => {
        const items = response.data?.content ?? response.data ?? [];
        setContent(items.map(mapTeacherContent));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message ?? ERRORS.SERVER_ERROR);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [teacherId]);

  const existingIdsSet = useMemo(
    () => new Set(existingContentIds),
    [existingContentIds]
  );
  const addedIdsSet = useMemo(() => new Set(addedIds), [addedIds]);

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (accessFilter === "free" && !item.isFree) return false;
      if (accessFilter === "paid" && item.isFree) return false;
      return true;
    });
  }, [content, typeFilter, accessFilter]);

  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleToastClose = useCallback(() => setToast(null), []);
  const handleSelect = useCallback((item: TeacherContentItem) => {
    setSelectedId(item.id);
    setOverrideIsFree(item.isFree);
  }, []);

  const handleConfirm = useCallback((item: TeacherContentItem) => {
    api
      .post(`/rooms/${roomId}/content`, {
        teacherContentId: item.id,
        isFree: overrideIsFree,
        sortOrder: nextSortOrder,
      })
      .then(() => {
        setAddedIds((prev) => [...prev, item.id]);
        setNextSortOrder((prev) => prev + 1);
        setSelectedId(null);
        onSuccess();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.code === "CONTENT_NOT_AVAILABLE") {
          setToast("المحتوى ده مش متاح لمركزك");
          setContent((prev) => prev.filter((row) => row.id !== item.id));
          setSelectedId(null);
          return;
        }
        if (normalized.code === "ALREADY_IN_ROOM") {
          setToast("المحتوى ده مضاف للـ Room بالفعل");
          setAddedIds((prev) => [...prev, item.id]);
          setSelectedId(null);
          return;
        }
        setToast(normalized.message ?? ERRORS.SERVER_ERROR);
      });
  }, [nextSortOrder, onSuccess, overrideIsFree, roomId]);

  const handleTypeFilter = useCallback((value: string) => setTypeFilter(value), []);
  const handleAccessFilter = useCallback((value: string) => setAccessFilter(value), []);
  const handleOverrideToggle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setOverrideIsFree(event.target.checked),
    []
  );
  const handleCancelSelect = useCallback(() => setSelectedId(null), []);

  useModalKeyboard(true, handleClose, closeRef);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      {toast && <ErrorToast message={toast} onClose={handleToastClose} />}
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-3xl md:rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">اختار محتوى من المدرس</h3>
            <p className="text-sm text-muted">المحتوى ده بيجي من {teacherName}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="إغلاق"
            className="text-xl"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleTypeFilter(filter.value)}
              className={`rounded-full px-4 py-2 ${
                typeFilter === filter.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {accessFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleAccessFilter(filter.value)}
              className={`rounded-full px-4 py-2 ${
                accessFilter === filter.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`content-skeleton-${index}`}
                className="skeleton h-20 w-full rounded-2xl border border-slate-100"
              />
            ))
          ) : filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
              <div className="text-4xl">📚</div>
              <p className="text-lg font-semibold">
                المدرس ده مش رافع محتوى للمركز ده لسه
              </p>
              <p className="text-sm text-muted">
                تواصل مع المدرس عشان يرفع المحتوى الأول
              </p>
            </div>
          ) : (
            filteredContent.map((item) => {
              const alreadyAdded =
                existingIdsSet.has(item.id) || addedIdsSet.has(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${typeStyles[item.type]}`}
                      >
                        {typeIcons[item.type]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted truncate">{item.url}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-3 py-1 ${
                          item.isFree
                            ? "bg-success/10 text-success"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {item.isFree ? "مجاني" : "مدفوع"}
                      </span>
                      {item.alreadyUsedCount > 0 && (
                        <span className="text-xs text-secondary">
                          مستخدم في {item.alreadyUsedCount} room
                        </span>
                      )}
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleSelect(item)}
                          className={`rounded-full border px-3 py-1 ${
                            alreadyAdded
                              ? "border-success text-success"
                            : "border-primary text-primary"
                        }`}
                      >
                        {alreadyAdded ? "مضاف ✓" : "إضافة"}
                      </button>
                    </div>
                  </div>

                  {selectedId === item.id && !alreadyAdded && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-muted">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>نوع الوصول في الـ Room:</span>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={overrideIsFree}
                            onChange={handleOverrideToggle}
                            aria-label="نوع الوصول"
                          />
                          {overrideIsFree
                            ? "مجاني للجميع"
                            : "للأعضاء المدفوعين فقط"}
                        </label>
                        <span className="text-xs text-muted">
                          (إعداد الـ Room دي بس)
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirm(item)}
                          className="btn-ripple rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
                        >
                          تأكيد الإضافة
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelSelect}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="btn-ripple mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          تم
        </button>
      </div>
    </div>
  );
}

function mapTeacherContent(item: any): TeacherContentItem {
  const rawType = item.type ?? "video";
  const typeValue = ["video", "pdf", "link"].includes(rawType) ? rawType : "video";
  return {
    id: item.id ?? item._id,
    type: typeValue,
    title: item.title ?? "",
    description: item.description ?? "",
    url: item.url ?? "",
    isFree: item.is_free ?? item.isFree ?? false,
    teacherName: item.teacher_name ?? item.teacherName ?? "المدرس",
    alreadyUsedCount:
      item.already_used_count ?? item.alreadyUsedCount ?? item.used_count ?? 0,
  };
}
