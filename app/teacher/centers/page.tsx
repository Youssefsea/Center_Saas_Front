"use client";

import { useEffect, useState } from "react";
import { TeacherShell } from "../../components/teacher/teacher-shell";
import { PageTransition } from "../../components/page-transition";
import { ErrorToast } from "../../components/error-toast";
import { EmptyState } from "../../components/empty-state";
import {
  TeacherCenter,
  TeacherCenterCard,
} from "../../components/teacher/teacher-center-card";
import { api, normalizeApiError } from "../../lib/api";

export default function TeacherCentersPage() {
  const [centers, setCenters] = useState<TeacherCenter[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/teacher/me/centers")
      .then((response) => {
        const items = response.data?.centers ?? response.data ?? [];
        setCenters(items.map(mapCenter));
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <TeacherShell>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">مراكزي</h1>
            <p className="text-sm text-muted font-english" dir="ltr">
              My Centers
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
            {centers.length} مركز
          </span>
        </section>

        <div className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-xs text-accent">
          المراكز بتضيفك، مش انت اللي بتضيف
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {loading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`center-loading-${index}`}
                className="skeleton h-52 w-full rounded-3xl border border-slate-100"
              />
            ))
          ) : centers.length === 0 ? (
            <div className="md:col-span-2">
              <EmptyState
                illustration="🏫"
                title="مش مرتبط بأي مركز لسه"
                subtitle="المراكز بتضيفك، تواصل مع مركز عشان يضيفك"
              />
            </div>
          ) : (
            centers.map((center) => <TeacherCenterCard key={center.id} center={center} />)
          )}
        </section>
      </PageTransition>
    </TeacherShell>
  );
}

function mapCenter(item: any): TeacherCenter {
  return {
    id: item.id ?? item._id,
    name: item.name ?? item.center_name ?? "مركز",
    address: item.address ?? item.location ?? "",
    phone: item.phone ?? item.phone_number ?? null,
    rating: item.rating ?? item.average_rating ?? null,
    joinedAt: item.joinedAt ?? item.joined_at ?? item.created_at ?? null,
    mySessionsCount:
      item.my_sessions_count ??
      item.mySessionsCount ??
      item.sessions_count ??
      0,
    myRoomsCount:
      item.my_rooms_count ?? item.myRoomsCount ?? item.rooms_count ?? 0,
    contentCount: item.content_count ?? item.contentCount ?? 0,
  };
}
