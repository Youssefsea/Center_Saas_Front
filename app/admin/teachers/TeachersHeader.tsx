"use client";

import { memo } from "react";

type TeachersHeaderProps = {
  onAdd: () => void;
};

export const TeachersHeader = memo(function TeachersHeader({ onAdd }: TeachersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">المدرسين</h1>
        <p className="text-sm text-muted font-english" dir="ltr">
          Teachers
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="btn-ripple rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
      >
        إضافة مدرس
      </button>
    </div>
  );
});
