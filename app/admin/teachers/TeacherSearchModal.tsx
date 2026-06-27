"use client";

import { ChangeEvent, memo, useCallback, useRef } from "react";
import useModalKeyboard from "../../hooks/useModalKeyboard";

export type LookupResult = {
  id: string;
  name: string;
  subjects: string[];
  rating: number;
  alreadyInCenter: boolean;
};

type TeacherSearchModalProps = {
  open: boolean;
  teacherId: string;
  looking: boolean;
  lookupResult: LookupResult | null;
  lookupError: string | null;
  onLookup: () => void;
  onClose: () => void;
  onIdChange: (value: string) => void;
  onAdd: (teacher: LookupResult) => void;
};

export const TeacherSearchModal = memo(function TeacherSearchModal({
  open,
  teacherId,
  looking,
  lookupResult,
  lookupError,
  onLookup,
  onClose,
  onIdChange,
  onAdd,
}: TeacherSearchModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleIdChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onIdChange(e.target.value),
    [onIdChange]
  );
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") onLookup();
    },
    [onLookup]
  );

  useModalKeyboard(open, handleClose, closeRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-2xl md:rounded-3xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">إضافة مدرس بالـ ID</h3>
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

        {/* Input */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={teacherId}
            onChange={handleIdChange}
            onKeyDown={handleKeyDown}
            placeholder="الصق ID المدرس هنا"
            aria-label="ID المدرس"
            dir="ltr"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 font-mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={onLookup}
            disabled={!teacherId.trim() || looking}
            className="btn-ripple rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {looking ? "جارٍ البحث..." : "بحث"}
          </button>
        </div>

        {/* Result Area */}
        <div className="mt-4">
          {/* Error */}
          {lookupError && (
            <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-500">
              {lookupError}
            </div>
          )}

          {/* Teacher card */}
          {lookupResult && (
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 text-sm md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                  {lookupResult.name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold">{lookupResult.name}</p>
                  <p className="text-xs text-muted">{lookupResult.subjects.join(" · ")}</p>
                  <p className="text-xs text-muted">⭐ {Number(lookupResult.rating).toFixed(1)}</p>
                </div>
              </div>

              {lookupResult.alreadyInCenter ? (
                <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs text-muted md:self-auto">
                  مضاف بالفعل
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAdd(lookupResult)}
                  className="self-start rounded-full border border-primary px-3 py-1 text-xs text-primary md:self-auto"
                >
                  إضافة للمركز
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {!lookupResult && !lookupError && (
            <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-muted">
              ادخل الـ ID وضرب بحث
            </div>
          )}
        </div>
      </div>
    </div>
  );
});