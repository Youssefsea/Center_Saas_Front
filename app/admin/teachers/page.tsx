"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../components/admin/admin-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { ConfirmModal } from "../../components/admin/confirm-modal";
import { api, normalizeApiError } from "../../lib/api";
import { TeachersHeader } from "./TeachersHeader";
import { TeachersList } from "./TeachersList";
import { TeacherSearchModal, LookupResult } from "./TeacherSearchModal";

type TeacherItem = {
  id: string;
  name: string;
  bio?: string | null;
  subjects: string[];
  gradeLevels: string[];
  rating: number;
  reviewsCount: number;
  sessionsCount: number;
  upcomingSessions?: number;
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Lookup state
  const [teacherId, setTeacherId] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Action targets
  const [addTarget, setAddTarget] = useState<LookupResult | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeacherItem | null>(null);

  // ── Fetch teachers ──────────────────────────────────────────
  const fetchTeachers = useCallback((signal?: AbortSignal) => {
    api
      .get("/centers/teachers", { signal })
      .then((response) => {
        const items = response.data?.teachers ?? response.data ?? [];
        setTeachers(items.map(mapTeacher));
      })
      .catch((error) => {
        if (signal?.aborted) return;
        setToast(normalizeApiError(error).message);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTeachers(controller.signal);
    return () => controller.abort();
  }, [fetchTeachers]);

  // ── Lookup by ID ────────────────────────────────────────────
  const runLookup = useCallback(() => {
    if (!teacherId.trim()) return;
    setLooking(true);
    setLookupResult(null);
    setLookupError(null);

    api
      .get(`/discovery/centers/teachers/${encodeURIComponent(teacherId.trim())}`)
      .then((response) => {
        const { teacher, already_in_center } = response.data;
        setLookupResult({
          id: teacher.teacher_id,
          name: teacher.teacher_name ?? "مدرس",
          subjects: teacher.subjects ?? [],
          rating: Number(teacher.rating) ?? 0,
          alreadyInCenter: already_in_center,
        });
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setLookupError(
          normalized.status === 404
            ? "مفيش مدرس بالـ ID ده"
            : normalized.message
        );
      })
      .finally(() => setLooking(false));
  }, [teacherId]);

  // ── Add teacher ─────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    if (!addTarget) return;
    api
      .post("/centers/teachers", { teacherId: addTarget.id })
      .then(() => {
        setToast("اتضاف المدرس للمركز ✓");
        setAddTarget(null);
        setSearchModalOpen(false);
        setTeacherId("");
        setLookupResult(null);
        fetchTeachers();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.status === 404) setToast("المدرس ده مش موجود");
        else if (normalized.status === 400) setToast("المدرس ده مضاف بالفعل");
        else setToast(normalized.message);
      });
  }, [addTarget, fetchTeachers]);

  // ── Remove teacher ──────────────────────────────────────────
  const handleRemove = useCallback(() => {
    if (!removeTarget) return;
    if (removeTarget.upcomingSessions && removeTarget.upcomingSessions > 0) {
      setToast("المدرس ده عنده حصص جاية، مش هتقدر تشيله");
      setRemoveTarget(null);
      return;
    }
    api
      .delete("/centers/teachers", { data: { teacherId: removeTarget.id } })
      .then(() => {
        setToast("تم إزالة المدرس من المركز");
        setRemoveTarget(null);
        setTeachers((prev) => prev.filter((t) => t.id !== removeTarget.id));
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(
          normalized.message.includes("حصص")
            ? "المدرس ده عنده حصص جاية، مش هتقدر تشيله"
            : normalized.message
        );
      });
  }, [removeTarget]);

  // ── Handlers ────────────────────────────────────────────────
  const handleToastClose = useCallback(() => setToast(null), []);

  const handleOpenSearch = useCallback(() => setSearchModalOpen(true), []);

  const handleCloseSearch = useCallback(() => {
    setSearchModalOpen(false);
    setTeacherId("");
    setLookupResult(null);
    setLookupError(null);
  }, []);

  const handleIdChange = useCallback((value: string) => {
    setTeacherId(value);
    // Reset result on each keystroke
    setLookupResult(null);
    setLookupError(null);
  }, []);

  const handleAddTarget = useCallback((teacher: LookupResult) => setAddTarget(teacher), []);
  const handleRemoveTarget = useCallback((teacher: TeacherItem) => setRemoveTarget(teacher), []);
  const handleAddCancel = useCallback(() => setAddTarget(null), []);
  const handleRemoveCancel = useCallback(() => setRemoveTarget(null), []);

  return (
    <AdminShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}

        <TeachersHeader onAdd={handleOpenSearch} />
        <TeachersList teachers={teachers} onRemove={handleRemoveTarget} />

        <TeacherSearchModal
          open={searchModalOpen}
          teacherId={teacherId}
          looking={looking}
          lookupResult={lookupResult}
          lookupError={lookupError}
          onLookup={runLookup}
          onClose={handleCloseSearch}
          onIdChange={handleIdChange}
          onAdd={handleAddTarget}
        />

        {addTarget && (
          <ConfirmModal
            title={`هتضيف ${addTarget.name} للمركز؟`}
            message="تأكد إن بيانات المدرس صحيحة"
            confirmText="تأكيد الإضافة"
            confirmColor="bg-primary"
            onConfirm={handleAdd}
            onCancel={handleAddCancel}
          />
        )}

        {removeTarget && (
          <ConfirmModal
            title={`هتشيل ${removeTarget.name} من المركز؟`}
            message="الحصص الجاية بتاعته مش هتتأثر"
            confirmText="تأكيد الإزالة"
            confirmColor="bg-error"
            onConfirm={handleRemove}
            onCancel={handleRemoveCancel}
          />
        )}
      </PageTransition>
    </AdminShell>
  );
}

function mapTeacher(item: any): TeacherItem {
  return {
    id: item.id ?? "",
    name: item.user_name ?? "مدرس",
    bio: item.bio ?? null,
    subjects: item.subjects ?? [],
    gradeLevels: item.grade_levels ?? item.gradeLevels ?? [],
    rating: Number(item.rating) ?? 0,
    reviewsCount: item.total_reviews ?? 0,
    sessionsCount: item.sessionscount ?? 0,
    upcomingSessions: item.upcomingsessions ?? item.upcomingSessions ?? 0,
  };
}