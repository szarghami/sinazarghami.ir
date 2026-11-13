import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('خطای غیرمنتظره در رابط کاربری:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFCFD] px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-stone-900">مشکلی در نمایش صفحه پیش آمد</h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            صفحه را دوباره بارگذاری کنید. اگر مشکل تکرار شد، یک‌بار کش مرورگر را پاک کنید.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            بارگذاری مجدد
          </button>
        </div>
      </div>
    );
  }
}
