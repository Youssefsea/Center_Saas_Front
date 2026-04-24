"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "../../../../components/admin/admin-shell";
import { PageTransition } from "../../../../components/page-transition";
import { ContentItemRow, AdminContentItem } from "../../../../components/admin/content-item-row";
import { ConfirmModal } from "../../../../components/admin/confirm-modal";
import { ErrorToast } from "../../../../components/error-toast";
import { EmptyState } from "../../../../components/empty-state";
import { api, normalizeApiError } from "../../../../lib/api";

const TeacherContentPickerModal = dynamic(
  () => import("../../../../components/admin/teacher-content-picker-modal").then((mod) => mod.TeacherContentPickerModal),
  { ssr: false }
);

type RoomInfo = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherId: string | null;
  teacherName: string;
};

type ContentFormValues = {
  isFree: boolean;
  isActive: boolean;
  sortOrder?: number;
};

export default function AdminRoomContentPage() {
  const params = useParams<{ id: string }>();
  const roomId = params?.id as string;
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminContentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminContentItem | null>(null);
  const [teacherContentEmpty, setTeacherContentEmpty] = useState<boolean | null>(
    null
  );

  const fetchContent = () => {
    setTeacherContentEmpty(null);
    api
      .get(`/centers/rooms/${roomId}/content`)
      .then((response) => {
        const data = response.data ?? {};
        const roomData = data.room ?? data;
        const resolvedTeacherName =
          roomData.teacher?.name ?? roomData.teacher_name ?? roomData.teacherName ?? "المدرس";
        setRoom({
          id: roomId,
          name: roomData.name ?? roomData.room_name ?? "Room",
          subject: roomData.subject ?? roomData.subject_name ?? "",
          gradeLevel: roomData.gradeLevel ?? roomData.grade_level ?? "",
          teacherId:
            roomData.teacher_id ??
            roomData.teacherId ??
            roomData.teacher?.id ??
            roomData.teacher?._id ??
            null,
          teacherName: resolvedTeacherName,
        });
        const contentItems = data.content ?? data.items ?? [];
        setItems(contentItems.map((item: any) => mapContent(item, resolvedTeacherName)));
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };

  useEffect(() => {
    if (roomId) fetchContent();
  }, [roomId]);

  useEffect(() => {
    if (!room?.teacherId) return;
    api
      .get(`/centers/teachers/${room.teacherId}/content`, {
        params: { limit: 1, offset: 0 },
      })
      .then((response) => {
        const items = response.data?.content ?? response.data ?? [];
        
        setTeacherContentEmpty(items.length === 0);
      })
      .catch(() => setTeacherContentEmpty(false));
  }, [room?.teacherId]);

  const handleDragStart = (id: string) => {
    setDragId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const current = [...items];
    const fromIndex = current.findIndex((item) => item.id === dragId);
    const toIndex = current.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setItems(current);
    saveOrder(current);
    setDragId(null);
  };

  const saveOrder = (updated: AdminContentItem[]) => {
    setSavingOrder(true);
    const contentOrder = updated.map((item, index) => ({
      id: item.id,
      sortOrder: index + 1,
    }));
    api
      .put(`/rooms/${roomId}/content/reorder`, { contentOrder })
      .then(() => {
        setToast("تم حفظ الترتيب ✓");
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setSavingOrder(false));
  };

  const handleSave = (values: ContentFormValues) => {
    const payload = {
      is_free: values.isFree,
      is_active: values.isActive,
      sort_order: values.sortOrder,
    };
    if (!editingItem) return;
    api
      .put(`/content/${editingItem.id}`, payload)
      .then(() => {
        setToast("تم حفظ المحتوى ✓");
        setEditModalOpen(false);
        setEditingItem(null);
        fetchContent();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    api
      .delete(`/content/${deleteTarget.id}`)
      .then(() => {
        setToast("تم حذف المحتوى");
        setDeleteTarget(null);
        fetchContent();
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

         <div className="flex items-center justify-between">
           <div>
             <Link href="/admin/rooms" className="text-xs text-muted">
               ← رجوع
             </Link>
             <h1 className="mt-2 text-2xl font-semibold">{room?.name}</h1>
             <p className="text-sm text-muted">
               {room?.subject} · {room?.gradeLevel}
             </p>
           </div>
           <button
             type="button"
             onClick={() => setPickerOpen(true)}
             className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
           >
             إضافة محتوى
           </button>
         </div>

        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-xs ${
            teacherContentEmpty
              ? "bg-accent/15 text-accent"
              : "bg-secondary/15 text-secondary"
          }`}
        >
          {teacherContentEmpty
            ? `⚠️ المدرس ${room?.teacherName ?? "المدرس"} مش رافع محتوى للمركز ده لسه. تواصل معاه عشان يرفع المحتوى من لوحة التحكم بتاعته`
            : "💡 المحتوى بيجي من المدرس المرتبط بالـ Room. المدرس هو اللي بيرفع المحتوى، وانت بتختار منه اللي يتضاف للـ Room دي"}
        </div>

        <div className="mt-2 text-xs text-muted">
          عدد المحتويات: {items.length} {savingOrder && "· جارٍ حفظ الترتيب..."}
        </div>

        <div className="mt-6 space-y-3">
          {items.length === 0 ? (
            <EmptyState illustration="📂" title="مفيش محتوى لسه" />
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(item.id)}
              >
                <ContentItemRow
                  item={item}
                  onEdit={() => {
                    setEditingItem(item);
                    setEditModalOpen(true);
                  }}
                  onDelete={() => setDeleteTarget(item)}
                />
              </div>
            ))
          )}
        </div>

        {pickerOpen && (
          <TeacherContentPickerModal
            roomId={roomId}
            teacherId={room?.teacherId ?? null}
            teacherName={room?.teacherName ?? "المدرس"}
            existingContentIds={items
              .map((item) => item.teacherContentId)
              .filter(Boolean) as string[]}
            currentMaxSortOrder={
              Math.max(
                0,
                ...items.map((item) => item.sortOrder ?? 0),
                items.length
              )
            }
            onSuccess={fetchContent}
            onClose={() => setPickerOpen(false)}
          />
        )}

        {editModalOpen && (
          <ContentFormModal
            editingItem={editingItem}
            onClose={() => {
              setEditModalOpen(false);
              setEditingItem(null);
            }}
            onSubmit={handleSave}
          />
        )}

        {deleteTarget && (
          <ConfirmModal
            title={`هتمسح '${deleteTarget.title}'؟`}
            message="الحذف نهائي"
            confirmText="تأكيد الحذف"
            confirmColor="bg-error"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </PageTransition>
    </AdminShell>
  );
}

function ContentFormModal({
  editingItem,
  onClose,
  onSubmit,
}: {
  editingItem: AdminContentItem | null;
  onClose: () => void;
  onSubmit: (values: ContentFormValues) => void;
}) {
  const [values, setValues] = useState<ContentFormValues>({
    isFree: editingItem?.isFree ?? true,
    isActive: editingItem?.isActive ?? true,
    sortOrder: editingItem?.sortOrder ?? undefined,
  });

  const setField = (key: keyof ContentFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-2xl md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            تعديل المحتوى
          </h3>
          <button type="button" onClick={onClose} className="text-xl">
            ×
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">
            <p className="text-xs">بيانات المحتوى الأصلية (من المدرس)</p>
            <div className="mt-2 space-y-1">
              <p>
                النوع:{" "}
                {editingItem?.type === "video"
                  ? "🎬 فيديو"
                  : editingItem?.type === "pdf"
                  ? "📄 PDF"
                  : "🔗 رابط"}
              </p>
              <p>العنوان: {editingItem?.title ?? "-"}</p>
              <p className="line-clamp-2">الوصف: {editingItem?.description ?? "-"}</p>
              <p className="truncate">الرابط: {editingItem?.url ?? "-"}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.isFree}
                onChange={(event) => setField("isFree", event.target.checked)}
              />
              مجاني للجميع
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => setField("isActive", event.target.checked)}
              />
              {values.isActive ? "نشط" : "موقف"}
            </label>
            <input
              type="number"
              placeholder="ترتيب المحتوى (اختياري)"
              value={values.sortOrder ?? ""}
              onChange={(event) =>
                setField(
                  "sortOrder",
                  event.target.value ? Number(event.target.value) : undefined
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none md:col-span-2"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSubmit(values)}
          className="btn-ripple mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          حفظ
        </button>
      </div>
    </div>
  );
}

function mapContent(item: any, fallbackTeacherName?: string): AdminContentItem {
  const rawType = item.type ?? "video";
  const typeValue = ["video", "pdf", "link"].includes(rawType) ? rawType : "video";
  return {
    id: item.id ?? item._id,
    teacherContentId:
      item.teacher_content_id ??
      item.teacherContentId ??
      item.teacher_content?.id ??
      item.teacherContent?.id ??
      null,
    teacherName:
      item.teacher_name ??
      item.teacherName ??
      item.teacher?.name ??
      item.teacher_content?.teacher_name ??
      fallbackTeacherName ??
      null,
    type: typeValue,
    title: item.title ?? "",
    description: item.description ?? "",
    url: item.url ?? "",
    isFree: item.is_free ?? item.isFree ?? false,
    isActive: item.isActive ?? item.is_active ?? true,
    sortOrder: item.sort_order ?? item.sortOrder ?? null,
  };
}
