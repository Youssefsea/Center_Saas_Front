"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { api, getErrorMessage, normalizeApiError } from "../lib/api";
import {
  gradeLevels,
  REGISTER_REDIRECT_MS,
  roleRedirects,
} from "../lib/constants";
import { ErrorToast } from "../components/error-toast";
import { PageTransition } from "../components/page-transition";
import { PublicOnlyRoute } from "../components/route-guards";
import { useAuth } from "../providers/auth-provider";

const schema = z
  .object({
    role: z.enum(["student", "teacher", "center_admin"]),
    name: z.string().min(1, "الاسم مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    phone: z
      .string()
      .regex(/^01[0125]\d{8}$/, "رقم موبيل غير صحيح"),
    password: z.string().min(6, "كلمة السر قصيرة"),
    confirmPassword: z.string().min(1, "أكد كلمة السر"),
    bio: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    gradeLevels: z.array(z.string()).optional(),
    centerName: z.string().optional(),
    centerAddress: z.string().optional(),
    centerPhone: z.string().optional(),
    centerDescription: z.string().optional(),
    centerLat: z.string().optional(),
    centerLng: z.string().optional(),
    agree: z.boolean().refine((value) => value === true, "لازم توافق على الشروط"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "كلمة السر غير متطابقة",
        path: ["confirmPassword"],
      });
    }

    if (data.role === "teacher") {
      if (!data.bio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "النبذة مطلوبة",
          path: ["bio"],
        });
      }
      if (!data.subjects?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اختر المواد",
          path: ["subjects"],
        });
      }
      if (!data.gradeLevels?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اختر الصفوف",
          path: ["gradeLevels"],
        });
      }
    }

    if (data.role === "center_admin") {
      if (!data.centerName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اسم المركز مطلوب",
          path: ["centerName"],
        });
      }
      if (!data.centerAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "عنوان المركز مطلوب",
          path: ["centerAddress"],
        });
      }
      if (!data.centerPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "رقم المركز مطلوب",
          path: ["centerPhone"],
        });
      } else if (!/^01[0125]\d{8}$/.test(data.centerPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "رقم المركز غير صحيح",
          path: ["centerPhone"],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type JwtPayload = {
  role: "student" | "teacher" | "center_admin" | "super_admin";
};

type AvatarPreset = {
  id: string;
  label: string;
  url: string;
};

const subjectOptionsFallback = [
  "Math",
  "Physics",
  "Chemistry",
  "Arabic",
  "English",
  "Biology",
  "French",
  "Science",
];

export const ArbicSubjectsMap: Record<string, string> = {
  Math: "رياضيات",
  Physics: "فيزياء",
  Chemistry: "كيمياء",
  Biology: "أحياء",
  Arabic: "عربي",
  English: "إنجليزي",
  French: "فرنسي",
  Science: "علوم",
  "دراسات اجتماعية": "دراسات اجتماعية",
  "تربية دينية": "تربية دينية",
  "حاسب آلي": "حاسب آلي",
  "الماني ": "الماني ",
  "اسباني ": "اسباني ",
};

const roleLabels: Record<string, string> = {
  student: "طالب",
  teacher: "مدرس",
  center_admin: "مركز تعليمي",
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const subjects = useMemo(
    () => subjectOptionsFallback.map((sub) => ArbicSubjectsMap[sub] ?? sub),
    []
  );
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreset, setAvatarPreset] = useState<AvatarPreset | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "student",
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      bio: "",
      subjects: [],
      gradeLevels: [],
      centerName: "",
      centerAddress: "",
      centerPhone: "",
      centerDescription: "",
      centerLat: "",
      centerLng: "",
      agree: false,
    },
  });

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "teacher" || roleParam === "center_admin") {
      setValue("role", roleParam);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const values = useWatch({ control }) as FormValues;

  const passwordStrength = useMemo(() => {
    if (!values.password) return 0;
    if (values.password.length < 6) return 1;
    if (values.password.length < 10) return 2;
    return 3;
  }, [values.password]);

  const stepFields: Record<number, (keyof FormValues)[]> = useMemo(() => ({
    1: ["role"],
    2: ["name", "email", "phone", "password", "confirmPassword"],
    3:
      values.role === "teacher"
        ? ["bio", "subjects", "gradeLevels"]
        : values.role === "center_admin"
        ? ["centerName", "centerAddress", "centerPhone"]
        : [],
    4: ["agree"],
  }), [values.role]);

  const handleNext = useCallback(async () => {
    const fields = stepFields[step] ?? [];
    const valid = await trigger(fields);
    if (valid) setStep((prev) => Math.min(4, prev + 1));
  }, [step, stepFields, trigger]);

  const toggleArrayValue = useCallback(
    (field: "subjects" | "gradeLevels", value: string) => {
      const current = new Set(values[field] ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      setValue(field, Array.from(current));
    },
    [setValue, values]
  );

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setToast("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("centerLat", String(position.coords.latitude));
        setValue("centerLng", String(position.coords.longitude));
      },
      () => setToast("لم نتمكن من تحديد الموقع")
    );
  }, [setValue]);

  const onSubmit = (data: FormValues) => {
    const payload = new FormData();
    payload.append("role", data.role);
    payload.append("name", data.name);
    payload.append("email", data.email);
    payload.append("phone", data.phone);
    payload.append("password", data.password);

    if (data.role === "teacher") {
      if (data.bio) payload.append("bio", data.bio);
      data.subjects?.forEach((subject) => payload.append("subjects", subject));
      data.gradeLevels?.forEach((level) => payload.append("grade_levels", level));
    }

    if (data.role === "center_admin") {
      payload.append("center_name", data.centerName ?? "");
      payload.append("center_address", data.centerAddress ?? "");
      payload.append("center_phone", data.centerPhone ?? "");
      payload.append("center_description", data.centerDescription ?? "");
      payload.append("center_lat", data.centerLat ?? "");
      payload.append("center_lng", data.centerLng ?? "");

      if (data.centerLat && data.centerLng) {
        payload.append("lat", data.centerLat);
        payload.append("lng", data.centerLng);
      }
    }

    if (avatarFile) {
      payload.append("avatar", avatarFile);
    } else if (avatarPreset) {
      payload.append("avatar_preset", avatarPreset.id);
      payload.append("avatar_url", avatarPreset.url);
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    return api
      .post("/auth/register", payload, {
        signal: controller.signal,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        const token = response.data?.token ?? response.data?.accessToken;
        if (!token) {
          setToast("فشل إنشاء الحساب، حاول تاني");
          return;
        }
        login(token);
        setSuccess(true);
        const payloadDecoded = jwtDecode<JwtPayload>(token);
        const target = roleRedirects[payloadDecoded.role] ?? "/dashboard";
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = window.setTimeout(() => {
          router.replace(target);
        }, REGISTER_REDIRECT_MS);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        if (normalized.code === "EMAIL_EXISTS") {
          setToast("البريد الإلكتروني ده مستخدم بالفعل");
        } else {
          const data = error?.response?.data ?? {};
          setToast(getErrorMessage(data));
        }
      });
  };

  return (
    <PublicOnlyRoute>
      <PageTransition className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-16">
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
        <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-8 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">إنشاء حساب</h1>
              <p className="mt-1 text-sm text-muted">خطوات بسيطة وتكون جاهز</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="font-english" dir="ltr">
                Step {step}/4
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold">هتسجل كـ إيه؟</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    { value: "student", label: "طالب", icon: "🎓" },
                    { value: "teacher", label: "مدرس", icon: "👨‍🏫" },
                    { value: "center_admin", label: "مركز تعليمي", icon: "🏫" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => setValue("role", item.value as FormValues["role"])}
                      className={`relative flex flex-col items-center gap-3 rounded-3xl border px-4 py-6 text-sm font-semibold transition ${
                        values.role === item.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {values.role === item.value && (
                        <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                          ✓
                        </span>
                      )}
                      <span className="text-2xl">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">الاسم بالكامل</label>
                  <input
                    {...register("name")}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-error">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">البريد الإلكتروني</label>
                  <input
                    {...register("email")}
                    type="email"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-error">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">رقم الموبايل</label>
                  <input
                    {...register("phone")}
                    placeholder="01XXXXXXXXX"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-error">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">كلمة السر</label>
                  <input
                    {...register("password")}
                    type="password"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          passwordStrength >= level
                            ? level === 1
                              ? "bg-error"
                              : level === 2
                              ? "bg-accent"
                              : "bg-success"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-error">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">تأكيد كلمة السر</label>
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-error">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">الصورة الشخصية (اختياري)</label>
                  <div className="mt-2 rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="cursor-pointer rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                        رفع صورة
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            if (avatarPreview?.startsWith("blob:")) {
                              URL.revokeObjectURL(avatarPreview);
                            }
                            if (file) {
                              const preview = URL.createObjectURL(file);
                              setAvatarFile(file);
                              setAvatarPreset(null);
                              setAvatarPreview(preview);
                            } else {
                              setAvatarFile(null);
                              setAvatarPreview(null);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                        onClick={() => {
                          if (avatarPreview?.startsWith("blob:")) {
                            URL.revokeObjectURL(avatarPreview);
                          }
                          setAvatarFile(null);
                          setAvatarPreset(null);
                          setAvatarPreview(null);
                        }}
                      >
                        بدون صورة
                      </button>
                      {avatarPreview && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                          />
                          <span>معاينة الصورة الحالية</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && values.role === "teacher" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">نبذة عنك</label>
                  <textarea
                    {...register("bio")}
                    className="mt-2 min-h-30 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.bio && (
                    <p className="mt-1 text-xs text-error">{errors.bio.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">المواد اللي بتدرسها</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <button
                        type="button"
                        key={subject}
                        onClick={() => toggleArrayValue("subjects", subject)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          values.subjects?.includes(subject)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                  {errors.subjects && (
                    <p className="mt-1 text-xs text-error">
                      {errors.subjects.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">الصفوف الدراسية</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {gradeLevels.map((level) => (
                      <button
                        type="button"
                        key={level}
                        onClick={() => toggleArrayValue("gradeLevels", level)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          values.gradeLevels?.includes(level)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  {errors.gradeLevels && (
                    <p className="mt-1 text-xs text-error">
                      {errors.gradeLevels.message as string}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && values.role === "center_admin" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">اسم المركز</label>
                  <input
                    {...register("centerName")}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.centerName && (
                    <p className="mt-1 text-xs text-error">{errors.centerName.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">عنوان المركز</label>
                  <input
                    {...register("centerAddress")}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.centerAddress && (
                    <p className="mt-1 text-xs text-error">{errors.centerAddress.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">رقم تليفون المركز</label>
                  <input
                    {...register("centerPhone")}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  {errors.centerPhone && (
                    <p className="mt-1 text-xs text-error">{errors.centerPhone.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">وصف المركز</label>
                  <textarea
                    {...register("centerDescription")}
                    className="mt-2 min-h-25 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">الموقع على الخريطة</label>
                  <div className="mt-2 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      {...register("centerLat")}
                      placeholder="Latitude"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <input
                      {...register("centerLng")}
                      placeholder="Longitude"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={getLocation}
                      className="btn-ripple rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white"
                    >
                      استخدم موقعي الحالي
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && values.role === "student" && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-muted">
                مفيش بيانات إضافية مطلوبة للطلاب في الخطوة دي.
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <p>الاسم: {values.name}</p>
                  <p>البريد الإلكتروني: {values.email}</p>
                  <p>الموبايل: {values.phone}</p>
                  <p>الدور: {roleLabels[values.role]}</p>
                  {values.role === "teacher" && (
                    <>
                      <p>المواد: {values.subjects?.join("، ")}</p>
                      <p>الصفوف: {values.gradeLevels?.join("، ")}</p>
                    </>
                  )}
                  {values.role === "center_admin" && (
                    <>
                      <p>رقم التليفون: {values.centerPhone}</p>
                      <p>المركز: {values.centerName}</p>
                      <p>العنوان: {values.centerAddress}</p>
                    </>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" {...register("agree")} />
                  موافق على الشروط والأحكام
                </label>
                {errors.agree && (
                  <p className="text-xs text-error">{errors.agree.message}</p>
                )}
              </div>
            )}

            {errors.centerPhone || errors.bio || errors.subjects || errors.gradeLevels || errors.centerName || errors.centerAddress || errors.agree ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-xs text-error">
                  {errors.centerPhone?.message ||
                    errors.bio?.message ||
                    errors.subjects?.message ||
                    errors.gradeLevels?.message ||
                    errors.centerName?.message ||
                    errors.centerAddress?.message ||
                    errors.agree?.message}
                </p>
              </motion.div>
            ) : null}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl bg-success/10 px-6 py-4 text-center text-success"
              >
                تم إنشاء الحساب بنجاح 🎉
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
                disabled={step === 1}
              >
                رجوع
              </button>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  className="btn-ripple rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmit(onSubmit)();
                  }}
                  disabled={isSubmitting}
                  className="btn-ripple rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
                </button>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            عندك حساب؟{" "}
            <Link href="/login" className="font-semibold text-primary">
              سجل دخول
            </Link>
          </p>
        </div>
      </PageTransition>
    </PublicOnlyRoute>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
