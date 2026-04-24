"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, normalizeApiError } from "../../lib/api";
import { formatRelative } from "../../lib/admin-utils";
import { ErrorToast } from "../error-toast";
import { SEARCH_DEBOUNCE_MS } from "../../lib/constants";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import useModalKeyboard from "../../hooks/useModalKeyboard";

type Member = {
  id: string;
  name: string;
  accessTier: "free" | "paid";
  joinedAt: string;
};

export function MembersModal({
  roomId,
  roomName,
  onClose,
}: {
  roomId: string;
  roomName: string;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleToastClose = useCallback(() => setToast(null), []);
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
    []
  );

  useModalKeyboard(true, handleClose, closeRef);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/rooms/${roomId}/members`, { signal: controller.signal })
      .then((response) => {
        const items = response.data?.members ?? response.data ?? [];
        setMembers(
          items.map((item: any) => ({
            id: item.id ?? item._id,
            name: item.student_name || "طالب",
            accessTier: item.access_tier ?? item.accessTier ?? "free",
            joinedAt: item.joined_at || undefined,
          }))
        );
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
    return () => controller.abort();
  }, [roomId]);

  const filtered = useMemo(
    () =>
      members.filter((member) =>
        member.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [members, debouncedSearch]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      {toast && <ErrorToast message={toast} onClose={handleToastClose} />}
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            أعضاء {roomName} / {members.length} طالب
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="إغلاق النافذة"
            className="text-xl"
          >
            ×
          </button>
        </div>
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="ابحث بالاسم..."
          aria-label="ابحث بالاسم"
          className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-muted">
              مفيش أعضاء لسه، شارك الكود مع الطلاب
            </div>
          ) : (
            filtered.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {member.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted">
                      {formatRelative(member.joinedAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    member.accessTier === "paid"
                      ? "bg-primary/10 text-primary"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {member.accessTier === "paid" ? "مدفوع" : "مجاني"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
