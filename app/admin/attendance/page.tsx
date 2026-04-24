"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "../../components/admin/admin-shell";
import { PageTransition } from "../../components/page-transition";
import { AttendanceSummary } from "../../components/admin/attendance-summary";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import { api, normalizeApiError } from "../../lib/api";
import { formatArabicTime } from "../../lib/admin-utils";
import { ATTENDANCE_REFRESH_MS, SEARCH_DEBOUNCE_MS } from "../../lib/constants";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const AttendanceScanner = dynamic(
  () => import("../../components/admin/attendance-scanner").then((mod) => mod.AttendanceScanner),
  { ssr: false, loading: () => <div className="h-80 rounded-3xl bg-slate-100" /> }
);

type SessionItem = {
  id: string;
  subject: string;
  gradeLevel: string;
  scheduledAt: string;
  capacity: number;
};

type AttendanceEntry = {
  id: string;
  name: string;
  status: "attended" | "no_show" | "cancelled";
  time?: string | null;
};

export default function AdminAttendancePage() {
  const params = useSearchParams();
  const sessionIdParam = params.get("sessionId");
  const [mode, setMode] = useState<"qr" | "manual">("qr");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessionIdParam
  );
  const [toast, setToast] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, attended: 0, noShow: 0, cancelled: 0 });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "status" | "time">("name");
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualResult, setManualResult] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const fetchSessions = async () => {
      try {
        const response = await api.get("/centers/sessions", {
          signal: controller.signal,
        });
        if (!active) return;
        const items = response.data?.sessions ?? response.data ?? [];
        const today = items
          .map(mapSession)
          .filter((session) => isToday(session.scheduledAt));
        setSessions(today);
        if (!selectedSessionId && today.length === 1) {
          setSelectedSessionId(today[0].id);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      }
    };
    fetchSessions();
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedSessionId]);

  const fetchAttendance = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedSessionId) return;
      try {
        const response = await api.get(
          `/centers/sessions/${selectedSessionId}/attendance`,
          { signal }
        );
        const data = response.data ?? {};
        const items = data.attendance ?? data.students ?? data ?? [];
        setAttendance(items.map(mapAttendance));
        setStats({
          total: data.total ?? items.length,
          attended:
            data.attended ??
            items.filter((i: any) => i.status === "attended").length,
          noShow:
            data.no_show ?? items.filter((i: any) => i.status === "no_show").length,
          cancelled:
            data.cancelled ??
            items.filter((i: any) => i.status === "cancelled").length,
        });
      } catch (error) {
        if (signal?.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      }
    },
    [selectedSessionId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchAttendance(controller.signal);
    if (!selectedSessionId) return;
    const timer = setInterval(
      () => fetchAttendance(controller.signal),
      ATTENDANCE_REFRESH_MS
    );
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [selectedSessionId, fetchAttendance]);

  const filteredAttendance = useMemo(() => {
    const filtered = attendance.filter((entry) =>
      entry.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ar");
      if (sort === "status") return a.status.localeCompare(b.status);
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
  }, [attendance, debouncedSearch, sort]);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);

  const handleScan = useCallback(async (qrCode: string) => {
    if (!selectedSessionId) {
      return { status: "error", title: "❌", message: "اختار الحصة أولًا" };
    }
    try {
      const response = await api.post("/attendance/scan", {
        qrCode,
        sessionId: selectedSessionId,
      });
      const data = response.data ?? {};
      fetchAttendance();
      return {
        status: "success",
        title: data.studentName ?? "✅ تم تسجيل الحضور",
        message: "سجّل حضوره ✓",
        detail: `${selectedSession?.subject ?? ""} · ${formatArabicTime(new Date())}`,
      };
    } catch (error: any) {
      const normalized = normalizeApiError(error);
      const code = error?.response?.data?.error?.code ?? normalized.code;
      const meta = error?.response?.data?.meta ?? {};
      let message = normalized.message;
      if (code === "NOT_FOUND") message = "الـ QR ده مش صح";
      if (code === "ALREADY_ATTENDED") message = "الطالب ده سجّل حضوره بالفعل ✓";
      if (code === "TOO_EARLY") {
        message = "الحصة مش بدأت لسه";
        if (meta.minutesUntilStart) {
          message += ` - باقي ${meta.minutesUntilStart} دقيقة`;
        }
      }
      if (code === "OUTSIDE_TIME_WINDOW") {
        message = "وقت التسجيل انتهى";
        if (meta.minutesAfterEnd) {
          message += ` - انتهت من ${meta.minutesAfterEnd} دقيقة`;
        }
      }
      if (code === "FORBIDDEN") message = "الـ QR ده مش لحصة في مركزك";
      return { status: "error", title: "❌", message };
    }
  }, [selectedSessionId, selectedSession]);

  const handleManual = () => {
    if (!selectedSessionId) {
      setToast("اختار الحصة أولًا");
      return;
    }
    if (!manualStudentId) {
      setToast("ادخل كود الطالب");
      return;
    }
    api
      .post("/attendance/scan/AtCenter", {
        StudentId: manualStudentId,
        sessionId: selectedSessionId,
        amount_paid: manualAmount ? Number(manualAmount) : undefined,
      })
      .then((response) => {
        const data = response.data ?? {};
        setManualResult(`✅ تم تسجيل حضور ${data.studentName ?? "الطالب"}`);
        fetchAttendance();
        setManualStudentId("");
        setManualAmount("");
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        const code = error?.response?.data?.error?.code ?? normalized.code;
        if (code === "TOO_EARLY") {
          setManualResult("الحصة مش بدأت لسه");
        } else if (code === "OUTSIDE_TIME_WINDOW") {
          setManualResult("وقت تسجيل الحضور انتهى");
        } else if (code === "NOT_FOUND") {
          setManualResult("الطالب ده مش موجود في النظام");
        } else if (code === "ALREADY_ATTENDED") {
          setManualResult("الطالب ده حاضر بالفعل");
        } else {
          setManualResult(normalized.message);
        }
      });
  };

  return (
    <AdminShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">الحضور</h1>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("qr")}
              className={`rounded-full px-3 py-1 ${
                mode === "qr" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              مسح QR
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-full px-3 py-1 ${
                mode === "manual"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              تسجيل يدوي
            </button>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
            <label className="text-sm text-muted">اختار الحصة</label>
            <select
              value={selectedSessionId ?? ""}
              onChange={(event) => setSelectedSessionId(event.target.value || null)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">اختار الحصة</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.subject} - {session.gradeLevel} -{" "}
                  {formatArabicTime(session.scheduledAt)} ({session.capacity} طالب)
                </option>
              ))}
            </select>
          </div>

          {mode === "qr" ? (
            <AttendanceScanner sessionId={selectedSessionId} onScan={handleScan} />
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-muted">كود الطالب أو الـ UUID</span>
                  <input
                    value={manualStudentId}
                    onChange={(event) => setManualStudentId(event.target.value)}
                    placeholder="ألصق الـ ID بتاع الطالب"
                    className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-muted">المبلغ المدفوع (اختياري)</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={manualAmount}
                      onChange={(event) => setManualAmount(event.target.value)}
                      type="number"
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <span className="text-xs text-muted">جنيه</span>
                  </div>
                </label>
              </div>
              <button
                type="button"
                onClick={handleManual}
                className="btn-ripple mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                تسجيل الحضور
              </button>
              {manualResult && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-muted">
                  {manualResult}
                </div>
              )}
            </div>
          )}

          {selectedSessionId ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">
                  حضر {stats.attended} من {stats.total} طالب
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#10B981 ${
                        stats.total ? (stats.attended / stats.total) * 100 : 0
                      }%, #E2E8F0 0%)`,
                    }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] text-slate-600">
                      {stats.total
                        ? Math.round((stats.attended / stats.total) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ابحث بالاسم"
                    aria-label="ابحث بالاسم"
                    className="rounded-full border border-slate-200 px-3 py-1"
                  />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as typeof sort)}
                    className="rounded-full border border-slate-200 px-3 py-1"
                  >
                    <option value="name">ترتيب بالاسم</option>
                    <option value="status">ترتيب بالحالة</option>
                    <option value="time">ترتيب بالوقت</option>
                  </select>
                </div>
              </div>
              <AttendanceSummary
                total={stats.total}
                attended={stats.attended}
                noShow={stats.noShow}
                cancelled={stats.cancelled}
                entries={filteredAttendance}
              />
            </>
          ) : (
            <EmptyState illustration="📷" title="اختار الحصة لعرض الحضور" />
          )}
        </div>
      </PageTransition>
    </AdminShell>
  );
}

function isToday(date: string) {
  const now = new Date();
  const target = new Date(date);
  return (
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()
  );
}

function mapSession(item: any): SessionItem {
  return {
    id: item.id ?? item._id,
    subject: item.subject ?? "",
    gradeLevel: item.gradeLevel ?? item.grade_level ?? "",
    scheduledAt: item.scheduled_at ?? item.scheduledAt ?? item.date ?? new Date(),
    capacity: item.capacity ?? item.totalSeats ?? 0,
  };
}

function mapAttendance(item: any): AttendanceEntry {
  return {
    id: item.id ?? item._id,
    name: item.name ?? item.full_name ?? "طالب",
    status: item.status ?? "attended",
    time: item.attended_at ? formatArabicTime(item.attended_at) : null,
  };
}
