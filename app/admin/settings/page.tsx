"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "../../components/admin/admin-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { ConfirmModal } from "../../components/admin/confirm-modal";
import { api, normalizeApiError } from "../../lib/api";
import { useAuth } from "../../providers/auth-provider";

type CenterInfo = {
  name: string;
  address: string;
  phone?: string | null;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type AccountInfo = {
  name: string;
  email: string;
  phone?: string | null;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"center" | "account">("center");
  const [center, setCenter] = useState<CenterInfo>({
    name: "",
    address: "",
    phone: "",
    description: "",
    lat: null,
    lng: null,
  });
  const [account, setAccount] = useState<AccountInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [toast, setToast] = useState<string | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    api
      .get("/centers/me")
      .then((response) => {
        const data = response.data?.center ?? response.data ?? {};
        setCenter({
          name: data.name ?? data.center_name ?? "",
          address: data.address ?? data.location ?? "",
          phone: data.phone ?? data.phone_number ?? "",
          description: data.description ?? "",
          lat: data.lat ?? data.latitude ?? null,
          lng: data.lng ?? data.longitude ?? null,
        });
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
    api
      .get("/users/me")
      .then((response) => {
        const data = response.data?.user ?? response.data ?? {};
        setAccount({
          name: data.name ?? data.full_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        });
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  }, []);

  const saveCenter = () => {
    api
      .put("/centers/me", {
        name: center.name,
        address: center.address,
        phone: center.phone,
        description: center.description,
        lat: center.lat,
        lng: center.lng,
      })
      .then(() => setToast("اتحفظت بيانات المركز ✓"))
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };

  const saveAccount = () => {
    api
      .put("/users/me", {
        name: account.name,
        phone: account.phone,
      })
      .then(() => setToast("اتحفظت بياناتك ✓"))
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      });
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setToast("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
      },
      () => setToast("لم نتمكن من تحديد الموقع")
    );
  };

  return (
    <AdminShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-semibold">إعدادات المركز</h1>
          <div className="flex gap-3 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab("center")}
              className={`rounded-full px-4 py-2 ${
                activeTab === "center"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              المركز
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`rounded-full px-4 py-2 ${
                activeTab === "account"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              حسابي
            </button>
          </div>

          {activeTab === "center" ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                  {center.name.slice(0, 1) || "م"}
                </div>
                <div>
                  <p className="text-sm font-semibold">{center.name || "مركزك"}</p>
                  <p className="text-xs text-muted">
                    التحديث يتم من خلال الدعم الفني
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={center.name}
                  onChange={(event) =>
                    setCenter((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="اسم المركز"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
                />
                <input
                  value={center.address}
                  onChange={(event) =>
                    setCenter((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="عنوان المركز"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
                />
                <input
                  value={center.phone ?? ""}
                  onChange={(event) =>
                    setCenter((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="رقم تليفون المركز"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
                />
                <textarea
                  value={center.description ?? ""}
                  onChange={(event) =>
                    setCenter((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="وصف المركز"
                  className="min-h-[80px] rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none md:col-span-2"
                />
                <div className="md:col-span-2 space-y-2">
                  <button
                    type="button"
                    onClick={useLocation}
                    className="btn-ripple rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
                  >
                    استخدم موقعي الحالي
                  </button>
                  <p className="text-xs text-muted">
                    Lat: {center.lat?.toFixed(4)} · Lng: {center.lng?.toFixed(4)}
                  </p>
                  <iframe
                    title="map-preview"
                    className="h-48 w-full rounded-2xl border"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${center.lng! - 0.01}%2C${center.lat! - 0.01}%2C${center.lng! + 0.01}%2C${center.lat! + 0.01}&layer=mapnik&marker=${center.lat}%2C${center.lng}`}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={saveCenter}
                className="btn-ripple mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white"
              >
                حفظ بيانات المركز
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={account.name}
                  onChange={(event) =>
                    setAccount((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="الاسم"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
                />
                <input
                  value={account.email}
                  readOnly
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none"
                />
                <input
                  value={account.phone ?? ""}
                  onChange={(event) =>
                    setAccount((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="رقم الموبايل"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={saveAccount}
                className="btn-ripple mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white"
              >
                حفظ بياناتي
              </button>

              <div className="mt-8 rounded-3xl border border-error/30 bg-error/5 p-6">
                <h3 className="text-sm font-semibold text-error">منطقة خطرة</h3>
                <button
                  type="button"
                  onClick={() => setLogoutConfirm(true)}
                  className="mt-4 w-full rounded-full border border-error px-4 py-2 text-sm font-semibold text-error"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )}
        </div>

        {logoutConfirm && (
          <ConfirmModal
            title="تأكيد تسجيل الخروج"
            message="متأكد إنك عايز تسجل الخروج؟"
            confirmText="تأكيد"
            confirmColor="bg-error"
            onConfirm={() => {
              logout();
              router.replace("/login");
            }}
            onCancel={() => setLogoutConfirm(false)}
          />
        )}
      </PageTransition>
    </AdminShell>
  );
}
