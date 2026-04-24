"use client";

import {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gradeLevels } from "../../lib/constants";
import useModalKeyboard from "../../hooks/useModalKeyboard";

export type SessionFormValues = {
  teacherId: string;
  subject: string;
  gradeLevel: string;
  date: string;
  time: string;
  duration_min: number;
  capacity: number;
  price: number;
  notes?: string;
};

type TeacherOption = {
  id: string;
  name: string;
  subjects?: string[];
};

export function SessionFormModal({
  isOpen,
  title,
  teachers,
  initialValues,
  conflictMessage,
  loading,
  onSubmit,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  teachers: TeacherOption[];
  initialValues?: Partial<SessionFormValues>;
  conflictMessage?: string | null;
  loading?: boolean;
  onSubmit: (values: SessionFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<SessionFormValues>({
    teacherId: "",
    subject: "",
    gradeLevel: "",
    date: "",
    time: "",
    duration_min: 90,
    capacity: 20,
    price: 0,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues((prev) => ({ ...prev, ...initialValues }));
      setErrors({});
    }
  }, [isOpen, initialValues]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const setField = useCallback((key: keyof SessionFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    if (!values.teacherId) nextErrors.teacherId = "اختار المدرس";
    if (!values.subject) nextErrors.subject = "المادة مطلوبة";
    if (!values.gradeLevel) nextErrors.gradeLevel = "الصف مطلوب";
    if (!values.date || !values.time) nextErrors.date = "التاريخ والوقت مطلوبين";
    if (values.duration_min <= 0) nextErrors.duration_min = "المدة لازم تكون أكبر من 0";
    if (values.capacity <= 0) nextErrors.capacity = "السعة لازم تكون أكبر من 0";
    if (values.price < 0) nextErrors.price = "السعر لازم يكون 0 أو أكثر";
    const dateTime = new Date(`${values.date}T${values.time}`);
    if (values.date && values.time && dateTime.getTime() <= Date.now()) {
      nextErrors.date = "لازم تختار وقت في المستقبل";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [values]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit(values);
  }, [onSubmit, validate, values]);

  const handleTeacherChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => setField("teacherId", e.target.value),
    [setField]
  );
  const handleSubjectChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setField("subject", e.target.value),
    [setField]
  );
  const handleGradeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => setField("gradeLevel", e.target.value),
    [setField]
  );
  const handleDateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setField("date", e.target.value),
    [setField]
  );
  const handleTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setField("time", e.target.value),
    [setField]
  );
  const handleDurationChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setField("duration_min", Number(e.target.value)),
    [setField]
  );
  const handleCapacityChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setField("capacity", Number(e.target.value)),
    [setField]
  );
  const handlePriceChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setField("price", Number(e.target.value)),
    [setField]
  );
  const handleNotesChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => setField("notes", e.target.value),
    [setField]
  );
  const handleDurationPick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const value = Number(e.currentTarget.dataset.value);
      if (!Number.isNaN(value)) setField("duration_min", value);
    },
    [setField]
  );

  const teacherSubjects = useMemo(
    () => teachers.find((t) => t.id === values.teacherId)?.subjects ?? [],
    [teachers, values.teacherId]
  );

  useModalKeyboard(isOpen, handleClose, closeRef);

  if (!isOpen) return null;

  const inputClass =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10";
  const labelClass = "flex flex-col gap-1.5 text-sm";
  const labelTextClass = "text-xs font-medium text-slate-500";
  const errorClass = "text-xs text-error";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm md:items-center"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl md:max-h-[88vh] md:max-w-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="إغلاق"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">

            <label className={labelClass}>
              <span className={labelTextClass}>المدرس</span>
              <select
                value={values.teacherId}
                onChange={handleTeacherChange}
                aria-label="المدرس"
                aria-required="true"
                aria-invalid={Boolean(errors.teacherId)}
                className={inputClass}
              >
                <option value="">اختار المدرس</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {errors.teacherId && <span className={errorClass}>{errors.teacherId}</span>}
            </label>

            <label className={labelClass}>
              <span className={labelTextClass}>المادة</span>
              <input
                value={values.subject}
                onChange={handleSubjectChange}
                list="subject-options"
                placeholder="اكتب أو اختار من القائمة"
                aria-label="المادة"
                aria-required="true"
                aria-invalid={Boolean(errors.subject)}
                className={inputClass}
              />
              <datalist id="subject-options">
                {teacherSubjects.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
              {errors.subject && <span className={errorClass}>{errors.subject}</span>}
            </label>

            <label className={labelClass}>
              <span className={labelTextClass}>الصف الدراسي</span>
              <select
                value={values.gradeLevel}
                onChange={handleGradeChange}
                aria-label="الصف الدراسي"
                aria-required="true"
                aria-invalid={Boolean(errors.gradeLevel)}
                className={inputClass}
              >
                <option value="">اختار الصف</option>
                {gradeLevels.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.gradeLevel && <span className={errorClass}>{errors.gradeLevel}</span>}
            </label>

            <div className="flex flex-col gap-1.5">
              <span className={labelTextClass}>التاريخ والوقت</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={values.date}
                  onChange={handleDateChange}
                  aria-label="التاريخ"
                  aria-required="true"
                  aria-invalid={Boolean(errors.date)}
                  className={inputClass}
                />
                <input
                  type="time"
                  value={values.time}
                  onChange={handleTimeChange}
                  aria-label="الوقت"
                  aria-required="true"
                  aria-invalid={Boolean(errors.date)}
                  className={inputClass}
                />
              </div>
              {(errors.date || conflictMessage) && (
                <span className={errorClass}>{conflictMessage ?? errors.date}</span>
              )}
            </div>

            <label className={labelClass}>
              <span className={labelTextClass}>المدة (دقيقة)</span>
              <input
                type="number"
                value={values.duration_min}
                onChange={handleDurationChange}
                aria-label="المدة (دقيقة)"
                aria-required="true"
                aria-invalid={Boolean(errors.duration_min)}
                className={inputClass}
              />
              <div className="flex flex-wrap gap-2">
                {[45, 60, 90, 120].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={handleDurationPick}
                    data-value={value}
                    aria-label={`اختيار مدة ${value} دقيقة`}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      values.duration_min === value
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {value} د
                  </button>
                ))}
              </div>
              {errors.duration_min && <span className={errorClass}>{errors.duration_min}</span>}
            </label>

            <label className={labelClass}>
              <span className={labelTextClass}>السعة</span>
              <input
                type="number"
                value={values.capacity}
                onChange={handleCapacityChange}
                aria-label="السعة"
                aria-required="true"
                aria-invalid={Boolean(errors.capacity)}
                className={inputClass}
              />
              {errors.capacity && <span className={errorClass}>{errors.capacity}</span>}
            </label>

            <label className={labelClass}>
              <span className={labelTextClass}>السعر</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={values.price}
                  onChange={handlePriceChange}
                  aria-label="السعر"
                  aria-required="true"
                  aria-invalid={Boolean(errors.price)}
                  className={`${inputClass} flex-1`}
                />
                <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                  جنيه
                </span>
              </div>
              {errors.price && <span className={errorClass}>{errors.price}</span>}
            </label>

            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelTextClass}>ملاحظات</span>
              <textarea
                value={values.notes}
                onChange={handleNotesChange}
                aria-label="ملاحظات"
                placeholder="أي ملاحظات إضافية..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </label>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-ripple w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "جارٍ الحفظ..." : "حفظ الحصة"}
          </button>
        </div>
      </div>
    </div>
  );
}