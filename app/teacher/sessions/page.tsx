"use client";

import { ChangeEvent, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TeacherShell } from "../../components/teacher/teacher-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import {
  TeacherSession,
  TeacherSessionCard,
} from "../../components/teacher/teacher-session-card";
import { api, normalizeApiError } from "../../lib/api";
import { CONTENT_LIMIT } from "../../lib/constants";
import { mapSession } from "../dashboard/page";

type CenterOption = {
  id: string;
  name: string;
};

const statusTabs = [
  { value: "all", label: "الكل" },
  { value: "scheduled", label: "قادمة" },
  { value: "completed", label: "مكتملة" },
  { value: "ended", label: "انتهت" },
  { value: "cancelled", label: "ملغية" },
];

export default function TeacherSessionsPage() {
  const searchParams = useSearchParams();
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [centerId, setCenterId] = useState(searchParams.get("centerId") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/teacher/me/centers", { signal: controller.signal })
      .then((response) => {
        const items = response.data?.centers ?? response.data ?? [];
        setCenters(
          items.map((item: any) => ({
            id: item.id ?? item._id,
            name: item.name ?? item.center_name ?? "مركز",
          }))
        );
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params: Record<string, string | number> = { limit: CONTENT_LIMIT, offset: 0 };
    if (centerId) params.centerId = centerId;
    if (status !== "all") params.status = status;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;

    api
      .get("/teacher/me/sessions", { params, signal: controller.signal })
      .then((response) => {
        const items = response.data?.sessions ?? response.data ?? [];
        setSessions(items.map(mapSession));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [centerId, status, dateFrom, dateTo]);

  const emptyMessage = useMemo(() => {
    const statusLabel =
      status === "scheduled"
        ? "قادمة"
        : status === "completed"
        ? "مكتملة"
        : status === "cancelled"
        ? "ملغية"
        : "";
    return statusLabel
      ? `مفيش حصص ${statusLabel} في المراكز دي`
      : "مفيش حصص في المراكز دي";
  }, [status]);

  const handleToastClose = useCallback(() => setToast(null), []);
  const handleCenterChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => setCenterId(event.target.value),
    []
  );
  const handleStatusClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const value = event.currentTarget.dataset.status;
      if (value) setStatus(value);
    },
    []
  );
  const handleDateFromChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDateFrom(event.target.value),
    []
  );
  const handleDateToChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDateTo(event.target.value),
    []
  );

  return (
    <TeacherShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">حصصي</h1>
            <p className="text-sm text-muted font-english" dir="ltr">
              My Sessions
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
            {sessions.length} حصة
          </span>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={centerId}
              onChange={handleCenterChange}
              aria-label="اختيار المركز"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="">كل المراكز</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  data-status={tab.value}
                  onClick={handleStatusClick}
                  className={`rounded-full px-4 py-2 text-sm ${
                    status === tab.value
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>من</span>
              <input
                type="date"
                value={dateFrom}
                onChange={handleDateFromChange}
                aria-label="تاريخ البداية"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
              <span>إلى</span>
              <input
                type="date"
                value={dateTo}
                onChange={handleDateToChange}
                aria-label="تاريخ النهاية"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-xs text-accent">
            الحصص بتتعمل من قِبل المراكز
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`session-loading-${index}`}
                className="skeleton h-32 w-full rounded-3xl border border-slate-100"
              />
            ))
          ) : sessions.length === 0 ? (
            <EmptyState illustration="📅" title={emptyMessage} />
          ) : (
            sessions.map((session) => (
              <TeacherSessionCard
                key={session.id}
                session={session}
                showAttendance
              />
            ))
          )}
        </section>
      </PageTransition>
    </TeacherShell>
  );
}

