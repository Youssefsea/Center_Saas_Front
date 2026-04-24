"use client";

import React from "react";

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-card">
            <p className="text-lg font-semibold">حصل خطأ غير متوقع</p>
            <p className="mt-2 text-sm text-muted">
              جرّب تحديث الصفحة أو الرجوع بعد قليل.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              aria-label="إعادة تحميل الصفحة"
              className="btn-ripple mt-5 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
