"use client";

import { memo, useCallback, useRef } from "react";
import { BookingItem } from "../../components/student/booking-card";
import useModalKeyboard from "../../hooks/useModalKeyboard";

type CancelBookingModalProps = {
  booking: BookingItem | null;
  cancelling: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const CancelBookingModal = memo(function CancelBookingModal({
  booking,
  cancelling,
  onConfirm,
  onClose,
}: CancelBookingModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleConfirm = useCallback(() => onConfirm(), [onConfirm]);

  useModalKeyboard(Boolean(booking), handleClose, closeRef);

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">متأكد إنك عايز تلغي؟</h3>
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
        <p className="mt-4 text-sm text-muted">
          هيترجعلك {booking.price} جنيه في محفظتك
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={cancelling}
            className="btn-ripple flex-1 rounded-full bg-error px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {cancelling ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
});
