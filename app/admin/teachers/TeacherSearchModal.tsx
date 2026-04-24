"use client";

import { ChangeEvent, memo, useCallback, useRef } from "react";
import useModalKeyboard from "../../hooks/useModalKeyboard";

type SearchTeacher = {
  id: string;
  name: string;
  subjects: string[];
  rating: number;
};

type TeacherSearchModalProps = {
  open: boolean;
  searchQuery: string;
  searching: boolean;
  results: SearchTeacher[];
  onSearch: () => void;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onAdd: (teacher: SearchTeacher) => void;
};

export const TeacherSearchModal = memo(function TeacherSearchModal({
  open,
  searchQuery,
  searching,
  results,
  onSearch,
  onClose,
  onQueryChange,
  onAdd,
}: TeacherSearchModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value),
    [onQueryChange]
  );

  useModalKeyboard(open, handleClose, closeRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-2xl md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">إضافة مدرس</h3>
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
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={searchQuery}
            onChange={handleQueryChange}
            placeholder="ابحث باسم المدرس أو المادة"
            aria-label="بحث عن مدرس"
            aria-required="true"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={onSearch}
            className="btn-ripple rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            {searching ? "جارٍ البحث..." : "بحث"}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {results.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-muted">
              مفيش نتائج
            </div>
          ) : (
            results.map((teacher) => (
              <div
                key={teacher.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-3 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {teacher.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-semibold">{teacher.name}</p>
                    <p className="text-xs text-muted">{teacher.subjects.join(" · ")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(teacher)}
                  className="rounded-full border border-primary px-3 py-1 text-xs text-primary"
                >
                  إضافة للمركز
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
