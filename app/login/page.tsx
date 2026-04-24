"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { api, getErrorMessage, normalizeApiError } from "../lib/api";
import { roleRedirects } from "../lib/constants";
import { ErrorToast } from "../components/error-toast";
import { PageTransition } from "../components/page-transition";
import { PublicOnlyRoute } from "../components/route-guards";
import { useAuth } from "../providers/auth-provider";

const schema = z.object({
  email: z.string().email("أدخل بريد إلكتروني صحيح"),
  password: z.string().min(1, "كلمة السر مطلوبة"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

type JwtPayload = {
  role: "student" | "teacher" | "center_admin" | "super_admin";
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return api
      .post(
        "/auth/login",
        {
          email: values.email,
          password: values.password,
        },
        { signal: controller.signal }
      )
      .then((response) => {
        const token = response.data?.token ?? response.data?.accessToken;
        console.log("Received token:", token);
        if (!token) {
          
          setFormError("البريد الإلكتروني أو كلمة السر غلط");
          return;
        }
        login(token);
        const payload = jwtDecode<JwtPayload>(token);
        const target = roleRedirects[payload.role] ?? "/dashboard";
        router.replace(target);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        if (normalized.status) {
          setFormError("البريد الإلكتروني أو كلمة السر غلط");
        } else {
          const data = error?.response?.data ?? {};
          console.log("Error response data:", data);
          setToast(getErrorMessage(data));
        }
      });
  };

  return (
    <PublicOnlyRoute>
      <PageTransition className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-16">
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-card">
          <h1 className="text-2xl font-semibold">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-muted">أهلًا بيك من جديد 👋</p>

          <div className="mt-6 space-y-4">
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
              <label className="text-sm font-medium">كلمة السر</label>
              <div className="relative mt-2">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted"
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error">
                  {errors.password.message}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" {...register("remember")} />
              تذكرني
            </label>

            {formError && (
     <motion.div
  key={formError}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0, x: [0, -8, 8, -6, 6, 0] }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.4 }}
  className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error"
>
  {formError}
</motion.div>
            )}

            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              aria-label="تسجيل الدخول"
              disabled={isSubmitting}
              className="btn-ripple w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.97] disabled:opacity-60"
            >
              {isSubmitting ? "جارٍ الدخول..." : "دخول"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            مش عندك حساب؟{" "}
            <Link href="/register" className="font-semibold text-primary">
              سجل دلوقتي
            </Link>
          </p>
        </div>
      </PageTransition>
    </PublicOnlyRoute>
  );
}
