"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "./components/search-bar";
import { PageTransition } from "./components/page-transition";
import { CenterCard, CenterSummary } from "./components/center-card";
import { TeacherCard, TeacherSummary } from "./components/teacher-card";
import { EmptyState } from "./components/empty-state";
import { SkeletonCard } from "./components/skeleton-card";
import { ErrorToast } from "./components/error-toast";
import { api, normalizeApiError } from "./lib/api";
import { DEFAULT_RADIUS_KM, subjectIcons } from "./lib/constants";
import { ArbicSubjectsMap } from "./register/page";

type SubjectEntry = {
  value: string;
  label: string;
  icon: string;
};

type LocationState = {
  lat: number;
  lng: number;
};

const fallbackSubjects = Array.from(new Set(Object.values(ArbicSubjectsMap)));

const mapCenter = (center: any): CenterSummary => ({
  id: center.id ?? center._id,
  name: center.name ?? center.center_name ?? "مركز تعليمي",
  address: center.address ?? center.location ?? "عنوان غير متوفر",
  distanceKm:
    center.distanceKm ??
    center.distance_km ??
    center.distance ??
    null,
  teachersCount: center.teachersCount ?? center.teachers_count ?? null,
});

const mapTeacher = (teacher: any): TeacherSummary => {
  const rawSubjects = Array.isArray(teacher.subjects)
    ? teacher.subjects
    : teacher.subjects
      ? [teacher.subjects]
      : [];

  return {
    id: teacher.teacher_id?? teacher._id,
    name: teacher.teacher_name ??"مدرس",
    avatarUrl: teacher.avatar_url ?? null,
    subjects: rawSubjects.map(
      (subject: string) => ArbicSubjectsMap[subject] ?? subject
    ),
    gradeLevels: teacher.grade_levels ?? [],
    rating: teacher.rating ?? null,
    reviewsCount: teacher.total_reviews ?? null,
  };
};

const getSubjectIcon = (value: string, label: string) => {
  if (subjectIcons[value as keyof typeof subjectIcons]) {
    return subjectIcons[value as keyof typeof subjectIcons];
  }
  const englishKey = Object.keys(ArbicSubjectsMap).find(
    (key) => ArbicSubjectsMap[key] === label
  );
  if (englishKey && subjectIcons[englishKey as keyof typeof subjectIcons]) {
    return subjectIcons[englishKey as keyof typeof subjectIcons];
  }
  return "📘";
};

export default function Home() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [centers, setCenters] = useState<CenterSummary[]>([]);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [searchValues, setSearchValues] = useState({
    query: "",
    gradeLevel: "",
    subject: "",
  });

  const subjectEntries = useMemo<SubjectEntry[]>(() => {
    const seen = new Set<string>();
    return subjects
      .map((value) => {
        const label = ArbicSubjectsMap[value] ?? value;
        if (!label || seen.has(label)) return null;
        seen.add(label);
        return {
          value,
          label,
          icon: getSubjectIcon(value, label),
        };
      })
      .filter(Boolean) as SubjectEntry[];
  }, [subjects]);

  const handleSearchSubmit = useCallback(
    (values: typeof searchValues) => {
      const params = new URLSearchParams();
      if (values.query) params.set("q", values.query);
      if (values.gradeLevel) params.set("grade_level", values.gradeLevel);
      if (values.subject) params.set("subject", values.subject);
      router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router]
  );

  const handleLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setToast("المتصفح لا يدعم تحديد الموقع");
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      () => {
        setToast("لم نتمكن من تحديد موقعك");
        setLocationStatus("error");
      }
    );
  }, []);

  useEffect(() => {
    handleLocation();
  }, [handleLocation]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const response = await api.get("/discovery/subjects", {
          signal: controller.signal,
        });
        const items = response.data?.subjects ?? response.data ?? [];
        const mapped = (Array.isArray(items) ? items : [])
          .map((item: any) =>
            typeof item === "string"
              ? item
              : item?.name ?? item?.subject ?? item?.title ?? ""
          )
          .map((item: string) => ArbicSubjectsMap[item] ?? item)
          .filter(Boolean);
        if (!active) return;
        setSubjects(mapped.length ? mapped : fallbackSubjects);
      } catch (error) {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
        if (active) setSubjects(fallbackSubjects);
      } finally {
        if (active) setLoadingSubjects(false);
      }
    };
    loadSubjects();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const response = await api.get("/discovery/teachers/search", {
          params: {
            subject: searchValues.subject || undefined,
            grade_level: searchValues.gradeLevel || undefined,
            limit: 6,
          },
          signal: controller.signal,
        });
        const items = response.data?.teachers ?? response.data ?? [];
        if (!active) return;
        setTeachers(
          (Array.isArray(items) ? items : []).map(mapTeacher).slice(0, 6)
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      } finally {
        if (active) setLoadingTeachers(false);
      }
    };
    loadTeachers();
    return () => {
      active = false;
      controller.abort();
    };
  }, [searchValues.gradeLevel, searchValues.subject]);

  useEffect(() => {
    if (!location) return;
    let active = true;
    const controller = new AbortController();
    const loadCenters = async () => {
      setLoadingCenters(true);
      try {
        const response = await api.get("/discovery/centers/nearby", {
          params: {
            lat: location.lat,
            lng: location.lng,
            radius,
            limit: 6,
          },
          signal: controller.signal,
        });
        const items = response.data?.centers ?? response.data ?? [];
        if (!active) return;
        setCenters(
          (Array.isArray(items) ? items : []).map(mapCenter).slice(0, 6)
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      } finally {
        if (active) setLoadingCenters(false);
      }
    };
    loadCenters();
    return () => {
      active = false;
      controller.abort();
    };
  }, [location, radius]);

  const locationLabel = useMemo(() => {
    if (locationStatus === "loading") return "جارٍ تحديد موقعك...";
    if (locationStatus === "error") return "لم يتم تحديد الموقع";
    if (!location) return "حدد موقعك لعرض السناتر القريبة";
    return `Lat: ${location.lat.toFixed(4)} · Lng: ${location.lng.toFixed(4)}`;
  }, [location, locationStatus]);

  const centersLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set("tab", "centers");
    if (searchValues.subject) params.set("subject", searchValues.subject);
    if (searchValues.gradeLevel)
      params.set("grade_level", searchValues.gradeLevel);
    return `/search?${params.toString()}`;
  }, [searchValues.gradeLevel, searchValues.subject]);

  const teachersLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set("tab", "teachers");
    if (searchValues.subject) params.set("subject", searchValues.subject);
    if (searchValues.gradeLevel)
      params.set("grade_level", searchValues.gradeLevel);
    return `/search?${params.toString()}`;
  }, [searchValues.gradeLevel, searchValues.subject]);

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-10">
        <section className="rounded-3xl bg-gradient-to-l from-primary/15 to-transparent p-6 md:p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold md:text-3xl">
              اختار المدرس أو السنتر المناسب ليك
            </h1>
            <p className="text-sm text-muted md:text-base">
              اكتشف موادك، قارن المدرسين، واعرف أقرب السناتر في منطقتك.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <SearchBar
              value={searchValues}
              onChange={setSearchValues}
              onSubmit={handleSearchSubmit}
            />

            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">تحديد الموقع</p>
                  {/* <p className="mt-1 text-xs text-muted">{locationLabel}</p> */}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLocation}
                    className="btn-ripple rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
                  >
                    استخدم موقعي الحالي
                  </button>
                  <select
                    value={radius}
                    onChange={(event) =>
                      setRadius(Number(event.target.value) || DEFAULT_RADIUS_KM)
                    }
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
                  >
                    <option value={5}>أقل من 5 كم</option>
                    <option value={10}>أقل من 10 كم</option>
                    <option value={20}>أقل من 20 كم</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">المواد المتاحة</h2>
            <Link href="/search" className="text-sm text-primary">
              عرض الكل
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loadingSubjects ? (
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`subject-skeleton-${index}`}
                  className="skeleton h-12 rounded-2xl"
                />
              ))
            ) : subjectEntries.length === 0 ? (
              <EmptyState
                illustration="📚"
                title="مفيش مواد متاحة حاليًا"
                subtitle="حاول مرة تانية بعد شوية"
              />
            ) : (
              subjectEntries.map((subject) => {
                const isActive = searchValues.subject === subject.value;
                return (
                  <button
                    key={subject.value}
                    type="button"
                    onClick={() =>
                      setSearchValues((prev) => ({
                        ...prev,
                        subject: isActive ? "" : subject.value,
                      }))
                    }
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 text-slate-600 hover:border-primary/40"
                    }`}
                  >
                    <span>{subject.label}</span>
                    <span>{subject.icon}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">مدرسين مقترحين</h2>
            <Link href={teachersLink} className="text-sm text-primary">
              عرض الكل
            </Link>
          </div>
          <div className="mt-4">
            {loadingTeachers ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={`teacher-skeleton-${index}`} />
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <EmptyState
                illustration="👨‍🏫"
                title="مفيش مدرسين متاحين دلوقتي"
                subtitle="جرّب تختار مادة مختلفة"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">السناتر القريبة</h2>
            <Link href={centersLink} className="text-sm text-primary">
              عرض الكل
            </Link>
          </div>
          <div className="mt-4">
            {!location ? (
              <EmptyState
                illustration="📍"
                title="حدد موقعك عشان نعرض السناتر القريبة"
                subtitle="اضغط على زر تحديد الموقع بالأعلى"
              />
            ) : loadingCenters ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={`center-skeleton-${index}`} />
                ))}
              </div>
            ) : centers.length === 0 ? (
              <EmptyState
                illustration="🏫"
                title="مفيش سناتر قريبة دلوقتي"
                subtitle="جرّب تغيّر المسافة أو تبحث يدويًا"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {centers.map((center) => (
                  <CenterCard key={center.id} center={center} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
