"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "../../components/admin/admin-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { ConfirmModal } from "../../components/admin/confirm-modal";
import { api, normalizeApiError } from "../../lib/api";
import { TeachersHeader } from "./TeachersHeader";
import { TeachersList } from "./TeachersList";
import { TeacherSearchModal } from "./TeacherSearchModal";

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

type SearchTeacher = {
  id: string;
  name: string;
  subjects: string[];
  rating: number;
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchTeacher[]>([]);
  const [searching, setSearching] = useState(false);
  const [addTarget, setAddTarget] = useState<SearchTeacher | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeacherItem | null>(null);

  const fetchTeachers = useCallback((signal?: AbortSignal) => {
    api
      .get("/centers/teachers", { signal })
      .then((response) => {
        const items = response.data?.teachers ?? response.data ?? [];
        console.log("Fetched teachers:", items);
        setTeachers(items.map(mapTeacher));
      })
      .catch((error) => {
        if (signal?.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTeachers(controller.signal);
    return () => controller.abort();
  }, [fetchTeachers]);

  const teacherIds = useMemo(() => new Set(teachers.map((t) => t.id)), [teachers]);

  const runSearch = useCallback(() => {
    if (!searchQuery) return;
    setSearching(true);
    api
      .get("/discovery/teachers/search", {
        params: { name: searchQuery },
      })
      .then((response) => {
        const items = response.data?.teachers ?? response.data ?? [];
        console.log("item",items)
        const filtered = items
          .map((teacher: any) => ({
            id: teacher.teacher_id?? teacher._id,
            name: teacher.teacher_name ??"مدرس",
            subjects: teacher.subjects ?? [],
            rating: teacher.rating ?? 0,
          }))
          .filter((teacher: SearchTeacher) => !teacherIds.has(teacher.id));
          // console.log("Search results:", filtered);
        setSearchResults(filtered);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setSearching(false));
  }, [searchQuery, teacherIds]);

  const handleAdd = useCallback(() => {
    if (!addTarget) return;
    api
      .post("/centers/teachers", { teacherId: addTarget.id })
      .then(() => {
        setToast("اتضاف المدرس للمركز ✓");
        setAddTarget(null);
        fetchTeachers();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.status === 404) {
          setToast("المدرس ده مش موجود");
        } else if (normalized.status === 400) {
          setToast("المدرس ده مضاف بالفعل");
        } else {
          setToast(normalized.message);
        }
      });
  }, [addTarget, fetchTeachers]);

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
        setTeachers((prev) => prev.filter((teacher) => teacher.id !== removeTarget.id));
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.message.includes("حصص")) {
          setToast("المدرس ده عنده حصص جاية، مش هتقدر تشيله");
        } else {
          setToast(normalized.message);
        }
      });
  }, [removeTarget]);

  const handleToastClose = useCallback(() => setToast(null), []);
  const handleOpenSearch = useCallback(() => setSearchModalOpen(true), []);
  const handleCloseSearch = useCallback(() => setSearchModalOpen(false), []);
  const handleSearchChange = useCallback((value: string) => setSearchQuery(value), []);
  const handleAddTarget = useCallback((teacher: SearchTeacher) => setAddTarget(teacher), []);
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
          searchQuery={searchQuery}
          searching={searching}
          results={searchResults}
          onSearch={runSearch}
          onClose={handleCloseSearch}
          onQueryChange={handleSearchChange}
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

// {
//     "success": true,
//     "teachers": [
//         {
//             "teacher_id": "18c03629-2523-4f19-b184-4c231b0d1315",
//             "teacher_name": "mohamed salah",
//             "avatar_url": null,
//             "subjects": [
//                 "عربي"
//             ],
//             "grade_levels": [
//                 "ثانوي أولى",
//                 "ثانوي تانية",
//                 "ثانوي تالتة"
//             ],
//             "rating": "0.0",
//             "total_reviews": 0
//         }
//     ]
// }

function mapTeacher(item: any): TeacherItem {
  return {
    id: item.id ?? "",
    name: item.user_name ?? "مدرس",
    bio: item.bio ?? null,
    subjects: item.subjects ?? [],
    gradeLevels: item.gradeLevels ?? [],
    rating: item.rating ?? 0,
    reviewsCount: item.total_reviews?? 0,
    sessionsCount: item.sessionscount ?? 0,
    upcomingSessions: item.upcomingSessions ?? item.upcoming_sessions ?? 0,
  };
}
