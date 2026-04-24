"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import { gradeLevels } from "../lib/constants";
import { ErrorToast } from "./error-toast";
import {ArbicSubjectsMap} from "../register/page";
type SearchValues = {
  query: string;
  gradeLevel: string;
  subject: string;
};

type SearchBarProps = {
  value?: SearchValues;
  onChange?: (values: SearchValues) => void;
  onSubmit?: (values: SearchValues) => void;
  sticky?: boolean;
};

export function SearchBar({ value, onChange, onSubmit, sticky }: SearchBarProps) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [internal, setInternal] = useState<SearchValues>({
    query: "",
    gradeLevel: "",
    subject: "",
  });

  const current = value ?? internal;

  const setValues = useCallback((next: SearchValues) => {
    if (onChange) {
      onChange(next);
    } else {
      setInternal(next);
    }
  }, [onChange]);

  const handleSubmit = useCallback(() => {
    onSubmit?.(current);
  }, [current, onSubmit]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      try {
        setSubjects(Object.values(ArbicSubjectsMap));
      } catch (error) {
        if (active) setToast(getErrorMessage(error)); 
        
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

  const subjectOptions = useMemo(
    () => subjects.filter(Boolean),
    [subjects]
  );

  return (
    <>
      {toast && <ErrorToast message={toast} onClose={() => setToast(null)} />}
      <div
        className={`flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-card md:flex-row md:items-center ${
          sticky ? "sticky top-20" : ""
        }`}
      >
        <label className="sr-only" htmlFor="search-query">
          ابحث عن مركز أو مدرس
        </label>
        <input
          id="search-query"
          value={current.query}
          onChange={(event) =>
            setValues({ ...current, query: event.target.value })
          }
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن مركز أو مدرس..."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <label className="sr-only" htmlFor="search-grade">
          الصف الدراسي
        </label>
        <select
          id="search-grade"
          value={current.gradeLevel}
          onChange={(event) =>
            setValues({ ...current, gradeLevel: event.target.value })
          }
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 md:w-48"
        >
          <option value="">الصف الدراسي</option>
          {gradeLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="search-subject">
          المادة
        </label>
        <select
          id="search-subject"
          value={current.subject}
          onChange={(event) =>
            setValues({ ...current, subject: event.target.value })
          }
          disabled={loadingSubjects}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 md:w-48"
        >
          <option value="">
            {loadingSubjects ? "جارٍ تحميل المواد..." : "المادة"}
          </option>
          {subjectOptions.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSubmit}
          aria-label="ابحث دلوقتي"
          className="btn-ripple w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.97] md:w-40"
        >
          ابحث دلوقتي
        </button>
      </div>
    </>
  );
}
