"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../components/admin/admin-shell";
import { PageTransition } from "../../components/page-transition";
import { SessionFormModal, SessionFormValues } from "../../components/admin/session-form-modal";
import { ConfirmModal } from "../../components/admin/confirm-modal";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import { api, normalizeApiError } from "../../lib/api";
import {
  formatArabicDateTime,
  formatArabicDate,
  getSeatFill,
  getSeatColor,
} from "../../lib/admin-utils";
import { SEARCH_DEBOUNCE_MS } from "../../lib/constants";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

type SessionItem = {
  id: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  teacherId: string;
  scheduledAt: string;
  duration_min: number;
  price: number;
  capacity: number;
  bookedSeats: number;
  status: "scheduled" | "completed" | "cancelled" | "ongoing";
  bookingsCount: number;
};

type TeacherItem = {
  id: string;
  name: string;
  subjects?: string[];
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SessionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const fetchData = useCallback((signal?: AbortSignal) => {
    Promise.all([
      api.get("/centers/sessions", { signal }),
      api.get("/centers/teachers", { signal }),
    ])
      .then(([sessionsRes, teachersRes]) => {
        const sessionItems = sessionsRes.data?.sessions ?? sessionsRes.data ?? [];
        const teacherItems = teachersRes.data?.teachers ?? teachersRes.data ?? [];
        setSessions(sessionItems.map(mapSession));
        setTeachers(
          teacherItems.map((teacher: any) => ({
            id: teacher.id ?? teacher._id,
            name: teacher.user_name,
            subjects: teacher.subjects ?? [],
          }))
        );
      })
      .catch((error) => {
        if (signal?.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (
        debouncedSearch &&
        !session.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
        return false;
      if (teacherFilter && session.teacherId !== teacherFilter) return false;
      if (statusFilter !== "all" && session.status !== statusFilter) return false;
      if (dateFrom && new Date(session.scheduledAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(session.scheduledAt) > new Date(dateTo)) return false;
      return true;
    });
  }, [sessions, debouncedSearch, teacherFilter, statusFilter, dateFrom, dateTo]);

  const openAdd = () => {
    setEditingSession(null);
    setConflictMessage(null);
    setModalOpen(true);
  };

  const openEdit = (session: SessionItem) => {
    setEditingSession(session);
    setConflictMessage(null);
    setModalOpen(true);
  };

  const handleSave = (values: SessionFormValues) => {
    setSaving(true);
    setConflictMessage(null);
    const payload = {
      teacherId: values.teacherId,
      subject: values.subject,
      grade_level: values.gradeLevel,
      scheduled_at: new Date(`${values.date}T${values.time}`).toISOString(),
      duration_min: values.duration_min,
      capacity: values.capacity,
      price: values.price,
      notes: values.notes,
    };
    const request = editingSession
      ? api.put(`/centers/sessions/${editingSession.id}`, payload)
      : api.post("/centers/sessions", payload);
    request
      .then(() => {
        setToast("تم حفظ الحصة بنجاح ✓");
        setModalOpen(false);
        fetchData();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.message.includes("المدرس") || normalized.message.includes("الصف")) {
          setConflictMessage(normalized.message);
        } else {
          setToast(normalized.message);
        }
      })
      .finally(() => setSaving(false));
  };

  const handleCancelSession = () => {
    if (!cancelTarget) return;
    api
      .put(`/centers/sessions/${cancelTarget.id}/cancel`)
      .then(() => {
        setToast(
          `اتلغت الحصة وترجعت فلوس ${cancelTarget.bookingsCount} طالب ✓`
        );
        setCancelTarget(null);
        fetchData();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };

  const handleDeleteSession = () => {
    if (!deleteTarget) return;
    api
      .delete(`/centers/sessions/${deleteTarget.id}`)
      .then(() => {
        setToast("تم حذف الحصة");
        setDeleteTarget(null);
        fetchData();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.message.includes("حجوزات")) {
          setToast("مش هتقدر تمسح حصة فيها حجوزات، إلغيها بدل كده");
        } else {
          setToast(normalized.message);
        }
      });
  };

  const calendarData = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= end.getDate(); i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), i);
      const daySessions = sessions.filter(
        (session) =>
          new Date(session.scheduledAt).toDateString() === date.toDateString()
      );
      days.push({ date, sessions: daySessions });
    }
    return { monthLabel: start.toLocaleDateString("ar-EG", { month: "long" }), days };
  }, [sessions]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDay) return [];
    return sessions.filter(
      (session) =>
        new Date(session.scheduledAt).toDateString() === selectedDay.toDateString()
    );
  }, [selectedDay, sessions]);

  return (
    <AdminShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">الحصص</h1>
              <p className="text-sm text-muted font-english" dir="ltr">
                Sessions
              </p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              إضافة حصة جديدة
            </button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-full px-3 py-1 ${
                  view === "list" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                قائمة
              </button>
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={`hidden rounded-full px-3 py-1 md:inline-flex ${
                  view === "calendar"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                تقويم
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث بالمادة"
                aria-label="ابحث بالمادة"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
              />
              <select
                value={teacherFilter}
                onChange={(event) => setTeacherFilter(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
              >
                <option value="">كل المدرسين</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
              >
                <option value="all">الكل</option>
                <option value="scheduled">قادمة</option>
                <option value="completed">مكتملة</option>
                <option value="cancelled">ملغية</option>
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {view === "calendar" ? (
            <div className="hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-card md:block">
              <div className="mb-4 text-lg font-semibold">{calendarData.monthLabel}</div>
              <div className="grid grid-cols-7 gap-3 text-xs text-muted">
                {calendarData.days.map((day) => (
                  <button
                    type="button"
                    key={day.date.toISOString()}
                    onClick={() => setSelectedDay(day.date)}
                    className={`rounded-2xl border border-slate-100 p-2 text-right ${
                      selectedDay &&
                      day.date.toDateString() === selectedDay.toDateString()
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <p className="font-semibold text-slate-600">{day.date.getDate()}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {day.sessions.map((session) => (
                        <span
                          key={session.id}
                          className={`h-2 w-2 rounded-full ${
                            session.status === "scheduled"
                              ? "bg-secondary"
                              : session.status === "completed"
                              ? "bg-slate-400"
                              : session.status === "cancelled"
                              ? "bg-error"
                              : "bg-success"
                          }`}
                          title={session.subject}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              {selectedDay && (
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold">
                    حصص يوم {formatArabicDate(selectedDay)}
                  </p>
                  <div className="mt-3 space-y-2">
                    {selectedDaySessions.length === 0 ? (
                      <p className="text-xs text-muted">مفيش حصص في اليوم ده</p>
                    ) : (
                      selectedDaySessions.map((session) => (
                        <div key={session.id} className="text-xs text-muted">
                          {session.subject} · {formatArabicDateTime(session.scheduledAt)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {view === "list" && (
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <EmptyState illustration="📅" title="مفيش حصص" />
              ) : (
                filteredSessions.map((session) => {
                  const fill = getSeatFill(session.bookedSeats, session.capacity);
                  return (
                    <div
                      key={session.id}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-card lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <p className="text-lg font-semibold">{session.subject}</p>
                        <span className="mt-2 inline-flex rounded-full bg-secondary/15 px-3 py-1 text-xs text-secondary">
                          {session.gradeLevel}
                        </span>
                        <p className="mt-2 text-sm text-muted">
                          👨‍🏫 {session.teacherName}
                        </p>
                      </div>
                      <div className="text-sm text-muted">
                        <p>📅 {formatArabicDateTime(session.scheduledAt)}</p>
                        <p>⏱ {session.duration} دقيقة</p>
                        <p>💰 {session.price} جنيه</p>
                      </div>
                      <div className="flex flex-col gap-3 text-xs">
                        <div>
                          <div className="h-2 w-36 rounded-full bg-slate-100">
                            <div
                              className={`h-2 rounded-full ${getSeatColor(fill)}`}
                              style={{ width: `${fill}%` }}
                            />
                          </div>
                          <p className="mt-1 text-muted">
                            {session.bookedSeats} / {session.capacity}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-full px-3 py-1 ${
                            session.status === "scheduled"
                              ? "bg-secondary/15 text-secondary"
                              : session.status === "ongoing"
                              ? "bg-success/15 text-success"
                              : session.status === "completed"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {session.status === "scheduled"
                            ? "قادمة"
                            : session.status === "ongoing"
                            ? "جارية الآن"
                            : session.status === "completed"
                            ? "مكتملة"
                            : "ملغية"}
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenId((prev) => (prev === session.id ? null : session.id))
                            }
                            className="rounded-full border border-slate-200 px-3 py-1"
                          >
                            ⋮
                          </button>
                          {menuOpenId === session.id && (
                            <div className="absolute left-0 mt-2 w-40 rounded-2xl border border-slate-100 bg-white p-2 text-xs shadow-card">
                              <button
                                type="button"
                                onClick={() => {
                                  openEdit(session);
                                  setMenuOpenId(null);
                                }}
                                className="block w-full rounded-xl px-3 py-2 text-right hover:bg-slate-100"
                              >
                                ✏️ تعديل
                              </button>
                              <Link
                                href={`/admin/attendance?sessionId=${session.id}`}
                                className="block rounded-xl px-3 py-2 hover:bg-slate-100"
                              >
                                📋 الحضور
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelTarget(session);
                                  setMenuOpenId(null);
                                }}
                                disabled={session.status !== "scheduled"}
                                className="block w-full rounded-xl px-3 py-2 text-right hover:bg-slate-100 disabled:text-slate-300"
                              >
                                ❌ إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTarget(session);
                                  setMenuOpenId(null);
                                }}
                                disabled={session.bookingsCount > 0}
                                className="block w-full rounded-xl px-3 py-2 text-right text-error hover:bg-error/10 disabled:text-slate-300"
                              >
                                🗑 حذف
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <SessionFormModal
          isOpen={modalOpen}
          title={editingSession ? "تعديل الحصة" : "إضافة حصة جديدة"}
          teachers={teachers}
          initialValues={
            editingSession
              ? {
                  teacherId: editingSession.teacherId,
                  subject: editingSession.subject,
                  gradeLevel: editingSession.gradeLevel,
                  date: new Date(editingSession.scheduledAt).toISOString().slice(0, 10),
                  time: new Date(editingSession.scheduledAt).toTimeString().slice(0, 5),
                  duration_min: editingSession.duration,
                  capacity: editingSession.capacity,
                  price: editingSession.price,
                }
              : undefined
          }
          conflictMessage={conflictMessage}
          loading={saving}
          onSubmit={handleSave}
          onClose={() => setModalOpen(false)}
        
        />

        {cancelTarget && (
          <ConfirmModal
            title="⚠️ هتلغي الحصة دي؟"
            message={`هيتم إلغاء ${cancelTarget.bookingsCount} حجز وإرجاع الفلوس للطلاب. مش هتقدر ترجع الحصة تاني`}
            confirmText="تأكيد الإلغاء"
            confirmColor="bg-error"
            onConfirm={handleCancelSession}
            onCancel={() => setCancelTarget(null)}
          />
        )}

        {deleteTarget && (
          <ConfirmModal
            title="متأكد إنك عايز تمسح الحصة دي؟"
            message={`حصة ${deleteTarget.subject} - ${formatArabicDate(deleteTarget.scheduledAt)}`}
            confirmText="تأكيد الحذف"
            confirmColor="bg-error"
            onConfirm={handleDeleteSession}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </PageTransition>
    </AdminShell>
  );
}

function mapSession(item: any): SessionItem {
  const capacity = parseInt(item.capacity ?? 0);
const available = parseInt(item.available_slots ?? 0);
return {
  id: item.id ?? item._id,
  subject: item.subject ?? "",
  gradeLevel: item.grade_level ?? "",
  teacherName: item.teachername ?? "مدرس",
  teacherId: item.teacher_id ?? "",
  scheduledAt: item.scheduled_at ?? "",
  duration_min: item.duration_min ?? 0,
  price: Number(item.price) ?? 0,
  capacity: capacity,
  bookedSeats:
    item.bookedSeats ??
    item.booked_count ??
    item.bookings_count ??
    (capacity - available),
  status: item.status_label ?? "",
  bookingsCount: capacity - available,
};
}
