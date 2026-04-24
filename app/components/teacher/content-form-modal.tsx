"use client";

import {
  ChangeEvent,
  FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, normalizeApiError } from "../../lib/api";
import { MAX_TITLE_LENGTH } from "../../../constants";
import { ErrorToast } from "../error-toast";
import { TeacherContentItem } from "./teacher-content-card";
import useModalKeyboard from "../../hooks/useModalKeyboard";

type Mode = "add" | "edit";

type ContentFormValues = {
  type: "video" | "pdf" | "link";
  title: string;
  description?: string;
  url: string;
  isFree: boolean;
  isActive: boolean;
};

export function ContentFormModal({
  mode,
  centerId,
  centerName,
  content,
  onClose,
  onSuccess,
}: {
  mode: Mode;
  centerId: string;
  centerName: string;
  content?: TeacherContentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<ContentFormValues>({
    type: content?.type ?? "video",
    title: content?.title ?? "",
    description: content?.description ?? "",
    url: content?.url ?? "",
    isFree: content?.isFree ?? true,
    isActive: content?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleToastClose = useCallback(() => setToast(null), []);
  const setField = useCallback((key: keyof ContentFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (content) {
      setValues({
        type: content.type,
        title: content.title,
        description: content.description ?? "",
        url: content.url,
        isFree: content.isFree,
        isActive: content.isActive,
      });
    }
  }, [content]);

  const validateUrl = (value: string) => {
    try {
      // eslint-disable-next-line no-new
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    if (!values.title) nextErrors.title = "العنوان مطلوب";
    if (!values.url) nextErrors.url = "الرابط مطلوب";
    if (values.url && !validateUrl(values.url)) nextErrors.url = "الرابط ده مش صح";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [values]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    setSaving(true);
    const payload: any =
      mode === "add"
        ? {
            centerId,
            type: values.type,
            title: values.title,
            description: values.description,
            url: values.url,
            is_free: values.isFree,
          }
        : {
            title: values.title,
            description: values.description,
            url: values.url,
            is_free: values.isFree,
            is_active: values.isActive,
          };

    const request =
      mode === "add"
        ? api.post("/teacher/me/content", payload)
        : api.put(`/teacher/me/content/${content?.id}`, payload);

    request
      .then(() => {
        setToast(mode === "add" ? "اتضاف المحتوى ✓" : "اتحفظت التعديلات ✓");
        onSuccess();
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        if (normalized.code === "NOT_YOUR_CENTER") {
          setToast("مش بتشتغل في السنتر دي");
        } else if (normalized.code === "INVALID_URL") {
          setErrors((prev) => ({ ...prev, url: "الرابط ده مش صح" }));
        } else {
          setToast(normalized.message);
        }
      })
      .finally(() => setSaving(false));
  }, [centerId, content?.id, mode, onSuccess, validate, values]);

  const handleTypeChange = useCallback(
    (value: ContentFormValues["type"]) => setField("type", value),
    [setField]
  );
  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField("title", event.target.value),
    [setField]
  );
  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      setField("description", event.target.value),
    [setField]
  );
  const handleUrlChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setField("url", event.target.value),
    [setField]
  );
  const handleUrlBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (event.target.value && !validateUrl(event.target.value)) {
        setErrors((prev) => ({ ...prev, url: "الرابط ده مش صح" }));
      } else {
        setErrors((prev) => ({ ...prev, url: "" }));
      }
    },
    []
  );
  const handleOpenUrl = useCallback(() => {
    if (values.url) window.open(values.url, "_blank");
  }, [values.url]);
  const handleFreeToggle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField("isFree", event.target.checked),
    [setField]
  );
  const handleActiveToggle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField("isActive", event.target.checked),
    [setField]
  );

  const contentTypeOptions = useMemo(
    () => [
      { value: "video", label: "🎬 فيديو" },
      { value: "pdf", label: "📄 PDF" },
      { value: "link", label: "🔗 رابط" },
    ],
    []
  );

  useModalKeyboard(true, handleClose, closeRef);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      {toast && <ErrorToast message={toast} onClose={handleToastClose} />}
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-2xl md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {mode === "add" ? "إضافة محتوى جديد" : "تعديل المحتوى"}
          </h3>
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

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-muted">نوع المحتوى</label>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {contentTypeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleTypeChange(item.value)}
                  disabled={mode === "edit"}
                  aria-label={`اختيار ${item.label}`}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    values.type === item.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-600"
                  } disabled:opacity-60`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted">العنوان</label>
            <input
              value={values.title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={handleTitleChange}
              placeholder="مثال: شرح المشتقات - الجزء الأول"
              aria-label="العنوان"
              aria-required="true"
              aria-invalid={Boolean(errors.title)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            {errors.title && <p className="mt-1 text-xs text-error">{errors.title}</p>}
          </div>

          <div>
            <label className="text-sm text-muted">الوصف (اختياري)</label>
            <textarea
              value={values.description}
              onChange={handleDescriptionChange}
              placeholder="وصف مختصر للمحتوى..."
              aria-label="الوصف"
              className="mt-2 min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="text-sm text-muted">الرابط</label>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
              <input
                value={values.url}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                placeholder={
                  values.type === "video"
                    ? "https://youtube.com/watch?v=..."
                    : values.type === "pdf"
                    ? "https://drive.google.com/..."
                    : "https://..."
                }
                aria-label="الرابط"
                aria-required="true"
                aria-invalid={Boolean(errors.url)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={handleOpenUrl}
                aria-label="فتح الرابط"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs text-slate-600"
              >
                افتح الرابط
              </button>
            </div>
            {errors.url && <p className="mt-1 text-xs text-error">{errors.url}</p>}
          </div>

          <div>
            <label className="text-sm text-muted">نوع الوصول</label>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={values.isFree}
                  onChange={handleFreeToggle}
                  aria-label="نوع الوصول"
                />
                {values.isFree ? "مجاني للجميع في الـ Room" : "للأعضاء المدفوعين فقط"}
              </label>
            </div>
            <p className="mt-1 text-xs text-muted">
              المركز ممكن يغير الإعداد ده لما يضيف المحتوى للـ Room
            </p>
          </div>

          {mode === "edit" && (
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={handleActiveToggle}
                  aria-label="حالة المحتوى"
                />
                {values.isActive ? "نشط" : "موقف"}
              </label>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-muted">
            المحتوى ده للمركز ده بس: {centerName}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-ripple w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ المحتوى"}
          </button>
        </div>
      </div>
    </div>
  );
}
