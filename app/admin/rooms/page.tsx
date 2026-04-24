"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "../../components/admin/admin-shell";
import { PageTransition } from "../../components/page-transition";
import { RoomCard, AdminRoom } from "../../components/admin/room-card";
import { MembersModal } from "../../components/admin/members-modal";
import { ConfirmModal } from "../../components/admin/confirm-modal";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import { gradeLevels, SEARCH_DEBOUNCE_MS } from "../../lib/constants";
import { api, normalizeApiError } from "../../lib/api";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

type TeacherItem = {
  id: string;
  name: string;
};

type RoomFormValues = {
  name: string;
  teacherId: string;
  subject: string;
  gradeLevel: string;
  description?: string;
  price: number;
  free: boolean;
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [membersTarget, setMembersTarget] = useState<AdminRoom | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<AdminRoom | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRoom | null>(null);
  const [editingRoom, setEditingRoom] = useState<AdminRoom | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const fetchData = useCallback((signal?: AbortSignal) => {
    Promise.all([
      api.get("/centers/rooms", { signal }),
      api.get("/centers/teachers", { signal }),
    ])
      .then(([roomsRes, teachersRes]) => {
        const roomItems = roomsRes.data?.rooms ?? roomsRes.data ?? [];
        const teacherItems = teachersRes.data?.teachers ?? [];

        setRooms(roomItems.map(mapRoom));
        setTeachers(
          teacherItems.map((teacher: any) => ({
            id: teacher.id,
            name: teacher.user_name ?? "مدرس",
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

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (
        debouncedSearch &&
        !room.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
        return false;
      if (filterTeacher && room.teacherName !== filterTeacher) return false;
      if (filterStatus === "active" && !room.isActive) return false;
      if (filterStatus === "inactive" && room.isActive) return false;
      return true;
    });
  }, [rooms, debouncedSearch, filterTeacher, filterStatus]);

  const handleToggle = (room: AdminRoom) => {
    const nextValue = !room.isActive;
    setRooms((prev) =>
      prev.map((item) =>
        item.id === room.id ? { ...item, isActive: nextValue } : item
      )
    );
    api
      .put(`/rooms/${room.id}`, { isActive: nextValue })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
        setRooms((prev) =>
          prev.map((item) =>
            item.id === room.id ? { ...item, isActive: room.isActive } : item
          )
        );
      });
  };

  const handleSave = (values: RoomFormValues) => {
    setSaving(true);
    const payload = {
      name: values.name,
      teacherId: values.teacherId,
      subject: values.subject,
      gradeLevel: values.gradeLevel,
      description: values.description,
      price: values.free ? 0 : values.price,
    };
    const request = editingRoom
      ? api.put(`/rooms/${editingRoom.id}`, payload)
      : api.post("/rooms", payload);
    request
      .then(() => {
        setToast("تم حفظ الـ Room بنجاح ✓");
        setModalOpen(false);
        setEditingRoom(null);
        fetchData();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setSaving(false));
  };

  const handleRegenerate = () => {
    if (!regenerateTarget) return;
    api
      .post(`/rooms/${regenerateTarget.id}/regenerate-code`)
      .then((response) => {
        const code = response.data?.code ?? response.data?.accessCode ?? "";
        setNewCode(code);
        setRegenerateTarget(null);
        fetchData();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    api
      .delete(`/rooms/${deleteTarget.id}`)
      .then(() => {
        setToast("تم حذف الـ Room");
        setDeleteTarget(null);
        fetchData();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };

  return (
    <AdminShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">الـ Rooms</h1>
              <p className="text-sm text-muted font-english" dir="ltr">
                Rooms
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingRoom(null);
                setModalOpen(true);
              }}
              className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              إنشاء Room جديد
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={filterTeacher}
              onChange={(event) => setFilterTeacher(event.target.value)}
              className="rounded-full border border-slate-200 px-3 py-1"
            >
              <option value="">كل المدرسين</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.name}>
                  {teacher.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-full border border-slate-200 px-3 py-1"
            >
              <option value="all">الكل</option>
              <option value="active">نشط</option>
              <option value="inactive">موقف</option>
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الـ Room"
              aria-label="ابحث باسم الـ Room"
              className="rounded-full border border-slate-200 px-3 py-1"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredRooms.length === 0 ? (
              <EmptyState illustration="🚪" title="مفيش Rooms" />
            ) : (
              filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onToggleActive={handleToggle}
                  onMembers={() => setMembersTarget(room)}
                  onRegenerate={() => setRegenerateTarget(room)}
                  onEdit={() => {
                    setEditingRoom(room);
                    setModalOpen(true);
                  }}
                  onDelete={() => setDeleteTarget(room)}
                />
              ))
            )}
          </div>
        </div>

        {membersTarget && (
          <MembersModal
            roomId={membersTarget.id}
            roomName={membersTarget.name}
            onClose={() => setMembersTarget(null)}
          />
        )}

        {regenerateTarget && (
          <ConfirmModal
            title="هتغير كود الـ Room؟"
            message="الكود القديم مش هيشتغل وأي حد عنده الكود القديم مش هيقدر يدخل"
            confirmText="تأكيد"
            confirmColor="bg-accent"
            onConfirm={handleRegenerate}
            onCancel={() => setRegenerateTarget(null)}
          />
        )}

        {newCode && (
          <ConfirmModal
            title="الكود الجديد"
            message={`الكود الجديد: ${newCode}`}
            confirmText="تمام"
            confirmColor="bg-primary"
            onConfirm={() => setNewCode(null)}
            onCancel={() => setNewCode(null)}
          />
        )}

        {deleteTarget && (
          <ConfirmModal
            title="⚠️ هتمسح الـ Room ده؟"
            message="كل المحتوى والأعضاء هيتمسحوا"
            confirmText="تأكيد الحذف"
            confirmColor="bg-error"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {modalOpen && (
          <RoomFormModal
            teachers={teachers}
            editingRoom={editingRoom}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSave}
            saving={saving}
          />
        )}
      </PageTransition>
    </AdminShell>
  );
}

function RoomFormModal({
  teachers,
  editingRoom,
  onClose,
  onSubmit,
  saving,
}: {
  teachers: TeacherItem[];
  editingRoom: AdminRoom | null;
  onClose: () => void;
  onSubmit: (values: RoomFormValues) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<RoomFormValues>({
    name: editingRoom?.name ?? "",
    teacherId: editingRoom?.teacherId ?? "",
    subject: editingRoom?.subject ?? "",
    gradeLevel: editingRoom?.gradeLevel ?? "",
    description: "",
    price: editingRoom?.paidPrice ?? 0,
    free: (editingRoom?.paidPrice ?? 0) === 0,
  });

  useEffect(() => {
    if (editingRoom) {
      setValues((prev) => ({
        ...prev,
        name: editingRoom.name,
        teacherId: editingRoom.teacherId ?? "",
        subject: editingRoom.subject,
        gradeLevel: editingRoom.gradeLevel,
        price: editingRoom.paidPrice ?? 0,
        free: (editingRoom.paidPrice ?? 0) === 0,
      }));
    }
  }, [editingRoom]);

  const setField = (key: keyof RoomFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-2xl md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingRoom ? "تعديل الـ Room" : "إنشاء Room جديد"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="text-xl"
          >
            ×
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="اسم الـ Room"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
          />
          <select
            value={values.teacherId}
            onChange={(event) => setField("teacherId", event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
          >
            <option value="">اختار المدرس</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          <input
            value={values.subject}
            onChange={(event) => setField("subject", event.target.value)}
            placeholder="المادة"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
          />
          <select
            value={values.gradeLevel}
            onChange={(event) => setField("gradeLevel", event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
          >
            <option value="">الصف الدراسي</option>
            {gradeLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <textarea
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="الوصف (اختياري)"
            className="min-h-[80px] rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.free}
              onChange={(event) => setField("free", event.target.checked)}
            />
            مجاني بالكامل
          </label>
          {!values.free && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={values.price}
                onChange={(event) => setField("price", Number(event.target.value))}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
              />
              <span className="text-xs text-muted">جنيه</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="btn-ripple mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </div>
  );
}

function mapRoom(item: any): AdminRoom {
  return {
    id: item.id ?? item._id,
    name: item.name ?? item.room_name ?? "Room",
    subject: item.subject ?? item.subject_name ?? "",
    gradeLevel: item.gradeLevel ?? item.grade_level ?? "",
    teacherId: item.teacher_id ?? "",
    teacherName: item.teacher_name ?? "مدرس",
    membersCount: item.member_count ?? 0,
    contentCount: item.contentCount ?? item.content_count ?? 0,
    accessCode: item.accessCode ?? item.access_code ?? "",
    paidPrice: item.price ?? item.paidPrice,
    isActive: item.isActive ?? item.is_active ?? true,
  };
}
