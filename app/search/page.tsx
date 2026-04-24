"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CenterCard } from "../components/center-card";
import { TeacherCard } from "../components/teacher-card";
import { SearchBar } from "../components/search-bar";
import { SkeletonCard } from "../components/skeleton-card";
import { EmptyState } from "../components/empty-state";
import { ErrorToast } from "../components/error-toast";
import { PageTransition } from "../components/page-transition";
import { api, getErrorMessage, normalizeApiError } from "../lib/api";
import { gradeLevels, SEARCH_DEBOUNCE_MS } from "../lib/constants";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {ArbicSubjectsMap}from "../register/page"
type CenterResult = {
  id: string;
  name: string;
  address: string;
  distanceKm?: number | null;
  teachersCount?: number | null;
};

type TeacherResult = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  subjects?: string[];
  gradeLevels?: string[];
  rating?: number | null;
  reviewsCount?: number | null;
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"centers" | "teachers">(
    searchParams.get("tab") === "teachers" ? "teachers" : "centers"
  );

  const [searchValues, setSearchValues] = useState({
    query: searchParams.get("q") ?? "",
    gradeLevel: searchParams.get("grade_level") ?? "",
    subject: searchParams.get("subject") ?? "",
  });

  const [filters, setFilters] = useState({
    area: searchParams.get("address") ?? "",
    distance: searchParams.get("distance") ?? "",
    rating: searchParams.get("rating") ?? "",
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<CenterResult[]>([]);
  const [teachers, setTeachers] = useState<TeacherResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  const debouncedSearchValues = useDebouncedValue(
    searchValues,
    SEARCH_DEBOUNCE_MS
  );
  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = useCallback((values: typeof searchValues) => {
    setSearchValues(values);
  }, []);

  const handleTabChange = useCallback((tab: "centers" | "teachers") => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => null
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchValues.query)
      params.set("q", debouncedSearchValues.query);
    if (debouncedSearchValues.gradeLevel)
      params.set("grade_level", debouncedSearchValues.gradeLevel);
    if (debouncedSearchValues.subject)
      params.set("subject", debouncedSearchValues.subject);
    if (debouncedFilters.area) params.set("address", debouncedFilters.area);
    if (debouncedFilters.distance)
      params.set("distance", debouncedFilters.distance);
    if (debouncedFilters.rating) params.set("rating", debouncedFilters.rating);
    if (activeTab === "teachers") params.set("tab", "teachers");
    const nextQuery = params.toString();
    if (nextQuery !== searchParams.toString()) {
      router.replace(`/search${nextQuery ? `?${nextQuery}` : ""}`);
    }
  }, [debouncedSearchValues, debouncedFilters, activeTab, router, searchParams]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const fetchResults = async () => {
      setLoading(true);
      try {
        if (activeTab === "centers") {
          const response = await api.get("/discovery/centers/search", {
            params: {
              name: debouncedSearchValues.query || undefined,
              address: debouncedFilters.area || undefined,
              lat: location?.lat,
              lng: location?.lng,
              subject: debouncedSearchValues.subject || undefined,
              grade_level: debouncedSearchValues.gradeLevel || undefined,
              distance: debouncedFilters.distance || undefined,
            },
            signal: controller.signal,
          });
          if (!active) return;
          const items = response.data?.centers ?? response.data ?? [];
          setCenters(
            items.map((center: any) => ({
              id: center.id ?? center._id,
              name: center.name ?? center.center_name ?? "مركز تعليمي",
              address: center.address ?? center.location ?? "",
              distanceKm: center.distanceKm ?? center.distance ?? null,
              teachersCount: center.teachersCount ?? center.teachers_count ?? null,
            }))
          );
        } else {
          const response = await api.get("/discovery/teachers/search", {
            params: {
              name: debouncedSearchValues.query || undefined,
              subject: debouncedSearchValues.subject || undefined,
              grade_level: debouncedSearchValues.gradeLevel || undefined,
              rating: debouncedFilters.rating || undefined,
            },
            signal: controller.signal,
          });
          if (!active) return;
          const items = response.data?.teachers ?? response.data ?? [];
          setTeachers(
            items.map((teacher: any) => ({
              id: teacher.teacher_id ?? teacher.id,
              name: teacher.teacher_name ?? "مدرس",
              avatarUrl: teacher.avatar_url  ?? null,
              subjects: teacher.subjects ?? [],
              gradeLevels: teacher.gradeLevels ?? teacher.grade_levels ?? [],
              rating: teacher.rating ?? null,
              reviewsCount: teacher.total_reviews  ?? null,
            }))
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchResults();
    return () => {
      active = false;
      controller.abort();
    };
  }, [activeTab, debouncedSearchValues, debouncedFilters, location]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSubjects = async () => {
    setSubjects(Object.values(ArbicSubjectsMap));
    };
    fetchSubjects();
    return () => controller.abort();
  }, []);

  const results = useMemo(() => {
    if (activeTab === "centers") {
      return centers.map((center) => <CenterCard key={center.id} center={center} />);
    }
    return teachers.map((teacher) => (
      <TeacherCard key={teacher.teacher_id} teacher={teacher} />
    ));
  }, [activeTab, centers, teachers]);

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
      <div className="flex flex-col gap-6">
        <SearchBar
          sticky
          value={searchValues}
          onChange={handleSearchChange}
          onSubmit={() => null}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleTabChange("centers")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "centers"
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            مراكز
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("teachers")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "teachers"
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            مدرسين
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="ml-auto rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 md:hidden"
          >
            فلترة
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-card md:block">
            <FiltersPanel
              activeTab={activeTab}
              filters={filters}
              setFilters={setFilters}
              searchValues={searchValues}
              setSearchValues={setSearchValues}
              subjects={subjects}
            />
          </aside>
          <div>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                illustration="🔍"
                title="مفيش نتايج، جرب كلمات تانية"
                subtitle="غير كلمات البحث أو جرّب فلترة مختلفة"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 md:hidden">
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">فلترة النتائج</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label="إغلاق الفلاتر"
                className="text-xl"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <FiltersPanel
                activeTab={activeTab}
                filters={filters}
                setFilters={setFilters}
                searchValues={searchValues}
                setSearchValues={setSearchValues}
                subjects={subjects}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="btn-ripple mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white"
            >
              تطبيق
            </button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <SearchPageContent />
    </Suspense>
  );
}

function FiltersPanel({
  activeTab,
  filters,
  setFilters,
  searchValues,
  setSearchValues,
  subjects,
}: {
  activeTab: "centers" | "teachers";
  filters: { area: string; distance: string; rating: string };
  setFilters: Dispatch<
    SetStateAction<{ area: string; distance: string; rating: string }>
  >;
  searchValues: { query: string; gradeLevel: string; subject: string };
  setSearchValues: Dispatch<
    SetStateAction<{ query: string; gradeLevel: string; subject: string }>
  >;
  subjects: string[];
}) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      {activeTab === "centers" ? (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-muted">المادة</span>
            <select
              value={searchValues.subject}
              onChange={(event) =>
                setSearchValues((prev) => ({
                  ...prev,
                  subject: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل المواد</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-muted">الصف الدراسي</span>
            <select
              value={searchValues.gradeLevel}
              onChange={(event) =>
                setSearchValues((prev) => ({
                  ...prev,
                  gradeLevel: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل الصفوف</option>
              {gradeLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-muted">المنطقة</span>
            <input
              value={filters.area}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, area: event.target.value }))
              }
              placeholder="مثال: مدينة نصر"
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-muted">المسافة</span>
            <select
              value={filters.distance}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, distance: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل المسافات</option>
              <option value="5">أقل من 5 كم</option>
              <option value="10">أقل من 10 كم</option>
              <option value="20">أقل من 20 كم</option>
            </select>
          </label>
        </>
      ) : (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-muted">المادة</span>
            <select
              value={searchValues.subject}
              onChange={(event) =>
                setSearchValues((prev) => ({
                  ...prev,
                  subject: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل المواد</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-muted">الصف الدراسي</span>
            <select
              value={searchValues.gradeLevel}
              onChange={(event) =>
                setSearchValues((prev) => ({
                  ...prev,
                  gradeLevel: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل الصفوف</option>
              {gradeLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-muted">التقييم</span>
            <select
              value={filters.rating}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, rating: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">كل التقييمات</option>
              <option value="4">4 نجوم فأعلى</option>
              <option value="3">3 نجوم فأعلى</option>
              <option value="2">2 نجمة فأعلى</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
}
